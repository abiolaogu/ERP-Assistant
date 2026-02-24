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
	serviceName = "memory-service"
	moduleName  = "ERP-Assistant"
	basePath    = "/v1/memories"
	dbName      = "erp_assistant"
	tableName   = "assistant_memories"
	eventTopic  = "erp.assistant.memory"
	cacheTTL    = 45 * time.Second
)

var (
	validMemoryTypes = map[string]bool{"preference": true, "context": true, "fact": true, "instruction": true, "conversation": true, "entity": true, "relationship": true}
	validStatuses    = map[string]bool{"active": true, "archived": true, "expired": true, "superseded": true}
)

// ---------------------------------------------------------------------------
// Entity
// ---------------------------------------------------------------------------

type memory struct {
	ID             string  `json:"id"`
	TenantID       string  `json:"tenant_id"`
	UserID         string  `json:"user_id"`
	MemoryType     string  `json:"memory_type"`
	Key            string  `json:"key"`
	Value          string  `json:"value"`
	Source         *string `json:"source,omitempty"`
	Confidence     float64 `json:"confidence"`
	AccessCount    int     `json:"access_count"`
	LastAccessedAt *string `json:"last_accessed_at,omitempty"`
	ExpiresAt      *string `json:"expires_at,omitempty"`
	Status         string  `json:"status"`
	CreatedAt      string  `json:"created_at"`
	UpdatedAt      string  `json:"updated_at"`
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
	List(ctx context.Context, tenantID, cursor string, limit int, filters map[string]string) ([]memory, string, error)
	GetByID(ctx context.Context, tenantID, id string) (*memory, error)
	Create(ctx context.Context, m *memory) error
	Update(ctx context.Context, m *memory) error
	Delete(ctx context.Context, tenantID, id string) error
}

// ---------------------------------------------------------------------------
// Memory store (in-memory)
// ---------------------------------------------------------------------------

type memoryStore struct {
	mu      sync.RWMutex
	records map[string]memory
}

func newMemoryStore() *memoryStore {
	return &memoryStore{records: make(map[string]memory)}
}

func (ms *memoryStore) List(_ context.Context, tenantID, cursor string, limit int, filters map[string]string) ([]memory, string, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	var all []memory
	for _, m := range ms.records {
		if m.TenantID != tenantID {
			continue
		}
		if v, ok := filters["user_id"]; ok && m.UserID != v {
			continue
		}
		if v, ok := filters["memory_type"]; ok && m.MemoryType != v {
			continue
		}
		if v, ok := filters["status"]; ok && m.Status != v {
			continue
		}
		if v, ok := filters["key"]; ok && m.Key != v {
			continue
		}
		all = append(all, m)
	}

	sort.Slice(all, func(i, j int) bool { return all[i].CreatedAt < all[j].CreatedAt })

	start := 0
	if cursor != "" {
		for i, m := range all {
			if m.ID == cursor {
				start = i + 1
				break
			}
		}
	}

	if start >= len(all) {
		return []memory{}, "", nil
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

func (ms *memoryStore) GetByID(_ context.Context, tenantID, id string) (*memory, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()
	m, ok := ms.records[id]
	if !ok || m.TenantID != tenantID {
		return nil, errors.New("not found")
	}
	return &m, nil
}

func (ms *memoryStore) Create(_ context.Context, m *memory) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()
	ms.records[m.ID] = *m
	return nil
}

func (ms *memoryStore) Update(_ context.Context, m *memory) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()
	if _, ok := ms.records[m.ID]; !ok {
		return errors.New("not found")
	}
	ms.records[m.ID] = *m
	return nil
}

