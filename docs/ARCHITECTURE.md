# ERP-OpenClaw Architecture

OpenClaw is the universal NL interface across all ERP modules.

## Components
- `assistant-core`: intent routing and conversation loop
- `connector-hub`: connector lifecycle and credential vault hooks
- `action-engine`: action execution with AIDD guardrails
- `memory-service`: semantic context and long-term memory

## Integrations
- ERP-IAM for auth + permission scoping
- ERP-Platform for entitlement-aware module discovery
- ERP-AI for multi-step orchestration
- ERP-iPaaS for workflow materialization
