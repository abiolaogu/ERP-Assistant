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
	serviceName = "briefing-service"
	moduleName  = "ERP-Assistant"
	basePath    = "/v1/briefings"
	dbName      = "erp_assistant"
	tableName   = "assistant_briefings"
	eventTopic  = "erp.assistant.briefing"
	cacheTTL    = 45 * time.Second
)

var (
	validPriorities = map[string]bool{"low": true, "normal": true, "high": true, "urgent": true}
	validChannels   = map[string]bool{"email": true, "push": true, "in_app": true, "slack": true, "teams": true}
	validStatuses   = map[string]bool{"draft": true, "scheduled": true, "sent": true, "read": true, "archived": true}
)

// ---------------------------------------------------------------------------
// Entity
// ---------------------------------------------------------------------------

type briefing struct {
	ID           string  `json:"id"`
	TenantID     string  `json:"tenant_id"`
	UserID       string  `json:"user_id"`
	Title        string  `json:"title"`
	Summary      string  `json:"summary"`
	SectionsJSON *string `json:"sections_json,omitempty"`
	DataSources  *string `json:"data_sources,omitempty"`
	Priority     string  `json:"priority"`
	DeliveryTime *string `json:"delivery_time,omitempty"`
	Schedule     *string `json:"schedule,omitempty"`
	Channel      string  `json:"channel"`
	Status       string  `json:"status"`
	ReadAt       *string `json:"read_at,omitempty"`
	CreatedAt    string  `json:"created_at"`
	UpdatedAt    string  `json:"updated_at"`
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
	List(ctx context.Context, tenantID, cursor string, limit int, filters map[string]string) ([]briefing, string, error)
	GetByID(ctx context.Context, tenantID, id string) (*briefing, error)
	Create(ctx context.Context, b *briefing) error
	Update(ctx context.Context, b *briefing) error
	Delete(ctx context.Context, tenantID, id string) error
}

// ---------------------------------------------------------------------------
// Memory store
// ---------------------------------------------------------------------------

type memoryStore struct {
	mu      sync.RWMutex
	records map[string]briefing
}

func newMemoryStore() *memoryStore {
	return &memoryStore{records: make(map[string]briefing)}
}

func (m *memoryStore) List(_ context.Context, tenantID, cursor string, limit int, filters map[string]string) ([]briefing, string, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var all []briefing
	for _, b := range m.records {
		if b.TenantID != tenantID {
			continue
		}
		if v, ok := filters["user_id"]; ok && b.UserID != v {
			continue
		}
		if v, ok := filters["status"]; ok && b.Status != v {
			continue
		}
		if v, ok := filters["priority"]; ok && b.Priority != v {
			continue
		}
		all = append(all, b)
	}

	sort.Slice(all, func(i, j int) bool { return all[i].CreatedAt < all[j].CreatedAt })

	start := 0
	if cursor != "" {
		for i, b := range all {
			if b.ID == cursor {
				start = i + 1
				break
			}
		}
	}

	if start >= len(all) {
		return []briefing{}, "", nil
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

func (m *memoryStore) GetByID(_ context.Context, tenantID, id string) (*briefing, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	b, ok := m.records[id]
	if !ok || b.TenantID != tenantID {
		return nil, errors.New("not found")
	}
	return &b, nil
}

func (m *memoryStore) Create(_ context.Context, b *briefing) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.records[b.ID] = *b
	return nil
}

func (m *memoryStore) Update(_ context.Context, b *briefing) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.records[b.ID]; !ok {
		return errors.New("not found")
	}
	m.records[b.ID] = *b
	return nil
}

