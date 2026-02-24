package main

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const (
	serviceName = "action-engine"
	moduleName  = "ERP-Assistant"
	basePath    = "/v1/actions"
	dbName      = "erp_assistant"
	tableName   = "assistant_actions"
	eventTopic  = "erp.assistant.action"
	cacheTTL    = 45 * time.Second
)

var (
	validActionTypes = map[string]bool{"api_call": true, "database_query": true, "workflow": true, "notification": true, "file_operation": true, "approval": true, "custom": true}
	validStatuses    = map[string]bool{"active": true, "draft": true, "disabled": true, "deprecated": true}
)

// ---------------------------------------------------------------------------
// Entity
// ---------------------------------------------------------------------------

type action struct {
	ID                string  `json:"id"`
	TenantID          string  `json:"tenant_id"`
	Name              string  `json:"name"`
	Description       *string `json:"description,omitempty"`
	ActionType        string  `json:"action_type"`
	TargetService     *string `json:"target_service,omitempty"`
	ParametersJSON    *string `json:"parameters_json,omitempty"`
	PreconditionsJSON *string `json:"preconditions_json,omitempty"`
	PostconditionsJSON *string `json:"postconditions_json,omitempty"`
	RequiresApproval  bool    `json:"requires_approval"`
	ExecutionCount    int     `json:"execution_count"`
	AvgDurationMs     int     `json:"avg_duration_ms"`
	Status            string  `json:"status"`
	CreatedAt         string  `json:"created_at"`
	UpdatedAt         string  `json:"updated_at"`
}

// ---------------------------------------------------------------------------
// ID generator
// ---------------------------------------------------------------------------

func newID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// ---------------------------------------------------------------------------
// JSON helpers
// ---------------------------------------------------------------------------

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func readJSON(r *http.Request) (map[string]any, error) {
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		return nil, err
	}
	defer r.Body.Close()
	if len(body) == 0 {
		return nil, errors.New("empty body")
	}
	var m map[string]any
	if err := json.Unmarshal(body, &m); err != nil {
		return nil, err
	}
	return m, nil
}

func strPtr(v any) *string {
	if v == nil {
		return nil
	}
	s := fmt.Sprintf("%v", v)
	return &s
}

func strVal(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

type cacheEntry struct {
	data      any
	expiresAt time.Time
}

type ttlCache struct {
	mu      sync.RWMutex
	entries map[string]cacheEntry
}

func newCache() *ttlCache {
	c := &ttlCache{entries: make(map[string]cacheEntry)}
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			c.evict()
		}
	}()
	return c
}

func (c *ttlCache) get(key string) (any, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	e, ok := c.entries[key]
	if !ok || time.Now().After(e.expiresAt) {
		return nil, false
	}
	return e.data, true
}

func (c *ttlCache) set(key string, data any) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.entries[key] = cacheEntry{data: data, expiresAt: time.Now().Add(cacheTTL)}
}

func (c *ttlCache) invalidate(prefix string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	for k := range c.entries {
		if strings.HasPrefix(k, prefix) {
			delete(c.entries, k)
		}
	}
}

func (c *ttlCache) evict() {
	c.mu.Lock()
	defer c.mu.Unlock()
	now := time.Now()
	for k, e := range c.entries {
		if now.After(e.expiresAt) {
			delete(c.entries, k)
		}
	}
}

// ---------------------------------------------------------------------------
// Request counter
// ---------------------------------------------------------------------------

var requestCount atomic.Int64

// ---------------------------------------------------------------------------
// Security headers middleware
// ---------------------------------------------------------------------------

func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		next.ServeHTTP(w, r)
	})
}

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

type store interface {
	List(ctx context.Context, tenantID, cursor string, limit int, filters map[string]string) ([]action, string, error)
	GetByID(ctx context.Context, tenantID, id string) (*action, error)
	Create(ctx context.Context, a *action) error
	Update(ctx context.Context, a *action) error
	Delete(ctx context.Context, tenantID, id string) error
}

