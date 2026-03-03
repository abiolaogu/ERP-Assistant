# High-Level Design (HLD) -- Sovereign Assistant

**Module:** ERP-Assistant | **Port:** 5181 | **Version:** 3.0 | **Date:** 2026-03-03

---

## 1. Architecture Overview

Sovereign Assistant is a multi-layer AI platform that sits between users and the 24 ERP modules. The architecture is designed for low-latency conversational AI with enterprise security, grounding every response in real ERP data while preventing hallucination, data leakage, and prompt injection.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      USER INTERFACES                                │
│  Web Chat │ Voice │ Embedded Widget │ API │ Slack/Teams Bot         │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Port 5181)                        │
│  Authentication │ Rate Limiting │ Session Management │ WebSocket    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   ORCHESTRATION LAYER                                │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │ Conversation │ │   Intent     │ │   Query     │ │   Agent     │ │
│  │   Manager   │ │ Classifier   │ │   Planner   │ │ Orchestrator│ │
│  └──────┬──────┘ └──────┬───────┘ └──────┬──────┘ └──────┬──────┘ │
│         │               │                │               │         │
│  ┌──────┴──────┐ ┌──────┴───────┐ ┌──────┴──────┐ ┌──────┴──────┐ │
│  │ Memory      │ │  PII         │ │ Permission  │ │   Tool      │ │
│  │ Manager     │ │  Guard       │ │ Enforcer    │ │   Registry  │ │
│  └─────────────┘ └──────────────┘ └─────────────┘ └─────────────┘ │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
┌──────────────────┐ ┌────────────────┐ ┌────────────────────────────┐
│   LLM GATEWAY    │ │  RAG PIPELINE  │ │   MODULE API ROUTER        │
│                  │ │                │ │                            │
│ Model Selection  │ │ Embedding      │ │ GraphQL Federation         │
│ Prompt Assembly  │ │ Vector Search  │ │ REST Fallback              │
│ Streaming Output │ │ Re-Ranking     │ │ 24 Module Connectors       │
│ Token Budgeting  │ │ Citation Gen   │ │ Response Normalization     │
│ Fallback Chain   │ │                │ │                            │
│                  │ │ Knowledge Base │ │ Finance │ HR │ Inventory   │
│ Claude/GPT/Local │ │ Document Store │ │ Procurement │ CRM │ ...   │
└──────────────────┘ └────────────────┘ └────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                     │
│  PostgreSQL │ pgvector │ Redis │ S3 │ Redpanda Event Bus           │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Core Components

### 2.1 API Gateway (Port 5181)

| Responsibility | Implementation |
|---|---|
| Authentication | JWT validation via SSO (SAML 2.0, OIDC) |
| Session management | Redis-backed session store, 30-minute idle timeout |
| WebSocket | Bi-directional streaming for real-time chat |
| Rate limiting | Per-user token bucket (100 messages/hour default) |
| Request routing | Path-based routing to orchestration services |
| Health checks | /healthz, /readyz endpoints for Kubernetes liveness/readiness |

### 2.2 Conversation Manager

Maintains conversational context across multi-turn interactions. Each conversation has a memory window that includes recent messages, extracted entities, and resolved references.

**Memory Architecture:**
- **Short-term memory:** Last 20 messages in current conversation (in Redis)
- **Working memory:** Extracted entities, resolved module context, user preferences (in Redis)
- **Long-term memory:** Conversation summaries, frequently asked queries, user patterns (in PostgreSQL)
- **Episodic memory:** Specific interaction outcomes for personalization (in pgvector)

**Context Window Management:**
- Total context budget: 128K tokens (Claude 3.5 Sonnet) or 128K tokens (GPT-4o)
- System prompt: 2K tokens (fixed)
- Conversation history: 8K tokens (sliding window)
- RAG context: 4K tokens (top-5 chunks)
- Module API results: 8K tokens (dynamic)
- Generation budget: Remaining tokens for response

### 2.3 Intent Classifier

Determines which modules, actions, and data are needed to fulfill the user's request.

**Classification Taxonomy:**

