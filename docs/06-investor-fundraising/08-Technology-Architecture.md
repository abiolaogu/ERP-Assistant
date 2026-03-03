# Sovereign Assistant -- Technology Architecture

**Confidential | Series A | March 2026**

---

## 1. System Overview

Sovereign Assistant is a multi-layer AI platform connecting users to 24 ERP modules through conversational AI. The architecture prioritizes sub-5-second response times, enterprise-grade security (RBAC enforcement at every layer), response grounding (zero hallucination for factual queries), and cost-efficient LLM inference.

## 2. Architecture Layers

### 2.1 Presentation Layer

| Component | Technology | Purpose |
|---|---|---|
| Web Chat UI | React 18 + Vite + Refine.dev + Ant Design | Primary conversational interface |
| Embedded Widget | React Web Component | Embeddable in other ERP module UIs |
| Slack Bot | Bolt SDK | Slack workspace integration |
| Teams Bot | Bot Framework | Microsoft Teams integration |
| Voice Interface | Whisper + Web Audio API | Speech-to-text for hands-free |
| REST API | OpenAPI 3.0 | Third-party integration |

### 2.2 API Gateway (Port 5181)

Go-based API gateway handling authentication, rate limiting, session management, and WebSocket connections for real-time streaming.

**Key Design Decisions:**
- WebSocket for streaming responses (SSE fallback for proxy-restricted environments)
- JWT-based authentication with OIDC/SAML SSO support
- Per-user rate limiting: 100 queries/hour (configurable per tier)
- Request deduplication: identical queries within 5 seconds return cached response

### 2.3 Orchestration Layer

**Conversation Manager:** Maintains multi-turn context with a three-tier memory hierarchy (short-term in Redis, working memory in Redis, long-term in PostgreSQL). Handles entity resolution, coreference, and context carryover.

**Intent Classifier:** Fine-tuned DistilBERT model (97% accuracy) classifies queries into 7 categories and identifies which of 24 modules are needed. Classification latency: <50ms.

**Query Planner:** For cross-module queries, generates an execution plan with parallel and sequential API calls, join strategies, and aggregation logic.

**PII Guard:** Microsoft Presidio-based PII detection and redaction. Scans all user input before LLM submission and all LLM output before delivery. Detection rate: >99% for standard PII types.

**Permission Enforcer:** Validates every query against the user's RBAC matrix. Generates row-level filters for API calls. Ensures zero unauthorized data exposure.

### 2.4 LLM Gateway

**Multi-Model Routing:**
- Intent classification: Fine-tuned DistilBERT (local, <50ms)
- Simple queries: Claude 3.5 Haiku ($0.0008/query average)
- Complex queries: Claude 3.5 Sonnet ($0.008/query average)
- Document generation: Claude 3.5 Sonnet (long-form quality)
- Embeddings: text-embedding-3-large (1536 dimensions)
- Fallback chain: Claude → GPT-4o → self-hosted Llama 3

**Cost Optimization:**
- Model routing saves 60% vs. routing all queries to the largest model
- Response caching: identical queries within 1 hour return cached response
- Prompt compression: summarize conversation history when context exceeds 8K tokens
- Token budgeting: enforce output limits based on query complexity

### 2.5 RAG Pipeline

| Stage | Technology | Latency |
|---|---|---|
| Query embedding | text-embedding-3-large | 50ms |
| Vector search | pgvector (IVFFlat, cosine) | 30ms |
| Re-ranking | Cross-encoder (ms-marco-MiniLM) | 100ms |
| Context assembly | Custom Go service | 10ms |
| Total retrieval | -- | 190ms |

**Knowledge Sources:** Uploaded documents (PDF, DOCX, XLSX), auto-extracted module documentation, conversation-derived articles, admin-curated FAQs.

### 2.6 Module API Router

All 24 ERP modules accessed through Hasura GraphQL federation. The router generates GraphQL queries dynamically based on the query plan, executes them with the user's authorization context, and normalizes results into a common format for LLM consumption.

