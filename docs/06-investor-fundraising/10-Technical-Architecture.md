# Technical Architecture -- Sovereign Assistant

**Confidential -- Series A Investment Memorandum**

---

## 1. Architecture Summary

Sovereign Assistant is built on a privacy-first AI architecture where all LLM inference, embedding generation, and data processing occurs within the customer's data boundary. No customer data is ever sent to external AI providers.

---

## 2. Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| Backend | Go 1.22+ | Performance, concurrency for real-time chat |
| LLM serving | vLLM (self-hosted) | High-throughput inference, GPU optimization |
| LLM models | Llama 3.1 70B / Mistral Large | Open-weight models, on-prem deployable |
| Embeddings | BGE-large-en-v1.5 (self-hosted) | Top-performing open embedding model |
| Reranking | BGE-reranker-v2-m3 (self-hosted) | Cross-encoder precision |
| Vector database | pgvector (PostgreSQL) | Unified database, HNSW indexing |
| Primary database | PostgreSQL 16 | Reliability, extension ecosystem |
| Cache | Redis Cluster | Session state, query cache |
| Event streaming | Apache Kafka | Async processing, audit events |
| Object storage | S3/GCS compatible | Document and recording storage |
| API gateway | Hasura GraphQL | Auto-generated API, real-time subscriptions |
| Frontend | React + Vite + Refine.dev | Enterprise-ready UI framework |
| Real-time | WebSocket | Streaming token delivery |

---

## 3. AI Model Architecture

### Model Routing Strategy
```
User Query -> Intent Classifier (7B model, <100ms)
  |
  +-> Simple (greeting, follow-up, clarification) -> 7B Model ($0.001/query)
  +-> Knowledge retrieval -> RAG Pipeline + 70B Model ($0.008/query)
  +-> Data query -> NLQ Pipeline + 70B Model ($0.010/query)
  +-> Complex reasoning -> 70B Model ($0.012/query)
  +-> Agent execution -> 70B Model + Tools ($0.015/query)

Cost optimization: 60% of queries use 7B model = 10x cheaper
Average cost: $0.005/query
At 100K queries/day = $500/day = $182K/year infrastructure cost for 10K users
```

### Inference Infrastructure
- **GPU cluster:** 4x NVIDIA H100 (or 8x A100) per 10K concurrent users
- **Serving framework:** vLLM with continuous batching for 3x throughput
- **Quantization:** INT8 quantization for 2x memory efficiency with <1% quality loss
- **Caching:** KV-cache sharing for similar prompts, semantic query cache in Redis

---

## 4. Privacy Architecture

```
Customer Environment Boundary
+------------------------------------------------------------------+
|  [User Browser] <-> [Load Balancer] <-> [API Services]           |
|       |                                       |                   |
|  [WebSocket] <-> [Conversational Engine]  [Hasura GraphQL]       |
|                        |                      |                   |
|              [RAG Pipeline]  [NLQ Engine]  [Agent Runtime]        |
|                   |              |              |                  |
|         [LLM Service - vLLM]  [Embedding Service]                |
|              (GPU cluster)        (GPU)                           |
|                   |              |                                 |
|         [PostgreSQL + pgvector]  [Redis]  [Object Storage]       |
+------------------------------------------------------------------+
                    NOTHING LEAVES THIS BOUNDARY
```

---

## 5. Scalability

| Dimension | Current | Year 3 Target | Method |
|---|---|---|---|
| Concurrent users | 1K | 50K | Horizontal scaling of API + LLM replicas |
| Documents per tenant | 100K | 5M | Partitioned pgvector indexes |
| Queries per day | 10K | 5M | Model routing, caching, GPU autoscaling |
| Knowledge bases | 50 | 500 | Tenant-partitioned vector namespaces |

---

## 6. Deployment Models

| Model | Target | Infrastructure |
|---|---|---|
| **SaaS (multi-tenant)** | Mid-market | Sovereign-hosted, shared GPU |
| **Dedicated cloud** | Enterprise | Single-tenant, dedicated GPU |
| **On-premises** | Regulated industries | Customer's Kubernetes + GPU cluster |
| **Air-gapped** | Government/defense | Fully isolated, no internet |

---

*This document is confidential and intended for potential investors only.*
