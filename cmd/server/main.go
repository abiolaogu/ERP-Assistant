package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"sync/atomic"
	"time"
)

type capabilityDoc struct {
	Module          string   `json:"module"`
	Version         string   `json:"version,omitempty"`
	Capabilities    []string `json:"capabilities"`
	IntegrationMode string   `json:"integration_mode,omitempty"`
	AIDDGovernance  string   `json:"aidd_governance,omitempty"`
}

var reqCounter uint64

func loadCapabilities() capabilityDoc {
	b, err := os.ReadFile("configs/capabilities.json")
	if err != nil {
		return capabilityDoc{Module: "ERP-Assistant", Capabilities: []string{"unconfigured"}}
	}
	var d capabilityDoc
	if err := json.Unmarshal(b, &d); err != nil {
		return capabilityDoc{Module: "ERP-Assistant", Capabilities: []string{"invalid_config"}}
	}
	if d.Module == "" {
		d.Module = "ERP-Assistant"
	}
	return d
}

func writeJSON(w http.ResponseWriter, code int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(payload)
}

func nextRequestID(r *http.Request) string {
	if id := r.Header.Get("X-Request-ID"); id != "" {
		return id
	}
	n := atomic.AddUint64(&reqCounter, 1)
	return fmt.Sprintf("req-%d-%d", time.Now().UnixNano(), n)
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (s *statusRecorder) WriteHeader(status int) {
	s.status = status
	s.ResponseWriter.WriteHeader(status)
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func proxyRoute(mux *http.ServeMux, pathPrefix, backend string) {
	target, err := url.Parse(backend)
	if err != nil {
		log.Fatalf("invalid backend URL %q for prefix %q: %v", backend, pathPrefix, err)
	}
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		log.Printf("proxy error prefix=%s backend=%s err=%v", pathPrefix, backend, err)
		writeJSON(w, http.StatusBadGateway, map[string]string{
			"error":   "backend unavailable",
			"backend": pathPrefix,
		})
	}
	mux.Handle(pathPrefix+"/", proxy)
	mux.Handle(pathPrefix, proxy)
	log.Printf("route %s -> %s", pathPrefix, backend)
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Tenant-ID, X-Request-ID")
		w.Header().Set("Access-Control-Max-Age", "86400")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func withServerDefaults(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		requestID := nextRequestID(r)
		w.Header().Set("X-Request-ID", requestID)
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("Cache-Control", "no-store")

		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r)

		tenant := r.Header.Get("X-Tenant-ID")
		if tenant == "" {
			tenant = "system"
		}
		log.Printf("method=%s path=%s status=%d duration_ms=%d tenant=%s request_id=%s remote=%s",
			r.Method,
			r.URL.Path,
			rec.status,
			time.Since(start).Milliseconds(),
			tenant,
			requestID,
			r.RemoteAddr,
		)
	})
}

func main() {
	doc := loadCapabilities()
	mux := http.NewServeMux()

	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "healthy", "module": "ERP-Assistant"})
	})

	mux.HandleFunc("/v1/capabilities", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
			return
		}
		writeJSON(w, http.StatusOK, doc)
	})

	// Reverse-proxy routes to backend services
	proxyRoute(mux, "/v1/assistant-sessions", env("ASSISTANT_CORE_URL", "http://assistant-core:8080"))
	proxyRoute(mux, "/v1/memories", env("MEMORY_SERVICE_URL", "http://memory-service:8080"))
	proxyRoute(mux, "/v1/briefings", env("BRIEFING_SERVICE_URL", "http://briefing-service:8080"))
	proxyRoute(mux, "/v1/assistant-connectors", env("CONNECTOR_HUB_URL", "http://connector-hub:8080"))
	proxyRoute(mux, "/v1/actions", env("ACTION_ENGINE_URL", "http://action-engine:8080"))
	proxyRoute(mux, "/v1/voice-commands", env("VOICE_SERVICE_URL", "http://voice-service:8080"))

	port := env("PORT", "8090")
	addr := ":" + port

	srv := &http.Server{
		Addr:              addr,
		Handler:           withCORS(withServerDefaults(mux)),
		ReadHeaderTimeout: 2 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}

	log.Printf("ERP-Assistant listening on %s", addr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