// ---------------------------------------------------------------------------
// Memory store
// ---------------------------------------------------------------------------

type memoryStore struct {
	mu      sync.RWMutex
	records map[string]action
}

func newMemoryStore() *memoryStore {
	return &memoryStore{records: make(map[string]action)}
}

func (m *memoryStore) List(_ context.Context, tenantID, cursor string, limit int, filters map[string]string) ([]action, string, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var all []action
	for _, a := range m.records {
		if a.TenantID != tenantID {
			continue
		}
		if v, ok := filters["action_type"]; ok && a.ActionType != v {
			continue
		}
		if v, ok := filters["status"]; ok && a.Status != v {
			continue
		}
		if v, ok := filters["target_service"]; ok && strVal(a.TargetService) != v {
			continue
		}
		all = append(all, a)
	}

	sort.Slice(all, func(i, j int) bool { return all[i].CreatedAt < all[j].CreatedAt })

	start := 0
	if cursor != "" {
		for i, a := range all {
			if a.ID == cursor {
				start = i + 1
				break
			}
		}
	}

	if start >= len(all) {
		return []action{}, "", nil
	}

	end := start + limit
	if end > len(all) {
		end = len(all)
	}

	result := all[start:end]
	nextCursor := ""
	if end < len(all) {
		nextCursor = result[len(result)-1].ID
	}

	return result, nextCursor, nil
}

func (m *memoryStore) GetByID(_ context.Context, tenantID, id string) (*action, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	a, ok := m.records[id]
	if !ok || a.TenantID != tenantID {
		return nil, errors.New("not found")
	}
	return &a, nil
}

func (m *memoryStore) Create(_ context.Context, a *action) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.records[a.ID] = *a
	return nil
}

func (m *memoryStore) Update(_ context.Context, a *action) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.records[a.ID]; !ok {
		return errors.New("not found")
	}
	m.records[a.ID] = *a
	return nil
}

func (m *memoryStore) Delete(_ context.Context, tenantID, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	a, ok := m.records[id]
	if !ok || a.TenantID != tenantID {
		return errors.New("not found")
	}
	delete(m.records, id)
	return nil
}

// ---------------------------------------------------------------------------
// Postgres store
// ---------------------------------------------------------------------------

type postgresStore struct {
	db *sql.DB
}

func newPostgresStore(dsn string) (*postgresStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}

	if _, err := db.ExecContext(ctx, createTableSQL); err != nil {
		return nil, fmt.Errorf("create table: %w", err)
	}

	return &postgresStore{db: db}, nil
}

const createTableSQL = `CREATE TABLE IF NOT EXISTS ` + tableName + ` (
	id TEXT PRIMARY KEY,
	tenant_id TEXT NOT NULL,
	name TEXT NOT NULL,
	description TEXT,
	action_type TEXT CHECK (action_type IN ('api_call','database_query','workflow','notification','file_operation','approval','custom')) NOT NULL,
	target_service TEXT,
	parameters_json TEXT,
	preconditions_json TEXT,
	postconditions_json TEXT,
	requires_approval BOOLEAN DEFAULT false,
	execution_count INT DEFAULT 0,
	avg_duration_ms INT DEFAULT 0,
	status TEXT CHECK (status IN ('active','draft','disabled','deprecated')) DEFAULT 'draft',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_` + tableName + `_tenant ON ` + tableName + ` (tenant_id);
CREATE INDEX IF NOT EXISTS idx_` + tableName + `_type ON ` + tableName + ` (tenant_id, action_type);
CREATE INDEX IF NOT EXISTS idx_` + tableName + `_status ON ` + tableName + ` (tenant_id, status);`