func (m *memoryStore) Delete(_ context.Context, tenantID, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	b, ok := m.records[id]
	if !ok || b.TenantID != tenantID {
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
	title TEXT NOT NULL,
	summary TEXT NOT NULL,
	sections_json TEXT,
	data_sources TEXT,
	priority TEXT CHECK (priority IN ('low','normal','high','urgent')) DEFAULT 'normal',
	delivery_time TIMESTAMPTZ,
	schedule TEXT,
	channel TEXT CHECK (channel IN ('email','push','in_app','slack','teams')) DEFAULT 'in_app',
	status TEXT CHECK (status IN ('draft','scheduled','sent','read','archived')) DEFAULT 'draft',
	read_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_` + tableName + `_tenant ON ` + tableName + ` (tenant_id);
CREATE INDEX IF NOT EXISTS idx_` + tableName + `_user ON ` + tableName + ` (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_` + tableName + `_status ON ` + tableName + ` (tenant_id, status);`

func (p *postgresStore) List(ctx context.Context, tenantID, cursor string, limit int, filters map[string]string) ([]briefing, string, error) {
	query := `SELECT id, tenant_id, user_id, title, summary, sections_json, data_sources,
		priority, delivery_time, schedule, channel, status, read_at, created_at, updated_at
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
	if v, ok := filters["priority"]; ok {
		query += fmt.Sprintf(" AND priority = $%d", argIdx)
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

	var results []briefing
	for rows.Next() {
		var b briefing
		var createdAt, updatedAt, deliveryTime, readAt sql.NullTime
		var sectionsJSON, dataSources, schedule sql.NullString
		if err := rows.Scan(&b.ID, &b.TenantID, &b.UserID, &b.Title, &b.Summary,
			&sectionsJSON, &dataSources, &b.Priority, &deliveryTime, &schedule,
			&b.Channel, &b.Status, &readAt, &createdAt, &updatedAt); err != nil {
			return nil, "", fmt.Errorf("scan: %w", err)
		}
		if sectionsJSON.Valid {
			b.SectionsJSON = &sectionsJSON.String
		}
		if dataSources.Valid {
			b.DataSources = &dataSources.String
		}
		if deliveryTime.Valid {
			v := deliveryTime.Time.Format(time.RFC3339)
			b.DeliveryTime = &v
		}
		if schedule.Valid {
			b.Schedule = &schedule.String
		}
		if readAt.Valid {
			v := readAt.Time.Format(time.RFC3339)
			b.ReadAt = &v
		}
		if createdAt.Valid {
			b.CreatedAt = createdAt.Time.Format(time.RFC3339)
		}
		if updatedAt.Valid {
			b.UpdatedAt = updatedAt.Time.Format(time.RFC3339)
		}
		results = append(results, b)
	}

	nextCursor := ""
	if len(results) > limit {
		nextCursor = results[limit-1].ID
		results = results[:limit]
	}

	return results, nextCursor, nil
}

func (p *postgresStore) GetByID(ctx context.Context, tenantID, id string) (*briefing, error) {
	query := `SELECT id, tenant_id, user_id, title, summary, sections_json, data_sources,
		priority, delivery_time, schedule, channel, status, read_at, created_at, updated_at
		FROM ` + tableName + ` WHERE id = $1 AND tenant_id = $2`
	var b briefing
	var createdAt, updatedAt, deliveryTime, readAt sql.NullTime
	var sectionsJSON, dataSources, schedule sql.NullString
	err := p.db.QueryRowContext(ctx, query, id, tenantID).Scan(
		&b.ID, &b.TenantID, &b.UserID, &b.Title, &b.Summary,
		&sectionsJSON, &dataSources, &b.Priority, &deliveryTime, &schedule,
		&b.Channel, &b.Status, &readAt, &createdAt, &updatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("not found")
		}
		return nil, fmt.Errorf("query row: %w", err)
	}
	if sectionsJSON.Valid {
		b.SectionsJSON = &sectionsJSON.String
	}
	if dataSources.Valid {
		b.DataSources = &dataSources.String
	}
	if deliveryTime.Valid {
		v := deliveryTime.Time.Format(time.RFC3339)
		b.DeliveryTime = &v
	}
	if schedule.Valid {
		b.Schedule = &schedule.String
	}
	if readAt.Valid {
		v := readAt.Time.Format(time.RFC3339)
		b.ReadAt = &v
	}
	if createdAt.Valid {
		b.CreatedAt = createdAt.Time.Format(time.RFC3339)
	}
	if updatedAt.Valid {
		b.UpdatedAt = updatedAt.Time.Format(time.RFC3339)
	}
	return &b, nil
}

func (p *postgresStore) Create(ctx context.Context, b *briefing) error {
	query := `INSERT INTO ` + tableName + ` (id, tenant_id, user_id, title, summary,
		sections_json, data_sources, priority, delivery_time, schedule, channel,
		status, read_at, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`
	_, err := p.db.ExecContext(ctx, query,
		b.ID, b.TenantID, b.UserID, b.Title, b.Summary,
		b.SectionsJSON, b.DataSources, b.Priority,
		parseTimePtr(b.DeliveryTime), b.Schedule, b.Channel,
		b.Status, parseTimePtr(b.ReadAt),
		parseTime(b.CreatedAt), parseTime(b.UpdatedAt))
	return err
}

func (p *postgresStore) Update(ctx context.Context, b *briefing) error {
	query := `UPDATE ` + tableName + ` SET user_id=$1, title=$2, summary=$3, sections_json=$4,
		data_sources=$5, priority=$6, delivery_time=$7, schedule=$8, channel=$9,
		status=$10, read_at=$11, updated_at=$12
		WHERE id=$13 AND tenant_id=$14`
	res, err := p.db.ExecContext(ctx, query,
		b.UserID, b.Title, b.Summary, b.SectionsJSON,
		b.DataSources, b.Priority, parseTimePtr(b.DeliveryTime), b.Schedule, b.Channel,
		b.Status, parseTimePtr(b.ReadAt),
		parseTime(b.UpdatedAt), b.ID, b.TenantID)
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
	for _, key := range []string{"user_id", "status", "priority"} {
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
	title, _ := body["title"].(string)
	if title == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "title is required"})
		return
	}
	summary, _ := body["summary"].(string)
	if summary == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "summary is required"})
		return
	}

	now := time.Now().UTC().Format(time.RFC3339)
	b := &briefing{
		ID:           newID(),
		TenantID:     tenantID,
		UserID:       userID,
		Title:        title,
		Summary:      summary,
		SectionsJSON: strPtr(body["sections_json"]),
		DataSources:  strPtr(body["data_sources"]),
		Priority:     "normal",
		Schedule:     strPtr(body["schedule"]),
		Channel:      "in_app",
		Status:       "draft",
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if v, ok := body["priority"].(string); ok && validPriorities[v] {
		b.Priority = v
	}
	if v, ok := body["channel"].(string); ok && validChannels[v] {
		b.Channel = v
	}
	if v, ok := body["status"].(string); ok && validStatuses[v] {
		b.Status = v
	}
	if v, ok := body["delivery_time"].(string); ok {
		b.DeliveryTime = &v
	}
	if v, ok := body["read_at"].(string); ok {
		b.ReadAt = &v
	}

	if err := sv.store.Create(r.Context(), b); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	sv.cache.invalidate("list:" + tenantID)
	writeJSON(w, http.StatusCreated, map[string]any{"item": b, "event_topic": eventTopic + ".created"})
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
	if v, ok := body["title"].(string); ok && v != "" {
		existing.Title = v
	}
	if v, ok := body["summary"].(string); ok && v != "" {
		existing.Summary = v
	}
	if v, exists := body["sections_json"]; exists {
		existing.SectionsJSON = strPtr(v)
	}
	if v, exists := body["data_sources"]; exists {
		existing.DataSources = strPtr(v)
	}
	if v, ok := body["priority"].(string); ok && validPriorities[v] {
		existing.Priority = v
	}
	if v, ok := body["delivery_time"].(string); ok {
		existing.DeliveryTime = &v
	}
	if v, exists := body["schedule"]; exists {
		existing.Schedule = strPtr(v)
	}
	if v, ok := body["channel"].(string); ok && validChannels[v] {
		existing.Channel = v
	}
	if v, ok := body["status"].(string); ok && validStatuses[v] {
		existing.Status = v
	}
	if v, ok := body["read_at"].(string); ok {
		existing.ReadAt = &v
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
		"entity":      "briefing",
		"fields": []string{
			"id", "tenant_id", "user_id", "title", "summary", "sections_json",
			"data_sources", "priority", "delivery_time", "schedule", "channel",
			"status", "read_at", "created_at", "updated_at",
		},
		"filters":    []string{"user_id", "status", "priority"},
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
