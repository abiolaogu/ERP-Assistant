package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func setupTestServer() (*server, *http.ServeMux) {
	ms := newMemoryStore()
	cache := newCache()
	srv := &server{store: ms, cache: cache}

	mux := http.NewServeMux()
	mux.HandleFunc(basePath, func(w http.ResponseWriter, r *http.Request) {
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
		}
	})
	mux.HandleFunc(basePath+"/", func(w http.ResponseWriter, r *http.Request) {
		tenantID := r.Header.Get("X-Tenant-ID")
		if tenantID == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "missing X-Tenant-ID header"})
			return
		}
		id := r.URL.Path[len(basePath+"/"):]
		switch r.Method {
		case http.MethodGet:
			srv.handleGet(w, r, id)
		case http.MethodPut:
			srv.handleUpdate(w, r, id)
		case http.MethodDelete:
			srv.handleDelete(w, r, id)
		}
	})
	return srv, mux
}

func createBriefing(t *testing.T, mux http.Handler, tenant string, payload map[string]any) map[string]any {
	t.Helper()
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, basePath, bytes.NewReader(body))
	req.Header.Set("X-Tenant-ID", tenant)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
	var resp map[string]any
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	return resp
}

func TestCursorRoundTrip(t *testing.T) {
	_, mux := setupTestServer()

	tenant := "tenant-cursor-test"
	for i := 0; i < 5; i++ {
		createBriefing(t, mux, tenant, map[string]any{
			"user_id": "user-1",
			"title":   "Briefing " + string(rune('A'+i)),
			"summary": "Summary " + string(rune('A'+i)),
		})
	}

	req := httptest.NewRequest(http.MethodGet, basePath+"?limit=2", nil)
	req.Header.Set("X-Tenant-ID", tenant)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	var page1 map[string]any
	_ = json.Unmarshal(w.Body.Bytes(), &page1)

	items1, _ := page1["items"].([]any)
	if len(items1) != 2 {
		t.Fatalf("expected 2 items in page 1, got %d", len(items1))
	}

	nextCursor, _ := page1["next_cursor"].(string)
	if nextCursor == "" {
		t.Fatal("expected a non-empty next_cursor")
	}

	req2 := httptest.NewRequest(http.MethodGet, basePath+"?limit=2&cursor="+nextCursor, nil)
	req2.Header.Set("X-Tenant-ID", tenant)
	w2 := httptest.NewRecorder()
	mux.ServeHTTP(w2, req2)

	var page2 map[string]any
	_ = json.Unmarshal(w2.Body.Bytes(), &page2)

	items2, _ := page2["items"].([]any)
	if len(items2) != 2 {
		t.Fatalf("expected 2 items in page 2, got %d", len(items2))
	}

	id1 := items1[1].(map[string]any)["id"].(string)
	id2 := items2[0].(map[string]any)["id"].(string)
	if id1 == id2 {
		t.Fatal("page 2 should not overlap with page 1")
	}
}

func TestMemoryListInvalidatesCache(t *testing.T) {
	srv, mux := setupTestServer()
	tenant := "tenant-cache-test"

	createBriefing(t, mux, tenant, map[string]any{
		"user_id": "u1",
		"title":   "Cache Test",
		"summary": "Summary",
	})

	req := httptest.NewRequest(http.MethodGet, basePath+"?limit=10", nil)
	req.Header.Set("X-Tenant-ID", tenant)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	var list1 map[string]any
	_ = json.Unmarshal(w.Body.Bytes(), &list1)
	count1 := int(list1["count"].(float64))
	if count1 != 1 {
		t.Fatalf("expected 1, got %d", count1)
	}

	cacheKey := "list:" + tenant + "::10:map[]"
	if _, ok := srv.cache.get(cacheKey); !ok {
		t.Fatal("expected cache entry to exist")
	}

	createBriefing(t, mux, tenant, map[string]any{
		"user_id": "u1",
		"title":   "Cache Test 2",
		"summary": "Summary 2",
	})

	if _, ok := srv.cache.get(cacheKey); ok {
		t.Fatal("expected cache entry to be invalidated after create")
	}

	req2 := httptest.NewRequest(http.MethodGet, basePath+"?limit=10", nil)
	req2.Header.Set("X-Tenant-ID", tenant)
	w2 := httptest.NewRecorder()
	mux.ServeHTTP(w2, req2)

	var list2 map[string]any
	_ = json.Unmarshal(w2.Body.Bytes(), &list2)
	count2 := int(list2["count"].(float64))
	if count2 != 2 {
		t.Fatalf("expected 2, got %d", count2)
	}
}

func TestTenantIsolation(t *testing.T) {
	_, mux := setupTestServer()

	createBriefing(t, mux, "tenant-A", map[string]any{"user_id": "a", "title": "A", "summary": "A"})
	createBriefing(t, mux, "tenant-B", map[string]any{"user_id": "b", "title": "B", "summary": "B"})

	req := httptest.NewRequest(http.MethodGet, basePath, nil)
	req.Header.Set("X-Tenant-ID", "tenant-A")
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	var resp map[string]any
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	items := resp["items"].([]any)
	if len(items) != 1 {
		t.Fatalf("expected 1 item for tenant-A, got %d", len(items))
	}
}

func TestMissingTenantID(t *testing.T) {
	_, mux := setupTestServer()

	req := httptest.NewRequest(http.MethodGet, basePath, nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestCreateValidation(t *testing.T) {
	_, mux := setupTestServer()

	body, _ := json.Marshal(map[string]any{"user_id": "u1"})
	req := httptest.NewRequest(http.MethodPost, basePath, bytes.NewReader(body))
	req.Header.Set("X-Tenant-ID", "t1")
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestGetNotFound(t *testing.T) {
	_, mux := setupTestServer()

	req := httptest.NewRequest(http.MethodGet, basePath+"/nonexistent", nil)
	req.Header.Set("X-Tenant-ID", "t1")
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

func TestUpdateAndDelete(t *testing.T) {
	_, mux := setupTestServer()

	resp := createBriefing(t, mux, "t1", map[string]any{"user_id": "u1", "title": "Del", "summary": "S"})
	item := resp["item"].(map[string]any)
	id := item["id"].(string)

	body, _ := json.Marshal(map[string]any{"title": "Updated"})
	req := httptest.NewRequest(http.MethodPut, basePath+"/"+id, bytes.NewReader(body))
	req.Header.Set("X-Tenant-ID", "t1")
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	req2 := httptest.NewRequest(http.MethodDelete, basePath+"/"+id, nil)
	req2.Header.Set("X-Tenant-ID", "t1")
	w2 := httptest.NewRecorder()
	mux.ServeHTTP(w2, req2)
	if w2.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w2.Code)
	}

	req3 := httptest.NewRequest(http.MethodGet, basePath+"/"+id, nil)
	req3.Header.Set("X-Tenant-ID", "t1")
	w3 := httptest.NewRecorder()
	mux.ServeHTTP(w3, req3)
	if w3.Code != http.StatusNotFound {
		t.Fatalf("expected 404 after delete, got %d", w3.Code)
	}
}
