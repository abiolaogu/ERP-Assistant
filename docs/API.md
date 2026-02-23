# ERP-Assistant API

## Core Endpoints
- `GET /healthz`
- `GET /v1/capabilities`

## Discovered Endpoints
- `/healthz`
- `/v1/briefing`
- `/v1/capabilities`
- `/v1/command`
- `/v1/voice`

## Permissions
- JWT from ERP-IAM required for business endpoints
- `X-Tenant-ID` required for tenant-scoped data