func (ms *memoryStore) Delete(_ context.Context, tenantID, id string) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()
	m, ok := ms.records[id]
	if !ok || m.TenantID != tenantID {
		return errors.New("not found")
	}
	delete(ms.records, id)
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
	user_id TEXT NOT NULL,
	memory_type TEXT CHECK (memory_type IN ('preference','context','fact','instruction','conversation','entity','relationship')) NOT NULL,
	key TEXT NOT NULL,
	value TEXT NOT NULL,
	source TEXT,
	confidence NUMERIC(3,2) DEFAULT 1.0,
	access_count INT DEFAULT 0,
	last_accessed_at TIMESTAMPTZ,
	expires_at TIMESTAMPTZ,
	status TEXT CHECK (status IN ('active','archived','expired','superseded')) DEFAULT 'active',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_` + tableName + `_tenant ON ` + tableName + ` (tenant_id);
CREATE INDEX IF NOT EXISTS idx_` + tableName + `_user ON ` + tableName + ` (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_` + tableName + `_type ON ` + tableName + ` (tenant_id, memory_type);
CREATE INDEX IF NOT EXISTS idx_` + tableName + `_key ON ` + tableName + ` (tenant_id, key);`

func (p *postgresStore) List(ctx context.Context, tenantID, cursor string, limit int, filters map[string]string) ([]memory, string, error) {
	query := `SELECT id, tenant_id, user_id, memory_type, key, value, source,
		confidence, access_count, last_accessed_at, expires_at, status, created_at, updated_at
		FROM ` + tableName + ` WHERE tenant_id = $1`
	args := []any{tenantID}
	argIdx := 2

	if v, ok := filters["user_id"]; ok {
		query += fmt.Sprintf(" AND user_id = $%d", argIdx)
		args = append(args, v)
		argIdx++
	}
	if v, ok := filters["memory_type"]; ok {
		query += fmt.Sprintf(" AND memory_type = $%d", argIdx)
		args = append(args, v)
		argIdx++
	}
	if v, ok := filters["status"]; ok {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, v)
		argIdx++
	}
	if v, ok := filters["key"]; ok {
		query += fmt.Sprintf(" AND key = $%d", argIdx)
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

	var results []memory
	for rows.Next() {
		var m memory
		var createdAt, updatedAt, lastAccessedAt, expiresAt sql.NullTime
		var source sql.NullString
		if err := rows.Scan(&m.ID, &m.TenantID, &m.UserID, &m.MemoryType, &m.Key, &m.Value,
			&source, &m.Confidence, &m.AccessCount, &lastAccessedAt, &expiresAt,
			&m.Status, &createdAt, &updatedAt); err != nil {
			return nil, "", fmt.Errorf("scan: %w", err)
		}
		if source.Valid {
			m.Source = &source.String
		}
		if lastAccessedAt.Valid {
			v := lastAccessedAt.Time.Format(time.RFC3339)
			m.LastAccessedAt = &v
		}
		if expiresAt.Valid {
			v := expiresAt.Time.Format(time.RFC3339)
			m.ExpiresAt = &v
		}
		if createdAt.Valid {
			m.CreatedAt = createdAt.Time.Format(time.RFC3339)
		}
		if updatedAt.Valid {
			m.UpdatedAt = updatedAt.Time.Format(time.RFC3339)
		}
		results = append(results, m)
	}

	nextCursor := ""
	if len(results) > limit {
		nextCursor = results[limit-1].ID
		results = results[:limit]
	}

	return results, nextCursor, nil
}

func (p *postgresStore) GetByID(ctx context.Context, tenantID, id string) (*memory, error) {
	query := `SELECT id, tenant_id, user_id, memory_type, key, value, source,
		confidence, access_count, last_accessed_at, expires_at, status, created_at, updated_at
		FROM ` + tableName + ` WHERE id = $1 AND tenant_id = $2`
	var m memory
	var createdAt, updatedAt, lastAccessedAt, expiresAt sql.NullTime
	var source sql.NullString
	err := p.db.QueryRowContext(ctx, query, id, tenantID).Scan(
		&m.ID, &m.TenantID, &m.UserID, &m.MemoryType, &m.Key, &m.Value,
		&source, &m.Confidence, &m.AccessCount, &lastAccessedAt, &expiresAt,
		&m.Status, &createdAt, &updatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("not found")
		}
		return nil, fmt.Errorf("query row: %w", err)
	}
	if source.Valid {
		m.Source = &source.String
	}
	if lastAccessedAt.Valid {
		v := lastAccessedAt.Time.Format(time.RFC3339)
		m.LastAccessedAt = &v
	}
	if expiresAt.Valid {
		v := expiresAt.Time.Format(time.RFC3339)
		m.ExpiresAt = &v
	}
	if createdAt.Valid {
		m.CreatedAt = createdAt.Time.Format(time.RFC3339)
	}
	if updatedAt.Valid {
		m.UpdatedAt = updatedAt.Time.Format(time.RFC3339)
	}
	return &m, nil
}

func (p *postgresStore) Create(ctx context.Context, m *memory) error {
	query := `INSERT INTO ` + tableName + ` (id, tenant_id, user_id, memory_type, key, value,
		source, confidence, access_count, last_accessed_at, expires_at, status,
		created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`
	_, err := p.db.ExecContext(ctx, query,
		m.ID, m.TenantID, m.UserID, m.MemoryType, m.Key, m.Value,
		m.Source, m.Confidence, m.AccessCount,
		parseTimePtr(m.LastAccessedAt), parseTimePtr(m.ExpiresAt), m.Status,
		parseTime(m.CreatedAt), parseTime(m.UpdatedAt))
	return err
}

func (p *postgresStore) Update(ctx context.Context, m *memory) error {
	query := `UPDATE ` + tableName + ` SET user_id=$1, memory_type=$2, key=$3, value=$4,
		source=$5, confidence=$6, access_count=$7, last_accessed_at=$8, expires_at=$9,
		status=$10, updated_at=$11
		WHERE id=$12 AND tenant_id=$13`
	res, err := p.db.ExecContext(ctx, query,
		m.UserID, m.MemoryType, m.Key, m.Value,
		m.Source, m.Confidence, m.AccessCount,
		parseTimePtr(m.LastAccessedAt), parseTimePtr(m.ExpiresAt),
		m.Status, parseTime(m.UpdatedAt), m.ID, m.TenantID)
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

func (sv *server) handleList(w http.ResponseWriter, r *http.Request) {
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
	for _, k := range []string{"user_id", "memory_type", "status", "key"} {
		if v := r.URL.Query().Get(k); v != "" {
			filters[k] = v
		}
	}

	cacheKey := fmt.Sprintf("list:%s:%s:%d:%v", tenantID, cursor, limit, filters)
	if cached, ok := sv.cache.get(cacheKey); ok {
		writeJSON(w, http.StatusOK, cached)
		return
	}

	items, nextCursor, err := sv.store.List(r.Context(), tenantID, cursor, limit, filters)
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
	sv.cache.set(cacheKey, resp)
	writeJSON(w, http.StatusOK, resp)
}

func (sv *server) handleGet(w http.ResponseWriter, r *http.Request, id string) {
	tenantID := r.Header.Get("X-Tenant-ID")

	cacheKey := fmt.Sprintf("get:%s:%s", tenantID, id)
	if cached, ok := sv.cache.get(cacheKey); ok {
		writeJSON(w, http.StatusOK, cached)
		return
	}

	item, err := sv.store.GetByID(r.Context(), tenantID, id)
	if err != nil {
		if err.Error() == "not found" {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	resp := map[string]any{"item": item, "event_topic": eventTopic + ".read"}
	sv.cache.set(cacheKey, resp)
	writeJSON(w, http.StatusOK, resp)
}

func (sv *server) handleCreate(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Header.Get("X-Tenant-ID")

	body, err := readJSON(r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON: " + err.Error()})
		return
	}

	userID, _ := body["user_id"].(string)
	if userID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "user_id is required"})
		return
	}
	memoryType, _ := body["memory_type"].(string)
	if !validMemoryTypes[memoryType] {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "memory_type is required and must be one of: preference, context, fact, instruction, conversation, entity, relationship"})
		return
	}
	key, _ := body["key"].(string)
	if key == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "key is required"})
		return
	}
	value, _ := body["value"].(string)
	if value == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "value is required"})
		return
	}

	now := time.Now().UTC().Format(time.RFC3339)
	m := &memory{
		ID:          newID(),
		TenantID:    tenantID,
		UserID:      userID,
		MemoryType:  memoryType,
		Key:         key,
		Value:       value,
		Source:      strPtr(body["source"]),
		Confidence:  1.0,
		AccessCount: 0,
		Status:      "active",
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if v, ok := body["confidence"].(float64); ok && v >= 0 && v <= 1 {
		m.Confidence = v
	}
	if v, ok := body["access_count"].(float64); ok {
		m.AccessCount = int(v)
	}
	if v, ok := body["status"].(string); ok && validStatuses[v] {
		m.Status = v
	}
	if v, ok := body["last_accessed_at"].(string); ok {
		m.LastAccessedAt = &v
	}
	if v, ok := body["expires_at"].(string); ok {
		m.ExpiresAt = &v
	}

	if err := sv.store.Create(r.Context(), m); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	sv.cache.invalidate("list:" + tenantID)
	writeJSON(w, http.StatusCreated, map[string]any{"item": m, "event_topic": eventTopic + ".created"})
}

func (sv *server) handleUpdate(w http.ResponseWriter, r *http.Request, id string) {
	tenantID := r.Header.Get("X-Tenant-ID")

	existing, err := sv.store.GetByID(r.Context(), tenantID, id)
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

	if v, ok := body["user_id"].(string); ok && v != "" {
		existing.UserID = v
	}
	if v, ok := body["memory_type"].(string); ok && validMemoryTypes[v] {
		existing.MemoryType = v
	}
	if v, ok := body["key"].(string); ok && v != "" {
		existing.Key = v
	}
	if v, ok := body["value"].(string); ok && v != "" {
		existing.Value = v
	}
	if v, exists := body["source"]; exists {
		existing.Source = strPtr(v)
	}
	if v, ok := body["confidence"].(float64); ok && v >= 0 && v <= 1 {
		existing.Confidence = v
	}
	if v, ok := body["access_count"].(float64); ok {
		existing.AccessCount = int(v)
	}
	if v, ok := body["last_accessed_at"].(string); ok {
		existing.LastAccessedAt = &v
	}
	if v, ok := body["expires_at"].(string); ok {
		existing.ExpiresAt = &v
	}
	if v, ok := body["status"].(string); ok && validStatuses[v] {
		existing.Status = v
	}
	existing.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	if err := sv.store.Update(r.Context(), existing); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	sv.cache.invalidate("list:" + tenantID)
	sv.cache.invalidate("get:" + tenantID + ":" + id)
	writeJSON(w, http.StatusOK, map[string]any{"item": existing, "event_topic": eventTopic + ".updated"})
}

func (sv *server) handleDelete(w http.ResponseWriter, r *http.Request, id string) {
	tenantID := r.Header.Get("X-Tenant-ID")

	if err := sv.store.Delete(r.Context(), tenantID, id); err != nil {
		if err.Error() == "not found" {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	sv.cache.invalidate("list:" + tenantID)
	sv.cache.invalidate("get:" + tenantID + ":" + id)
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
		"entity":      "memory",
		"fields": []string{
			"id", "tenant_id", "user_id", "memory_type", "key", "value", "source",
			"confidence", "access_count", "last_accessed_at", "expires_at", "status",
			"created_at", "updated_at",
		},
		"filters":    []string{"user_id", "memory_type", "status", "key"},
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