**Supported Operations:**
- Read queries (SELECT equivalent): All modules, all entities
- Write operations (INSERT/UPDATE): Gated by agent framework with approval controls
- Real-time subscriptions: Redpanda event bus for live data changes

### 2.7 Agent Execution Engine

**Architecture:** ReAct-style agent loop (Reason → Act → Observe → Repeat).

| Component | Purpose |
|---|---|
| Plan Generator | LLM decomposes goal into executable steps |
| Tool Registry | 200+ registered tools across 24 modules |
| Step Executor | Executes API calls with retry and error handling |
| Approval Gate | Pauses execution for human approval on financial/destructive ops |
| Rollback Engine | Reverses completed steps if subsequent steps fail |
| Audit Logger | Records every step for compliance |

## 3. Data Architecture

| Store | Technology | Data |
|---|---|---|
| Operational DB | PostgreSQL 16 (RDS Multi-AZ) | Conversations, messages, agents, tasks, preferences |
| Vector Store | pgvector (PostgreSQL extension) | Document embeddings (1536 dims) |
| Cache | Redis 7 (ElastiCache) | Session data, conversation memory, query cache |
| Document Store | S3 | Generated documents, uploaded files, knowledge base sources |
| Event Bus | Redpanda (shared) | Cross-module events, real-time notifications |
| Search Index | OpenSearch 2.x | Full-text search across knowledge base |

## 4. Security Architecture

| Layer | Control |
|---|---|
| Network | VPC isolation, private subnets, WAF, DDoS protection |
| Authentication | OAuth 2.0 + OIDC, SAML 2.0 SSO, MFA |
| Authorization | RBAC per module, per entity, per field |
| Data Protection | AES-256 at rest, TLS 1.3 in transit, per-tenant encryption keys |
| LLM Security | PII redaction, prompt injection defense, output filtering |
| Audit | Immutable conversation logs, agent execution records, access logs |
| Compliance | SOC 2 Type I (complete), Type II (Q4 2026), ISO 27001 (Q1 2027) |

## 5. Infrastructure

| Component | Spec | Scaling |
|---|---|---|
| API Gateway | 3x c6g.large (EKS) | HPA: CPU >60% |
| Orchestration Services | 4x c6g.xlarge (EKS) | HPA: Queue depth |
| LLM Gateway | 2x c6g.xlarge (EKS) | HPA: Request rate |
| RAG Pipeline | 2x r6g.large (EKS) | HPA: Query rate |
| PostgreSQL + pgvector | db.r6g.xlarge (RDS Multi-AZ) | Read replicas |
| Redis | cache.r6g.large (ElastiCache) | Cluster mode |
| OpenSearch | 3x r6g.large.search | Horizontal |

## 6. Performance Targets

| Operation | Target | Current |
|---|---|---|
| Single-module query (end-to-end) | <3s | 2.8s |
| Cross-module query (end-to-end) | <8s | 6.4s |
| First token streaming | <1s | 0.7s |
| Document generation | <10s | 8.2s |
| Voice transcription | <2s | 1.6s |
| Receipt OCR | <5s | 4.1s |
| Agent step execution | <3s/step | 2.4s |
| Vector search (top-20) | <50ms | 28ms |

## 7. Technical Moat Assessment

| Moat | Time to Replicate | Why |
|---|---|---|
| 24-module native integration | 18-24 months | Requires building or integrating an ERP platform |
| Shared Redpanda event bus | 12-18 months | Architectural decision from inception |
| GraphQL federation layer | 6-12 months | Requires Hasura + all module schemas |
| RBAC enforcement pipeline | 6-12 months | Cross-module permission mapping |
| Intent classifier (97% accuracy) | 6 months | Fine-tuned on 500K labeled queries |
| Agent framework (200+ tools) | 12 months | Tool definitions + safety controls + testing |
| RAG pipeline optimization | 6 months | Chunking strategy + re-ranking + citation generation |

---

*Confidential. Sovereign Assistant, Inc. All rights reserved.*