func (p *postgresStore) List(ctx context.Context, tenantID, cursor string, limit int, filters map[string]string) ([]action, string, error) {
	query := `SELECT id, tenant_id, name, description, action_type, target_service,
		parameters_json, preconditions_json, postconditions_json, requires_approval,
		execution_count, avg_duration_ms, status, created_at, updated_at
		FROM ` + tableName + ` WHERE tenant_id = $1`
	args := []any{tenantID}
	argIdx := 2

	if v, ok := filters["action_type"]; ok {
		query += fmt.Sprintf(" AND action_type = $%d", argIdx)
		args = append(args, v)
		argIdx++
	}
	if v, ok := filters["status"]; ok {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, v)
		argIdx++
	}
	if v, ok := filters["target_service"]; ok {
		query += fmt.Sprintf(" AND target_service = $%d", argIdx)
		args = append(args, v)
		argIdx++
	}

	if cursor != "" {
		query += fmt.Sprintf(" AND created_at > (SELECT created_at FROM "+tableName+" WHERE id = $%d)", argIdx)
		args = append(args, cursor)
		argIdx++
	}

	query += " ORDER BY created_at ASC"
	query += fmt.Sprintf(" LIMIT $%d", argIdx)
	args = append(args, limit+1)

	rows, err := p.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, "", fmt.Errorf("query: %w", err)
	}
	defer rows.Close()

	var results []action
	for rows.Next() {
		var a action
		var createdAt, updatedAt sql.NullTime
		var description, targetService, parametersJSON, preconditionsJSON, postconditionsJSON sql.NullString
		if err := rows.Scan(&a.ID, &a.TenantID, &a.Name, &description, &a.ActionType,
			&targetService, &parametersJSON, &preconditionsJSON, &postconditionsJSON,
			&a.RequiresApproval, &a.ExecutionCount, &a.AvgDurationMs, &a.Status,
			&createdAt, &updatedAt); err != nil {
			return nil, "", fmt.Errorf("scan: %w", err)
		}
		if description.Valid {
			a.Description = &description.String
		}
		if targetService.Valid {
			a.TargetService = &targetService.String
		}
		if parametersJSON.Valid {
			a.ParametersJSON = &parametersJSON.String
		}
		if preconditionsJSON.Valid {
			a.PreconditionsJSON = &preconditionsJSON.String
		}
		if postconditionsJSON.Valid {
			a.PostconditionsJSON = &postconditionsJSON.String
		}
		if createdAt.Valid {
			a.CreatedAt = createdAt.Time.Format(time.RFC3339)
		}
		if updatedAt.Valid {
			a.UpdatedAt = updatedAt.Time.Format(time.RFC3339)
		}
		results = append(results, a)
	}

	nextCursor := ""
	if len(results) > limit {
		nextCursor = results[limit-1].ID
		results = results[:limit]
	}

	return results, nextCursor, nil
}

func (p *postgresStore) GetByID(ctx context.Context, tenantID, id string) (*action, error) {
	query := `SELECT id, tenant_id, name, description, action_type, target_service,
		parameters_json, preconditions_json, postconditions_json, requires_approval,
		execution_count, avg_duration_ms, status, created_at, updated_at
		FROM ` + tableName + ` WHERE id = $1 AND tenant_id = $2`
	var a action
	var createdAt, updatedAt sql.NullTime
	var description, targetService, parametersJSON, preconditionsJSON, postconditionsJSON sql.NullString
	err := p.db.QueryRowContext(ctx, query, id, tenantID).Scan(
		&a.ID, &a.TenantID, &a.Name, &description, &a.ActionType,
		&targetService, &parametersJSON, &preconditionsJSON, &postconditionsJSON,
		&a.RequiresApproval, &a.ExecutionCount, &a.AvgDurationMs, &a.Status,
		&createdAt, &updatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("not found")
		}
		return nil, fmt.Errorf("query row: %w", err)
	}
	if description.Valid {
		a.Description = &description.String
	}
	if targetService.Valid {
		a.TargetService = &targetService.String
	}
	if parametersJSON.Valid {
		a.ParametersJSON = &parametersJSON.String
	}
	if preconditionsJSON.Valid {
		a.PreconditionsJSON = &preconditionsJSON.String
	}
	if postconditionsJSON.Valid {
		a.PostconditionsJSON = &postconditionsJSON.String
	}
	if createdAt.Valid {
		a.CreatedAt = createdAt.Time.Format(time.RFC3339)
	}
	if updatedAt.Valid {
		a.UpdatedAt = updatedAt.Time.Format(time.RFC3339)
	}
	return &a, nil
}

