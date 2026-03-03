# Low-Level Design (LLD) -- Sovereign Assistant

**Module:** ERP-Assistant | **Port:** 5181 | **Version:** 3.0 | **Date:** 2026-03-03

---

## 1. Query Processing Pipeline

### 1.1 End-to-End Flow

```
User Input (text/voice/image)
    │
    ├── [Voice] ──→ Whisper STT ──→ Text
    ├── [Image] ──→ OCR/Vision ──→ Structured Data + Text
    └── [Text] ──→ Direct
    │
    ▼
┌─────────────────────────────────┐
│ 1. INPUT PREPROCESSING          │
│    ├─ PII Detection & Redaction │ ← Microsoft Presidio (regex + NER)
│    ├─ Prompt Injection Check    │ ← Canary token + classifier
│    ├─ Language Detection         │ ← fastText langdetect
│    └─ Input Sanitization         │ ← Strip control chars, normalize
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 2. INTENT CLASSIFICATION        │
│    ├─ Embedding Generation      │ ← text-embedding-3-large (cached)
│    ├─ Intent Classifier          │ ← Fine-tuned DistilBERT (97% acc)
│    │   ├─ data_query             │
│    │   ├─ document_generation    │
│    │   ├─ task_execution         │
│    │   ├─ meeting_intelligence   │
│    │   ├─ knowledge_query        │
│    │   ├─ agent_dispatch         │
│    │   └─ system_admin           │
│    ├─ Module Identification      │ ← Which of 24 modules needed
│    ├─ Entity Extraction          │ ← Dates, amounts, names, IDs
│    └─ Confidence Scoring         │ ← Threshold: 0.85 (below = clarify)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 3. PERMISSION ENFORCEMENT       │
│    ├─ JWT Token Validation      │
│    ├─ Module Access Check        │ ← User role → allowed modules
│    ├─ Row-Level Filter Gen       │ ← tenant_id + department + role
│    └─ Rejection (if unauthorized)│ ← "You don't have access to..."
└────────────────┬────────────────┘
                 │
           ┌─────┴──────┐
           ▼             ▼
    ┌──────────┐  ┌──────────────┐
    │ Data     │  │ Knowledge    │
    │ Query    │  │ Query (RAG)  │
    │ Path     │  │ Path         │
    └────┬─────┘  └──────┬───────┘
         │               │
         ▼               ▼
┌──────────────┐  ┌──────────────┐
│ 4a. MODULE   │  │ 4b. RAG      │
│ API ROUTING  │  │ PIPELINE     │
│              │  │              │
│ Query Plan:  │  │ Query Embed  │
│ ├ Module A   │  │ Vector Search│
│ ├ Module B   │  │ Re-Rank      │
│ └ Join Logic │  │ Context Build│
│              │  │              │
│ GraphQL      │  │ Top-5 chunks │
│ Execution    │  │ + citations  │
└──────┬───────┘  └──────┬───────┘
       │                 │
       └────────┬────────┘
                │
                ▼
┌─────────────────────────────────┐
│ 5. PROMPT ASSEMBLY              │
│    ├─ System Prompt (2K tokens) │
│    ├─ Conversation History      │ ← Last 20 messages (8K tokens)
│    ├─ RAG Context               │ ← Top-5 chunks (4K tokens)
│    ├─ Module API Results        │ ← Query results (8K tokens)
│    ├─ Output Format Instructions│ ← Structured response format
│    └─ Citation Requirements     │ ← "Cite every data point"
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 6. LLM INFERENCE                │
│    ├─ Model Selection           │ ← Based on complexity score
│    │   ├─ Simple → Haiku        │
│    │   └─ Complex → Sonnet      │
│    ├─ Streaming Response         │ ← SSE to frontend
│    ├─ Token Counting             │ ← Track input/output tokens
│    └─ Fallback Chain             │ ← Primary → Secondary → Error
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 7. RESPONSE POST-PROCESSING     │
│    ├─ Citation Validation       │ ← Verify citations match sources
│    ├─ PII Re-Check               │ ← Scan response for leaked PII
│    ├─ Confidence Scoring         │ ← Flag low-confidence responses
│    ├─ Format Rendering           │ ← Markdown, tables, charts
│    └─ Follow-Up Suggestions     │ ← Suggest related queries
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 8. PERSISTENCE                  │
│    ├─ Save message (messages)   │
│    ├─ Update memory             │ ← conversation_memory
│    ├─ Update analytics           │ ← usage_analytics
│    └─ Emit event (Redpanda)     │ ← assistant.query.completed
└─────────────────────────────────┘
```