| Intent Category | Sub-Intents | Example |
|---|---|---|
| Data Query | single_module, cross_module, aggregation, comparison, time_series | "What was Q4 revenue?" |
| Document Generation | invoice, report, letter, contract, custom | "Generate January invoices" |
| Task Execution | create, update, delete, approve, submit | "Submit my PTO request" |
| Meeting Intelligence | summarize, extract_actions, generate_followup | "Summarize yesterday's standup" |
| Knowledge Query | policy, procedure, how_to, troubleshoot | "What is our PTO policy?" |
| Agent Dispatch | expense, onboarding, inventory, compliance | "Process this receipt" |
| System Admin | user_management, health_check, configuration | "Check API health" |

**Classification Pipeline:**
1. User message → Embedding generation
2. Embedding → Intent classification (fine-tuned classifier, 97% accuracy)
3. Intent → Module identification (which of 24 modules are needed)
4. Module set → Permission check (does user have access?)
5. Permission check → Query plan or rejection with explanation

### 2.4 LLM Gateway

Abstracts LLM provider selection, prompt engineering, and response streaming.

**Multi-Model Strategy:**

| Use Case | Primary Model | Fallback Model | Rationale |
|---|---|---|---|
| Complex reasoning queries | Claude 3.5 Sonnet | GPT-4o | Best reasoning quality |
| Simple data lookups | Claude 3.5 Haiku | GPT-4o-mini | Fast, cost-effective |
| Document generation | Claude 3.5 Sonnet | GPT-4o | Long-form quality |
| Intent classification | Fine-tuned BERT | Claude 3.5 Haiku | Low latency, high accuracy |
| Embedding generation | text-embedding-3-large | Cohere embed-v3 | Quality embeddings |
| Code generation | Claude 3.5 Sonnet | GPT-4o | Code accuracy |

**Prompt Engineering:**
- System prompts are version-controlled and A/B tested
- Few-shot examples curated per intent category
- Output format enforcement via structured output (JSON mode)
- Guardrails: refuse hallucinated data, require citations, enforce RBAC

### 2.5 RAG Pipeline

Retrieval-Augmented Generation ensures responses are grounded in actual company data.

```
User Query
    │
    ▼
┌─────────────────┐
│ Query Embedding  │ ← text-embedding-3-large (1536 dimensions)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Vector Search    │ ← pgvector: cosine similarity, top-20
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Re-Ranking       │ ← Cross-encoder model: top-5
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Context Assembly │ ← Combine chunks + metadata + source links
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Prompt + LLM     │ ← System prompt + context + query → Response
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Citation Gen     │ ← Link response claims to source chunks
└─────────────────┘
```

### 2.6 Module API Router

Routes queries to the appropriate ERP module APIs. Supports both GraphQL (via Hasura federation) and REST endpoints.

**Routing Strategy:**
1. Intent classifier identifies required modules
2. Query planner generates API call sequence (parallel where possible)
3. Permission enforcer validates user access per module
4. API calls execute with retry and circuit breaker patterns
5. Results normalized into common response format
6. LLM generates natural language response from normalized data

**Module Connectors (All 24):**

| Module | API Type | Key Entities |
|---|---|---|
| Finance | GraphQL | invoices, payments, accounts, budgets |
| HR | GraphQL | employees, departments, payroll, benefits |
| Inventory | GraphQL | products, warehouses, stock_levels, transfers |
| Procurement | GraphQL | purchase_orders, vendors, contracts, RFQs |
| CRM | GraphQL | contacts, deals, activities, pipelines |
| Manufacturing | GraphQL | work_orders, BOMs, production_lines |
| Project Management | GraphQL | projects, tasks, milestones, resources |
| ... (17 more) | GraphQL/REST | Module-specific entities |

### 2.7 Agent Orchestrator

Manages the lifecycle of AI agents that execute multi-step tasks autonomously.

**Agent Execution Model:**
```
Goal (user request)
    │
    ▼
┌─────────────────┐
│ Plan Generator   │ ← Decompose goal into steps
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Step Executor    │ ← Execute each step (API call, LLM reasoning)
│    │             │
│    ├─ Tool Call  │ ← Call ERP module API
│    ├─ Observe    │ ← Validate result
│    └─ Decide     │ ← Continue, retry, or escalate
└────────┬────────┘
         │
         ▼ (loop until complete)
┌─────────────────┐
│ Result Reporter  │ ← Summarize outcomes, notify user
└─────────────────┘
```