func (p *postgresStore) Create(ctx context.Context, a *action) error {
	query := `INSERT INTO ` + tableName + ` (id, tenant_id, name, description, action_type,
		target_service, parameters_json, preconditions_json, postconditions_json,
		requires_approval, execution_count, avg_duration_ms, status, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`
	_, err := p.db.ExecContext(ctx, query,
		a.ID, a.TenantID, a.Name, a.Description, a.ActionType,
		a.TargetService, a.ParametersJSON, a.PreconditionsJSON, a.PostconditionsJSON,
		a.RequiresApproval, a.ExecutionCount, a.AvgDurationMs, a.Status,
		parseTime(a.CreatedAt), parseTime(a.UpdatedAt))
	return err
}

func (p *postgresStore) Update(ctx context.Context, a *action) error {
	query := `UPDATE ` + tableName + ` SET name=$1, description=$2, action_type=$3,
		target_service=$4, parameters_json=$5, preconditions_json=$6, postconditions_json=$7,
		requires_approval=$8, execution_count=$9, avg_duration_ms=$10, status=$11, updated_at=$12
		WHERE id=$13 AND tenant_id=$14`
	res, err := p.db.ExecContext(ctx, query,
		a.Name, a.Description, a.ActionType,
		a.TargetService, a.ParametersJSON, a.PreconditionsJSON, a.PostconditionsJSON,
		a.RequiresApproval, a.ExecutionCount, a.AvgDurationMs, a.Status,
		parseTime(a.UpdatedAt), a.ID, a.TenantID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return errors.New("not found")
	}
	return nil
}

func (p *postgresStore) Delete(ctx context.Context, tenantID, id string) error {
	res, err := p.db.ExecContext(ctx, `DELETE FROM `+tableName+` WHERE id=$1 AND tenant_id=$2`, id, tenantID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return errors.New("not found")
	}
	return nil
}

func parseTime(s string) time.Time {
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		return time.Now()
	}
	return t
}