### 1.2 Query Plan Generation

For cross-module queries, the system generates an execution plan:

```go
type QueryPlan struct {
    Steps []QueryStep
    JoinStrategy string // "application_join" | "graphql_federation"
}

type QueryStep struct {
    Module      string   // "finance", "hr", "inventory"
    Operation   string   // "query", "mutation", "subscription"
    GraphQL     string   // Generated GraphQL query
    DependsOn   []int    // Step indices this step depends on
    Filters     map[string]interface{}
    Projection  []string // Fields to return
}
```

**Example: "Which departments have headcount over budget?"**

```
Step 1 (parallel): HR Module → GET departments with employee counts
Step 2 (parallel): Finance Module → GET department budgets
Step 3 (join): Application-level join on department_id
Step 4 (filter): Where actual_headcount > budgeted_headcount
Step 5 (format): Generate table with department, actual, budgeted, variance
```

## 2. RAG Pipeline Details

### 2.1 Document Ingestion

```
Document Upload
    │
    ▼
┌─────────────────┐
│ Format Detection │ ← MIME type + magic bytes
└────────┬────────┘
         │
    ┌────┴─────┬──────────┬──────────┐
    ▼          ▼          ▼          ▼
  PDF        DOCX       XLSX       HTML
  (Tika)     (Tika)     (Tika)     (Tika)
    │          │          │          │
    └────┬─────┴──────────┴──────────┘
         │
         ▼
┌─────────────────┐
│ Text Extraction  │ ← Clean text with metadata (page, section, heading)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Chunking         │ ← Recursive character splitting
│                  │    Chunk size: 512 tokens
│                  │    Overlap: 64 tokens
│                  │    Split on: paragraph > sentence > word
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Enrichment       │ ← Add metadata: source, page, heading hierarchy
│                  │    Generate chunk summary (for search)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Embedding        │ ← text-embedding-3-large (1536 dims)
│                  │    Batch processing: 100 chunks/request
│                  │    Latency: ~200ms per batch
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Storage          │ ← INSERT into document_chunks
│                  │    pgvector IVFFlat index update
└─────────────────┘
```

### 2.2 Retrieval and Re-Ranking

```go
func RetrieveContext(query string, tenantID string, topK int) []Chunk {
    // 1. Generate query embedding
    queryEmbed := embeddings.Generate(query) // 1536 dims, ~50ms

    // 2. Vector similarity search (pgvector)
    candidates := pgvector.Search(
        tenantID,
        queryEmbed,
        topK: 20,          // Retrieve 20 candidates
        metric: "cosine",
        minScore: 0.7,     // Minimum similarity threshold
    ) // ~30ms

    // 3. Cross-encoder re-ranking
    reranked := crossEncoder.Rerank(
        query,
        candidates,
        topK: 5,           // Return top 5 after re-ranking
    ) // ~100ms

    // 4. Add citations metadata
    for _, chunk := range reranked {
        chunk.Citation = Citation{
            Source: chunk.Metadata.SourceURL,
            Title: chunk.Metadata.Title,
            Page: chunk.Metadata.Page,
            Section: chunk.Metadata.Heading,
        }
    }

    return reranked // Total: ~180ms
}
```

## 3. Agent Execution Engine

### 3.1 Agent Lifecycle

