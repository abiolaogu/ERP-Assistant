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
	serviceName = "assistant-core"
	moduleName  = "ERP-Assistant"
	basePath    = "/v1/assistant-sessions"
	dbName      = "erp_assistant"
	tableName   = "assistant_sessions"
	eventTopic  = "erp.assistant.session"
	cacheTTL    = 45 * time.Second
)

var (
	validStatuses = map[string]bool{"active": true, "completed": true, "failed": true, "timeout": true}
)

// ---------------------------------------------------------------------------
// Entity
// ---------------------------------------------------------------------------

type assistantSession struct {
	ID                string  `json:"id"`
	TenantID          string  `json:"tenant_id"`
	UserID            string  `json:"user_id"`
	ContextModule     *string `json:"context_module,omitempty"`
	ConversationJSON  *string `json:"conversation_json,omitempty"`
	Intent            *string `json:"intent,omitempty"`
	EntitiesJSON      *string `json:"entities_json,omitempty"`
	ActionsTakenJSON  *string `json:"actions_taken_json,omitempty"`
	ModelUsed         *string `json:"model_used,omitempty"`
	TotalTokens       int     `json:"total_tokens"`
	SatisfactionScore *int    `json:"satisfaction_score,omitempty"`
	Status            string  `json:"status"`
	StartedAt         *string `json:"started_at,omitempty"`
	EndedAt           *string `json:"ended_at,omitempty"`
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

func intPtr(v any) *int {
	if v == nil {
		return nil
	}
	if f, ok := v.(float64); ok {
		i := int(f)
		return &i
	}
	return nil
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
	List(ctx context.Context, tenantID, cursor string, limit int, filters map[string]string) ([]assistantSession, string, error)
	GetByID(ctx context.Context, tenantID, id string) (*assistantSession, error)
	Create(ctx context.Context, s *assistantSession) error
	Update(ctx context.Context, s *assistantSession) error
	Delete(ctx context.Context, tenantID, id string) error
}

// ---------------------------------------------------------------------------
// Memory store
// ---------------------------------------------------------------------------

type memoryStore struct {
	mu      sync.RWMutex
	records map[string]assistantSession
}

func newMemoryStore() *memoryStore {
	return &memoryStore{records: make(map[string]assistantSession)}
}

func (m *memoryStore) List(_ context.Context, tenantID, cursor string, limit int, filters map[string]string) ([]assistantSession, string, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var all []assistantSession
	for _, s := range m.records {
		if s.TenantID != tenantID {
			continue
		}
		if v, ok := filters["user_id"]; ok && s.UserID != v {
			continue
		}
		if v, ok := filters["status"]; ok && s.Status != v {
			continue
		}
		if v, ok := filters["context_module"]; ok && strVal(s.ContextModule) != v {
			continue
		}
		all = append(all, s)
	}

	sort.Slice(all, func(i, j int) bool { return all[i].CreatedAt < all[j].CreatedAt })

	start := 0
	if cursor != "" {
		for i, s := range all {
			if s.ID == cursor {
				start = i + 1
				break
			}
		}
	}

	if start >= len(all) {
		return []assistantSession{}, "", nil
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

func (m *memoryStore) GetByID(_ context.Context, tenantID, id string) (*assistantSession, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	s, ok := m.records[id]
	if !ok || s.TenantID != tenantID {
		return nil, errors.New("not found")
	}
	return &s, nil
}

func (m *memoryStore) Create(_ context.Context, s *assistantSession) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.records[s.ID] = *s
	return nil
}

func (m *memoryStore) Update(_ context.Context, s *assistantSession) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.records[s.ID]; !ok {
		return errors.New("not found")
	}
	m.records[s.ID] = *s
	return nil
}

func (m *memoryStore) Delete(_ context.Context, tenantID, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	s, ok := m.records[id]
	if !ok || s.TenantID != tenantID {
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
	user_id TEXT NOT NULL,
	context_module TEXT,
	conversation_json TEXT,
	intent TEXT,
	entities_json TEXT,
	actions_taken_json TEXT,
	model_used TEXT,
	total_tokens INT DEFAULT 0,
	satisfaction_score INT,
	status TEXT CHECK (status IN ('active','completed','failed','timeout')) DEFAULT 'active',
	started_at TIMESTAMPTZ,
	ended_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_` + tableName + `_tenant ON ` + tableName + ` (tenant_id);
CREATE INDEX IF NOT EXISTS idx_` + tableName + `_user ON ` + tableName + ` (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_` + tableName + `_status ON ` + tableName + ` (tenant_id, status);`

func (p *postgresStore) List(ctx context.Context, tenantID, cursor string, limit int, filters map[string]string) ([]assistantSession, string, error) {
	query := `SELECT id, tenant_id, user_id, context_module, conversation_json, intent,
		entities_json, actions_taken_json, model_used, total_tokens, satisfaction_score,
		status, started_at, ended_at, created_at, updated_at
		FROM ` + tableName + ` WHERE tenant_id = $1`
	args := []any{tenantID}
	argIdx := 2

	if v, ok := filters["user_id"]; ok {
		query += fmt.Sprintf(" AND user_id = $%d", argIdx)
		args = append(args, v)
		argIdx++
	}
	if v, ok := filters["status"]; ok {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, v)
		argIdx++
	}
	if v, ok := filters["context_module"]; ok {
		query += fmt.Sprintf(" AND context_module = $%d", argIdx)
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

	var results []assistantSession
	for rows.Next() {
		var s assistantSession
		var createdAt, updatedAt, startedAt, endedAt sql.NullTime
		var contextModule, conversationJSON, intent, entitiesJSON, actionsTakenJSON, modelUsed sql.NullString
		var satisfactionScore sql.NullInt64
		if err := rows.Scan(&s.ID, &s.TenantID, &s.UserID, &contextModule, &conversationJSON,
			&intent, &entitiesJSON, &actionsTakenJSON, &modelUsed, &s.TotalTokens,
			&satisfactionScore, &s.Status, &startedAt, &endedAt, &createdAt, &updatedAt); err != nil {
			return nil, "", fmt.Errorf("scan: %w", err)
		}
		if contextModule.Valid {
			s.ContextModule = &contextModule.String
		}
		if conversationJSON.Valid {
			s.ConversationJSON = &conversationJSON.String
		}
		if intent.Valid {
			s.Intent = &intent.String
		}
		if entitiesJSON.Valid {
			s.EntitiesJSON = &entitiesJSON.String
		}
		if actionsTakenJSON.Valid {
			s.ActionsTakenJSON = &actionsTakenJSON.String
		}
		if modelUsed.Valid {
			s.ModelUsed = &modelUsed.String
		}
		if satisfactionScore.Valid {
			v := int(satisfactionScore.Int64)
			s.SatisfactionScore = &v
		}
		if startedAt.Valid {
			v := startedAt.Time.Format(time.RFC3339)
			s.StartedAt = &v
		}
		if endedAt.Valid {
			v := endedAt.Time.Format(time.RFC3339)
			s.EndedAt = &v
		}
		if createdAt.Valid {
			s.CreatedAt = createdAt.Time.Format(time.RFC3339)
		}
		if updatedAt.Valid {
			s.UpdatedAt = updatedAt.Time.Format(time.RFC3339)
		}
		results = append(results, s)
	}

	nextCursor := ""
	if len(results) > limit {
		nextCursor = results[limit-1].ID
		results = results[:limit]
	}

	return results, nextCursor, nil
}

func (p *postgresStore) GetByID(ctx context.Context, tenantID, id string) (*assistantSession, error) {
	query := `SELECT id, tenant_id, user_id, context_module, conversation_json, intent,
		entities_json, actions_taken_json, model_used, total_tokens, satisfaction_score,
		status, started_at, ended_at, created_at, updated_at
		FROM ` + tableName + ` WHERE id = $1 AND tenant_id = $2`
	var s assistantSession
	var createdAt, updatedAt, startedAt, endedAt sql.NullTime
	var contextModule, conversationJSON, intent, entitiesJSON, actionsTakenJSON, modelUsed sql.NullString
	var satisfactionScore sql.NullInt64
	err := p.db.QueryRowContext(ctx, query, id, tenantID).Scan(
		&s.ID, &s.TenantID, &s.UserID, &contextModule, &conversationJSON,
		&intent, &entitiesJSON, &actionsTakenJSON, &modelUsed, &s.TotalTokens,
		&satisfactionScore, &s.Status, &startedAt, &endedAt, &createdAt, &updatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("not found")
		}
		return nil, fmt.Errorf("query row: %w", err)
	}
	if contextModule.Valid {
		s.ContextModule = &contextModule.String
	}
	if conversationJSON.Valid {
		s.ConversationJSON = &conversationJSON.String
	}
	if intent.Valid {
		s.Intent = &intent.String
	}
	if entitiesJSON.Valid {
		s.EntitiesJSON = &entitiesJSON.String
	}
	if actionsTakenJSON.Valid {
		s.ActionsTakenJSON = &actionsTakenJSON.String
	}
	if modelUsed.Valid {
		s.ModelUsed = &modelUsed.String
	}
	if satisfactionScore.Valid {
		v := int(satisfactionScore.Int64)
		s.SatisfactionScore = &v
	}
	if startedAt.Valid {
		v := startedAt.Time.Format(time.RFC3339)
		s.StartedAt = &v
	}
	if endedAt.Valid {
		v := endedAt.Time.Format(time.RFC3339)
		s.EndedAt = &v
	}
	if createdAt.Valid {
		s.CreatedAt = createdAt.Time.Format(time.RFC3339)
	}
	if updatedAt.Valid {
		s.UpdatedAt = updatedAt.Time.Format(time.RFC3339)
	}
	return &s, nil
}

func (p *postgresStore) Create(ctx context.Context, s *assistantSession) error {
	query := `INSERT INTO ` + tableName + ` (id, tenant_id, user_id, context_module,
		conversation_json, intent, entities_json, actions_taken_json, model_used,
		total_tokens, satisfaction_score, status, started_at, ended_at, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`
	_, err := p.db.ExecContext(ctx, query,
		s.ID, s.TenantID, s.UserID, s.ContextModule,
		s.ConversationJSON, s.Intent, s.EntitiesJSON, s.ActionsTakenJSON, s.ModelUsed,
		s.TotalTokens, s.SatisfactionScore, s.Status,
		parseTimePtr(s.StartedAt), parseTimePtr(s.EndedAt),
		parseTime(s.CreatedAt), parseTime(s.UpdatedAt))
	return err
}

func (p *postgresStore) Update(ctx context.Context, s *assistantSession) error {
	query := `UPDATE ` + tableName + ` SET user_id=$1, context_module=$2, conversation_json=$3,
		intent=$4, entities_json=$5, actions_taken_json=$6, model_used=$7, total_tokens=$8,
		satisfaction_score=$9, status=$10, started_at=$11, ended_at=$12, updated_at=$13
		WHERE id=$14 AND tenant_id=$15`
	res, err := p.db.ExecContext(ctx, query,
		s.UserID, s.ContextModule, s.ConversationJSON,
		s.Intent, s.EntitiesJSON, s.ActionsTakenJSON, s.ModelUsed, s.TotalTokens,
		s.SatisfactionScore, s.Status, parseTimePtr(s.StartedAt), parseTimePtr(s.EndedAt),
		parseTime(s.UpdatedAt), s.ID, s.TenantID)
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
	for _, key := range []string{"user_id", "status", "context_module"} {
		if v := r.URL.Query().Get(key); v != "" {
			filters[key] = v
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

	now := time.Now().UTC().Format(time.RFC3339)
	s := &assistantSession{
		ID:               newID(),
		TenantID:         tenantID,
		UserID:           userID,
		ContextModule:    strPtr(body["context_module"]),
		ConversationJSON: strPtr(body["conversation_json"]),
		Intent:           strPtr(body["intent"]),
		EntitiesJSON:     strPtr(body["entities_json"]),
		ActionsTakenJSON: strPtr(body["actions_taken_json"]),
		ModelUsed:        strPtr(body["model_used"]),
		TotalTokens:      0,
		Status:           "active",
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	if v, ok := body["total_tokens"].(float64); ok {
		s.TotalTokens = int(v)
	}
	s.SatisfactionScore = intPtr(body["satisfaction_score"])
	if v, ok := body["status"].(string); ok && validStatuses[v] {
		s.Status = v
	}
	if v, ok := body["started_at"].(string); ok {
		s.StartedAt = &v
	}
	if v, ok := body["ended_at"].(string); ok {
		s.EndedAt = &v
	}

	if err := sv.store.Create(r.Context(), s); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	sv.cache.invalidate("list:" + tenantID)
	writeJSON(w, http.StatusCreated, map[string]any{"item": s, "event_topic": eventTopic + ".created"})
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
	if v, exists := body["context_module"]; exists {
		existing.ContextModule = strPtr(v)
	}
	if v, exists := body["conversation_json"]; exists {
		existing.ConversationJSON = strPtr(v)
	}
	if v, exists := body["intent"]; exists {
		existing.Intent = strPtr(v)
	}
	if v, exists := body["entities_json"]; exists {
		existing.EntitiesJSON = strPtr(v)
	}
	if v, exists := body["actions_taken_json"]; exists {
		existing.ActionsTakenJSON = strPtr(v)
	}
	if v, exists := body["model_used"]; exists {
		existing.ModelUsed = strPtr(v)
	}
	if v, ok := body["total_tokens"].(float64); ok {
		existing.TotalTokens = int(v)
	}
	if _, exists := body["satisfaction_score"]; exists {
		existing.SatisfactionScore = intPtr(body["satisfaction_score"])
	}
	if v, ok := body["status"].(string); ok && validStatuses[v] {
		existing.Status = v
	}
	if v, ok := body["started_at"].(string); ok {
		existing.StartedAt = &v
	}
	if v, ok := body["ended_at"].(string); ok {
		existing.EndedAt = &v
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
		"entity":      "assistantSession",
		"fields": []string{
			"id", "tenant_id", "user_id", "context_module", "conversation_json",
			"intent", "entities_json", "actions_taken_json", "model_used",
			"total_tokens", "satisfaction_score", "status", "started_at", "ended_at",
			"created_at", "updated_at",
		},
		"filters":    []string{"user_id", "status", "context_module"},
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
