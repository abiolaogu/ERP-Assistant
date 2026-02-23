# ERP-Assistant Architecture

## C4 Context
- Module: `ERP-Assistant`
- Mode: standalone_plus_suite
- Auth: ERP-IAM (OIDC/JWT)
- Entitlements: ERP-Platform

## Container View
```mermaid
flowchart TB
    U["Users"] --> G["Gateway / API"]
    S1["action-engine"]
    S2["assistant-core"]
    S3["briefing-service"]
    S4["connector-hub"]
    S5["memory-service"]
    S6["voice-service"]
    G --> S1
    G --> S2
    G --> S3
    G --> S4
    G --> S5
    G --> S6
    G --> DB["PostgreSQL"]
    G --> EV["Redpanda/Kafka"]
```

## Service Inventory
- `action-engine`
- `assistant-core`
- `briefing-service`
- `connector-hub`
- `memory-service`
- `voice-service`