```
User Request: "Process my expense report for the Chicago trip"
    │
    ▼
┌─────────────────────────────────┐
│ 1. AGENT SELECTION              │
│    ├─ Intent: agent_dispatch    │
│    ├─ Agent: expense_agent      │
│    └─ Validate: user has access │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 2. GOAL DECOMPOSITION           │
│    LLM generates execution plan │
│    ┌────────────────────────┐   │
│    │ Plan:                  │   │
│    │ 1. Find Chicago trip   │   │
│    │    receipts from user  │   │
│    │ 2. Extract amounts     │   │
│    │    via OCR              │   │
│    │ 3. Categorize expenses │   │
│    │ 4. Create expense      │   │
│    │    report in Finance   │   │
│    │ 5. Submit for approval │   │
│    └────────────────────────┘   │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 3. STEP EXECUTION (loop)       │
│                                 │
│  Step 1: API Call               │
│    Tool: finance.getReceipts    │
│    Params: {user_id, date_range}│
│    Result: 4 receipts found     │
│                                 │
│  Step 2: OCR Processing         │
│    Tool: vision.extractReceipt  │
│    Input: 4 receipt images      │
│    Result: Structured data      │
│                                 │
│  Step 3: LLM Reasoning          │
│    Categorize: flight, hotel,   │
│    meals, transport              │
│                                 │
│  Step 4: API Call               │
│    Tool: finance.createExpense  │
│    Params: {line_items, total}  │
│    Result: Expense report #4782 │
│                                 │
│  Step 5: Check Approval Rule    │
│    Total: $2,847 > $1,000       │
│    → Require user confirmation  │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 4. APPROVAL GATE                │
│    "I've created expense report │
│     #4782 for $2,847. Items:    │
│     - Flight: $648              │
│     - Hotel: $1,420             │
│     - Meals: $312               │
│     - Transport: $467           │
│     Submit for manager          │
│     approval? [Yes] [Edit]"     │
└────────────────┬────────────────┘
                 │ User: "Yes"
                 ▼
┌─────────────────────────────────┐
│ 5. COMPLETION                   │
│    ├─ Submit to manager         │
│    ├─ Log all steps (audit)     │
│    ├─ Notify user               │
│    └─ Update agent_tasks        │
└─────────────────────────────────┘
```

### 3.2 Tool Registry

```go
type Tool struct {
    Name        string            // "finance.createExpense"
    Module      string            // "finance"
    Operation   string            // "mutation"
    Description string            // For LLM function calling
    Parameters  []ToolParam       // Input schema
    Returns     ToolReturn        // Output schema
    RequiresApproval bool         // Needs human confirmation
    ReadOnly    bool              // true = safe to execute without approval
}

// Pre-registered tools across all 24 modules
var ToolRegistry = map[string]Tool{
    "finance.getInvoices":     {ReadOnly: true, ...},
    "finance.createExpense":   {RequiresApproval: true, ...},
    "hr.getEmployees":         {ReadOnly: true, ...},
    "hr.submitPTO":            {RequiresApproval: false, ...}, // PTO always auto-approved
    "inventory.getStockLevel": {ReadOnly: true, ...},
    "procurement.createPO":    {RequiresApproval: true, ...},
    // ... 200+ tools across all modules
}
```

## 4. Streaming Response Architecture

```
Client (React) ←── SSE ←── API Gateway ←── LLM Gateway ←── LLM Provider
    │                                         │
    │  Event: {"type":"token","data":"The"}   │
    │  Event: {"type":"token","data":" Q4"}   │
    │  Event: {"type":"token","data":" rev"}  │
    │  ...                                     │
    │  Event: {"type":"citation","data":{...}}│  ← Citation metadata
    │  Event: {"type":"tool_use","data":{...}}│  ← Tool call notification
    │  Event: {"type":"done","data":{...}}    │  ← Final metadata
    │                                          │
    ▼                                          │
React renders tokens incrementally              │
(typewriter effect)                             │
```

**SSE Event Types:**

| Event Type | Payload | Purpose |
|---|---|---|
| `token` | `{text: "word"}` | Incremental response text |
| `citation` | `{source, module, url}` | Citation for data point |
| `tool_use` | `{tool, params, status}` | Show tool call in progress |
| `tool_result` | `{tool, result}` | Show tool call result |
| `thinking` | `{step: "Querying finance module..."}` | Progress indicator |
| `suggestion` | `{queries: [...]}` | Follow-up query suggestions |
| `error` | `{message, code}` | Error information |
| `done` | `{tokens_in, tokens_out, latency_ms}` | Completion metadata |

## 5. Conversation Memory Management

### 5.1 Memory Hierarchy

