.PHONY: test test-integration test-e2e

test:
	go test ./cmd/server ./tests

test-integration:
	@echo "integration placeholder for connector-hub and action-engine"

test-e2e:
	@echo "e2e placeholder for NL command -> module action flow"