**Safety Controls:**
- Financial transactions >$1,000 require explicit user approval
- Data deletion operations always require confirmation
- Agent execution timeout: 5 minutes (configurable)
- Maximum 20 API calls per agent execution
- All actions logged in immutable audit trail

## 3. Security Architecture

### 3.1 Data Flow Security

| Layer | Control |
|---|---|
| User → Gateway | TLS 1.3, JWT authentication, CORS validation |
| Gateway → Services | mTLS between all internal services |
| Services → LLM | TLS 1.3, API key rotation every 30 days |
| Services → Modules | Service mesh (Istio), mTLS, RBAC tokens |
| Services → Database | TLS, per-tenant row-level security |

### 3.2 LLM Security Controls

| Threat | Mitigation |
|---|---|
| Prompt injection | Input sanitization, instruction hierarchy (system > user), canary tokens |
| Data exfiltration | Output filtering, no raw database access, RBAC enforcement |
| PII leakage | PII detection + redaction before LLM prompt submission |
| Hallucination | Grounding in RAG context, confidence scoring, citation requirement |
| Model manipulation | Read-only LLM access, no model fine-tuning from user input |

### 3.3 RBAC Enforcement

Every query is filtered through the user's permission matrix:
1. User's JWT contains role and module access claims
2. Intent classifier identifies required modules
3. Permission enforcer validates access for each module
4. API calls include user's authorization token (row-level filtering)
5. Response generation only includes data the user is authorized to see
6. Audit log records query, permissions applied, and data returned

## 4. Deployment Architecture

| Component | Infrastructure | Scaling |
|---|---|---|
| API Gateway | Kubernetes (EKS) | HPA based on request rate |
| Orchestration Services | Kubernetes (EKS) | HPA based on queue depth |
| LLM Gateway | Kubernetes (EKS) | Queue-based scaling with GPU nodes |
| RAG Pipeline | Kubernetes (EKS) | HPA based on query rate |
| PostgreSQL + pgvector | AWS RDS (Multi-AZ) | Read replicas |
| Redis | AWS ElastiCache (Cluster) | Horizontal sharding |
| Vector Index | pgvector extension | Partitioned by tenant |
| Document Storage | S3 | Unlimited |
| Event Bus | Redpanda (shared) | Horizontal scaling |

## 5. Integration Architecture

### 5.1 ERP Module Integration

All 24 modules are accessed through a unified GraphQL federation layer (Hasura). The assistant constructs GraphQL queries dynamically based on user intent, executes them against the federated schema, and transforms results into natural language.

### 5.2 External Integrations

| Integration | Purpose | Protocol |
|---|---|---|
| Slack | Chat bot interface | Slack Events API |
| Microsoft Teams | Chat bot interface | Bot Framework |
| Google Workspace | Calendar, Docs integration | Google APIs |
| Zoom/Teams | Meeting transcription | Webhook + Recording API |
| Email (SMTP) | Document delivery, notifications | SMTP/IMAP |
| S3/GCS | Document storage | SDK |

## 6. Technology Stack

| Layer | Technology |
|---|---|
| Backend | Go 1.22 (API gateway, orchestration), Python 3.12 (ML pipeline) |
| Frontend | React 18, Vite, Refine.dev, Ant Design |
| LLM Providers | Claude (Anthropic), GPT-4o (OpenAI), self-hosted Llama (fallback) |
| Embedding | text-embedding-3-large (OpenAI), Cohere embed-v3 (fallback) |
| Vector Database | pgvector (PostgreSQL extension) |
| Operational Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Event Bus | Redpanda (shared with all ERP modules) |
| Document Processing | Apache Tika (parsing), Tesseract (OCR) |
| Speech-to-Text | OpenAI Whisper large-v3 |
| Container Orchestration | Kubernetes (AWS EKS) |
| CI/CD | GitHub Actions, ArgoCD |

---

*Confidential. Sovereign Assistant. All rights reserved.*