```go
type ConversationMemory struct {
    ShortTerm  []Message         // Last 20 messages (Redis, TTL: 30min)
    Working    map[string]Entity // Extracted entities: dates, names, IDs (Redis)
    LongTerm   Summary           // Conversation summaries (PostgreSQL)
    Episodic   []Embedding       // Past interaction embeddings (pgvector)
}

// Memory retrieval for prompt construction
func BuildContext(conversationID string) PromptContext {
    // 1. Get short-term messages
    messages := redis.GetMessages(conversationID, limit: 20)

    // 2. Get working memory entities
    entities := redis.GetEntities(conversationID)

    // 3. If conversation is long, summarize earlier messages
    if len(messages) > 20 {
        summary := llm.Summarize(messages[:len(messages)-20])
        // Prefix summary before recent messages
    }

    // 4. Retrieve relevant episodic memory
    episodes := pgvector.Search(
        currentQuery.Embedding,
        filter: {user_id, past_30_days},
        topK: 3,
    )

    return PromptContext{
        SystemPrompt: systemPrompt,
        Summary: summary,
        RecentMessages: messages[len(messages)-20:],
        Entities: entities,
        Episodes: episodes,
    }
}
```

### 5.2 Entity Resolution

```
User: "Show me invoices from Acme Corp"
    → Entity: {type: "vendor", value: "Acme Corp", module: "finance"}

User: "How much did they bill us last quarter?"
    → Resolve "they" → Acme Corp (from working memory)
    → Resolve "last quarter" → Q4 2025 (from current date context)
    → Entity: {type: "vendor", value: "Acme Corp", resolved: true}
    → Entity: {type: "date_range", value: "2025-10-01 to 2025-12-31"}
```

## 6. Performance Targets

| Operation | Target Latency | Implementation |
|---|---|---|
| Intent classification | <50ms | Fine-tuned DistilBERT (local inference) |
| Permission check | <10ms | JWT decode + Redis RBAC cache |
| Single-module API call | <500ms | GraphQL via Hasura federation |
| Cross-module join (2 modules) | <2s | Parallel API calls + application join |
| Vector search (top-20) | <30ms | pgvector IVFFlat index |
| Re-ranking (20→5) | <100ms | Cross-encoder model |
| LLM inference (first token) | <800ms | Streaming SSE |
| LLM inference (full response) | <5s | Typical 200-500 tokens |
| Document generation | <10s | Template rendering + data fetch |
| Voice-to-text | <2s | Whisper large-v3 |
| Receipt OCR | <5s | Vision model + structured extraction |
| Agent step execution | <3s per step | API call + validation |

## 7. Error Handling

| Error Scenario | Detection | Response |
|---|---|---|
| LLM provider timeout | 10s timeout per request | Fallback to secondary provider |
| Module API unavailable | Health check + circuit breaker | "Module X is temporarily unavailable. Try again in a few minutes." |
| Low-confidence response | Confidence score <0.7 | "I'm not confident in this answer. Here's what I found, but please verify: ..." |
| Ambiguous query | Multiple intents above threshold | "Did you mean X or Y?" with clarification options |
| Unauthorized access | Permission check returns denied | "You don't have access to the Finance module. Contact your admin." |
| Token budget exceeded | Token count exceeds limit | Summarize older context, truncate least-relevant sections |
| PII detected in response | Post-processing PII scan | Redact PII, log incident, alert security team |

## 8. API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/conversations` | POST | Start new conversation |
| `/api/v1/conversations/:id/messages` | POST | Send message (returns SSE stream) |
| `/api/v1/conversations/:id` | GET | Get conversation history |
| `/api/v1/conversations/:id` | DELETE | Archive conversation |
| `/api/v1/documents/generate` | POST | Generate document from template |
| `/api/v1/documents/templates` | GET/POST | List/create templates |
| `/api/v1/knowledge/articles` | GET/POST | Knowledge base CRUD |
| `/api/v1/knowledge/search` | POST | Semantic search |
| `/api/v1/agents` | GET | List available agents |
| `/api/v1/agents/:id/tasks` | POST | Dispatch agent task |
| `/api/v1/agents/tasks/:id` | GET | Get task status |
| `/api/v1/agents/tasks/:id/approve` | POST | Approve pending task |
| `/api/v1/voice/transcribe` | POST | Transcribe audio |
| `/api/v1/vision/extract` | POST | Extract data from image |
| `/api/v1/analytics/usage` | GET | Usage analytics |
| `/api/v1/feedback` | POST | Submit response feedback |

---

*Confidential. Sovereign Assistant. All rights reserved.*