func parseTimePtr(s *string) *time.Time {
	if s == nil {
		return nil
	}
	t, err := time.Parse(time.RFC3339, *s)
	if err != nil {
		return nil
	}
	return &t
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

type server struct {
	store store
	cache *ttlCache
}

func (s *server) handleList(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Header.Get("X-Tenant-ID")

	cursor := r.URL.Query().Get("cursor")
	limitStr := r.URL.Query().Get("limit")
	limit := 20
	if limitStr != "" {
		if v, err := strconv.Atoi(limitStr); err == nil && v > 0 && v <= 100 {
			limit = v
		}
	}

	filters := make(map[string]string)
	for _, key := range []string{"action_type", "status", "target_service"} {
		if v := r.URL.Query().Get(key); v != "" {
			filters[key] = v
		}
	}

	cacheKey := fmt.Sprintf("list:%s:%s:%d:%v", tenantID, cursor, limit, filters)
	if cached, ok := s.cache.get(cacheKey); ok {
		writeJSON(w, http.StatusOK, cached)
		return
	}

	items, nextCursor, err := s.store.List(r.Context(), tenantID, cursor, limit, filters)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	resp := map[string]any{
		"items":       items,
		"next_cursor": nextCursor,
		"limit":       limit,
		"count":       len(items),
		"event_topic": eventTopic + ".listed",
	}
	s.cache.set(cacheKey, resp)
	writeJSON(w, http.StatusOK, resp)
}

func (s *server) handleGet(w http.ResponseWriter, r *http.Request, id string) {
	tenantID := r.Header.Get("X-Tenant-ID")

	cacheKey := fmt.Sprintf("get:%s:%s", tenantID, id)
	if cached, ok := s.cache.get(cacheKey); ok {
		writeJSON(w, http.StatusOK, cached)
		return
	}

	item, err := s.store.GetByID(r.Context(), tenantID, id)
	if err != nil {
		if err.Error() == "not found" {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	resp := map[string]any{"item": item, "event_topic": eventTopic + ".read"}
	s.cache.set(cacheKey, resp)
	writeJSON(w, http.StatusOK, resp)
}

func (s *server) handleCreate(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Header.Get("X-Tenant-ID")

	body, err := readJSON(r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON: " + err.Error()})
		return
	}

	name, _ := body["name"].(string)
	if name == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "name is required"})
		return
	}

	actionType, _ := body["action_type"].(string)
	if !validActionTypes[actionType] {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "action_type is required and must be one of: api_call, database_query, workflow, notification, file_operation, approval, custom"})
		return
	}

	now := time.Now().UTC().Format(time.RFC3339)
	a := &action{
		ID:                 newID(),
		TenantID:           tenantID,
		Name:               name,
		Description:        strPtr(body["description"]),
		ActionType:         actionType,
		TargetService:      strPtr(body["target_service"]),
		ParametersJSON:     strPtr(body["parameters_json"]),
		PreconditionsJSON:  strPtr(body["preconditions_json"]),
		PostconditionsJSON: strPtr(body["postconditions_json"]),
		RequiresApproval:   false,
		ExecutionCount:     0,
		AvgDurationMs:      0,
		Status:             "draft",
		CreatedAt:          now,
		UpdatedAt:          now,
	}

	if v, ok := body["requires_approval"].(bool); ok {
		a.RequiresApproval = v
	}
	if v, ok := body["execution_count"].(float64); ok {
		a.ExecutionCount = int(v)
	}
	if v, ok := body["avg_duration_ms"].(float64); ok {
		a.AvgDurationMs = int(v)
	}
	if v, ok := body["status"].(string); ok && validStatuses[v] {
		a.Status = v
	}

	if err := s.store.Create(r.Context(), a); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	s.cache.invalidate("list:" + tenantID)
	writeJSON(w, http.StatusCreated, map[string]any{"item": a, "event_topic": eventTopic + ".created"})
}

func (s *server) handleUpdate(w http.ResponseWriter, r *http.Request, id string) {
	tenantID := r.Header.Get("X-Tenant-ID")

	existing, err := s.store.GetByID(r.Context(), tenantID, id)
	if err != nil {
		if err.Error() == "not found" {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	body, err := readJSON(r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON: " + err.Error()})
		return
	}

	if v, ok := body["name"].(string); ok && v != "" {
		existing.Name = v
	}
	if v, exists := body["description"]; exists {
		existing.Description = strPtr(v)
	}
	if v, ok := body["action_type"].(string); ok && validActionTypes[v] {
		existing.ActionType = v
	}
	if v, exists := body["target_service"]; exists {
		existing.TargetService = strPtr(v)
	}
	if v, exists := body["parameters_json"]; exists {
		existing.ParametersJSON = strPtr(v)
	}
	if v, exists := body["preconditions_json"]; exists {
		existing.PreconditionsJSON = strPtr(v)
	}
	if v, exists := body["postconditions_json"]; exists {
		existing.PostconditionsJSON = strPtr(v)
	}
	if v, ok := body["requires_approval"].(bool); ok {
		existing.RequiresApproval = v
	}
	if v, ok := body["execution_count"].(float64); ok {
		existing.ExecutionCount = int(v)
	}
	if v, ok := body["avg_duration_ms"].(float64); ok {
		existing.AvgDurationMs = int(v)
	}
	if v, ok := body["status"].(string); ok && validStatuses[v] {
		existing.Status = v
	}
	existing.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	if err := s.store.Update(r.Context(), existing); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	s.cache.invalidate("list:" + tenantID)
	s.cache.invalidate("get:" + tenantID + ":" + id)
	writeJSON(w, http.StatusOK, map[string]any{"item": existing, "event_topic": eventTopic + ".updated"})
}

func (s *server) handleDelete(w http.ResponseWriter, r *http.Request, id string) {
	tenantID := r.Header.Get("X-Tenant-ID")

	if err := s.store.Delete(r.Context(), tenantID, id); err != nil {
		if err.Error() == "not found" {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	s.cache.invalidate("list:" + tenantID)
	s.cache.invalidate("get:" + tenantID + ":" + id)
	writeJSON(w, http.StatusOK, map[string]any{"deleted": true, "id": id, "event_topic": eventTopic + ".deleted"})
}

// ---------------------------------------------------------------------------
// Explain endpoint
// ---------------------------------------------------------------------------

func handleExplain(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"service":     serviceName,
		"module":      moduleName,
		"base_path":   basePath,
		"database":    dbName,
		"table":       tableName,
		"event_topic": eventTopic,
		"entity":      "action",
		"fields": []string{
			"id", "tenant_id", "name", "description", "action_type", "target_service",
			"parameters_json", "preconditions_json", "postconditions_json",
			"requires_approval", "execution_count", "avg_duration_ms", "status",
			"created_at", "updated_at",
		},
		"filters":    []string{"action_type", "status", "target_service"},
		"pagination": "cursor-based",
		"cache_ttl":  cacheTTL.String(),
		"endpoints": map[string]string{
			"list":   "GET " + basePath,
			"get":    "GET " + basePath + "/{id}",
			"create": "POST " + basePath,
			"update": "PUT/PATCH " + basePath + "/{id}",
			"delete": "DELETE " + basePath + "/{id}",
		},
	})
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	var st store
	dsn := os.Getenv("DATABASE_URL")
	if dsn != "" {
		pg, err := newPostgresStore(dsn)
		if err != nil {
			log.Fatalf("postgres: %v", err)
		}
		st = pg
		log.Println("Using PostgreSQL store")
	} else {
		st = newMemoryStore()
		log.Println("Using in-memory store (set DATABASE_URL for PostgreSQL)")
	}

	cache := newCache()
	srv := &server{store: st, cache: cache}

	mux := http.NewServeMux()

	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{
			"status":  "healthy",
			"module":  moduleName,
			"service": serviceName,
		})
	})

	mux.HandleFunc("/readyz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ready"})
	})

	mux.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{
			"requests_total": requestCount.Load(),
			"service":        serviceName,
		})
	})

	mux.HandleFunc(basePath+"/_explain", handleExplain)

	mux.HandleFunc(basePath, func(w http.ResponseWriter, r *http.Request) {
		requestCount.Add(1)
		tenantID := r.Header.Get("X-Tenant-ID")
		if tenantID == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "missing X-Tenant-ID header"})
			return
		}
		switch r.Method {
		case http.MethodGet:
			srv.handleList(w, r)
		case http.MethodPost:
			srv.handleCreate(w, r)
		default:
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		}
	})

	mux.HandleFunc(basePath+"/", func(w http.ResponseWriter, r *http.Request) {
		requestCount.Add(1)
		tenantID := r.Header.Get("X-Tenant-ID")
		if tenantID == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "missing X-Tenant-ID header"})
			return
		}
		id := strings.TrimPrefix(r.URL.Path, basePath+"/")
		if id == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "missing id"})
			return
		}
		switch r.Method {
		case http.MethodGet:
			srv.handleGet(w, r, id)
		case http.MethodPut, http.MethodPatch:
			srv.handleUpdate(w, r, id)
		case http.MethodDelete:
			srv.handleDelete(w, r, id)
		default:
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		}
	})

	handler := securityHeaders(mux)

	log.Printf("%s listening on :%s", serviceName, port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
