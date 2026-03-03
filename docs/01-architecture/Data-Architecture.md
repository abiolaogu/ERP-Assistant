# Data Architecture -- Sovereign Assistant

**Module:** ERP-Assistant | **Port:** 5181 | **Version:** 3.0 | **Date:** 2026-03-03

---

## 1. Data Model Overview

The Sovereign Assistant data architecture is organized around seven core domains: conversations, knowledge, agents, documents, search, user preferences, and analytics. All tables use `tenant_id TEXT` for multi-tenant isolation with row-level security.

## 2. Core Tables

### 2.1 Conversations Domain

```sql
-- Conversation sessions
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    user_id UUID NOT NULL,
    title TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- active, archived, deleted
    channel TEXT NOT NULL DEFAULT 'web', -- web, slack, teams, api, voice
    metadata JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at TIMESTAMPTZ,
    message_count INTEGER DEFAULT 0,
    token_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual messages within conversations
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    role TEXT NOT NULL, -- user, assistant, system, tool
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text', -- text, image, audio, document, tool_call, tool_result
    model_used TEXT, -- claude-3.5-sonnet, gpt-4o, etc.
    intent_classification JSONB, -- {category, modules, confidence}
    modules_queried TEXT[], -- ['finance', 'hr', 'inventory']
    citations JSONB DEFAULT '[]', -- [{source, module, entity, timestamp}]
    token_input INTEGER,
    token_output INTEGER,
    latency_ms INTEGER,
    feedback TEXT, -- thumbs_up, thumbs_down, null
    feedback_comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversation memory (extracted entities, context)
CREATE TABLE conversation_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    memory_type TEXT NOT NULL, -- entity, preference, context, summary
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    confidence FLOAT DEFAULT 1.0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.2 Knowledge Domain

```sql
-- Knowledge base articles (company policies, procedures, docs)
CREATE TABLE knowledge_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'markdown', -- markdown, html, plain
    source_type TEXT NOT NULL, -- upload, auto_generated, conversation_extract, module_doc
    source_url TEXT,
    category TEXT,
    tags TEXT[],
    status TEXT NOT NULL DEFAULT 'draft', -- draft, published, archived
    author_id UUID,
    approved_by UUID,
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document chunks for RAG (vector embeddings)
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    article_id UUID REFERENCES knowledge_articles(id),
    document_id UUID REFERENCES documents(id),
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    embedding vector(1536), -- pgvector: text-embedding-3-large
    metadata JSONB DEFAULT '{}', -- {page, section, heading, source_type}
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vector similarity search index
CREATE INDEX idx_chunks_embedding ON document_chunks
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_chunks_tenant ON document_chunks (tenant_id);
```

### 2.3 Documents Domain

```sql
-- Generated and uploaded documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    document_type TEXT NOT NULL, -- invoice, report, letter, contract, receipt, custom
    format TEXT NOT NULL, -- pdf, docx, xlsx, pptx, csv
    template_id UUID REFERENCES document_templates(id),
    file_path TEXT NOT NULL, -- S3 path
    file_size_bytes BIGINT,
    generation_source TEXT, -- chat, agent, scheduled, api
    conversation_id UUID REFERENCES conversations(id),
    data_snapshot JSONB, -- ERP data used to generate document
    status TEXT DEFAULT 'generated', -- generated, reviewed, approved, sent
    generated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document templates (admin-managed)
CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    template_type TEXT NOT NULL, -- invoice, report, letter, contract, custom
    template_content TEXT NOT NULL, -- Handlebars/Mustache template
    output_format TEXT NOT NULL DEFAULT 'pdf',
    variables JSONB NOT NULL DEFAULT '[]', -- [{name, type, module, query}]
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.4 Agents Domain

```sql
-- Agent definitions (pre-built and custom)
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    agent_type TEXT NOT NULL, -- expense, pto, onboarding, invoice, inventory, reporting, compliance, custom
    playbook JSONB NOT NULL, -- Step definitions, tool configs, approval rules
    is_active BOOLEAN DEFAULT true,
    requires_approval_above NUMERIC, -- Financial threshold for human approval
    max_steps INTEGER DEFAULT 20,
    timeout_seconds INTEGER DEFAULT 300,
    modules_required TEXT[], -- Modules this agent needs access to
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agent task executions
CREATE TABLE agent_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    agent_id UUID NOT NULL REFERENCES agents(id),
    conversation_id UUID REFERENCES conversations(id),
    user_id UUID NOT NULL,
    goal TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, planning, executing, awaiting_approval, completed, failed, cancelled
    plan JSONB, -- Generated execution plan
    steps_completed INTEGER DEFAULT 0,
    steps_total INTEGER,
    current_step JSONB, -- Current step being executed
    result JSONB, -- Final result summary
    error_message TEXT,
    approval_required BOOLEAN DEFAULT false,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agent execution steps (audit trail)
CREATE TABLE agent_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    task_id UUID NOT NULL REFERENCES agent_tasks(id),
    step_index INTEGER NOT NULL,
    action TEXT NOT NULL, -- api_call, llm_reasoning, user_prompt, approval_wait
    tool_name TEXT, -- Module API or function called
    input JSONB, -- Input parameters
    output JSONB, -- Result
    status TEXT NOT NULL, -- pending, executing, completed, failed, skipped
    latency_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.5 Search Domain

```sql
-- Enterprise search indices
CREATE TABLE search_indices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    source_module TEXT NOT NULL, -- finance, hr, inventory, knowledge, etc.
    entity_type TEXT NOT NULL, -- invoice, employee, product, article, etc.
    entity_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Searchable text content
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    last_indexed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_search_embedding ON search_indices
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 200);

CREATE INDEX idx_search_tenant_module ON search_indices (tenant_id, source_module);
CREATE INDEX idx_search_fulltext ON search_indices USING gin(to_tsvector('english', content));
```

### 2.6 User Preferences Domain

```sql
-- Per-user assistant preferences
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    user_id UUID NOT NULL,
    preference_key TEXT NOT NULL,
    preference_value JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, user_id, preference_key)
);

-- Frequently used queries (for autocomplete and suggestions)
CREATE TABLE query_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    user_id UUID NOT NULL,
    query_text TEXT NOT NULL,
    intent_category TEXT,
    modules_used TEXT[],
    frequency INTEGER DEFAULT 1,
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.7 Feedback and Analytics Domain

```sql
-- User feedback on responses
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    message_id UUID NOT NULL REFERENCES messages(id),
    user_id UUID NOT NULL,
    rating TEXT NOT NULL, -- thumbs_up, thumbs_down
    category TEXT, -- accurate, inaccurate, slow, unhelpful, offensive
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Usage analytics (aggregated)
CREATE TABLE usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    date DATE NOT NULL,
    total_conversations INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    total_tokens_input BIGINT DEFAULT 0,
    total_tokens_output BIGINT DEFAULT 0,
    total_documents_generated INTEGER DEFAULT 0,
    total_agent_tasks INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER,
    accuracy_rate FLOAT, -- Based on feedback
    unique_users INTEGER DEFAULT 0,
    top_intents JSONB DEFAULT '[]',
    top_modules JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, date)
);
```

## 3. Data Flow Architecture

### 3.1 Query Processing Data Flow

```
User Message → messages (INSERT, role='user')
    │
    ▼
Intent Classification → messages.intent_classification (UPDATE)
    │
    ▼
Permission Check → user RBAC validated against module access
    │
    ▼
Module API Calls → External ERP module APIs (read-only)
    │
    ▼
RAG Context → document_chunks (vector search)
    │
    ▼
LLM Response Generation → messages (INSERT, role='assistant')
    │
    ▼
Analytics Update → usage_analytics (UPSERT)
```

### 3.2 Knowledge Ingestion Data Flow

```
Document Upload → S3 storage
    │
    ▼
Document Parsing → Apache Tika (text extraction)
    │
    ▼
Chunking → Split into 512-token chunks with 64-token overlap
    │
    ▼
Embedding → text-embedding-3-large (1536 dimensions)
    │
    ▼
Storage → document_chunks (content + embedding + metadata)
    │
    ▼
Index → pgvector IVFFlat index updated
```

## 4. Data Retention Policies

| Data Type | Retention | Rationale |
|---|---|---|
| Conversations and messages | 2 years (active), 7 years (audit archive) | Compliance audit trail |
| Document chunks and embeddings | Indefinite (while article is published) | Knowledge base availability |
| Generated documents | 5 years | Business record retention |
| Agent execution logs | 7 years | Audit and compliance |
| User preferences | Active while user exists | User experience |
| Usage analytics | 3 years | Trend analysis |
| Feedback | 2 years | Model improvement |

## 5. Data Security

| Control | Implementation |
|---|---|
| Multi-tenant isolation | Row-level security policies on tenant_id for all tables |
| Encryption at rest | AES-256 via AWS RDS encryption |
| Encryption in transit | TLS 1.3 for all connections |
| PII handling | Detected and redacted before LLM submission; stored in encrypted columns |
| Backup | Daily automated backups, 30-day retention, cross-region replication |
| Access audit | All database access logged via pgAudit extension |

## 6. Estimated Data Volumes (Per Tenant)

| Table | Monthly Growth | 12-Month Total |
|---|---|---|
| conversations | 5,000 rows | 60,000 rows |
| messages | 75,000 rows | 900,000 rows |
| document_chunks | 10,000 rows | 120,000 rows |
| documents | 500 rows | 6,000 rows |
| agent_tasks | 1,000 rows | 12,000 rows |
| agent_steps | 10,000 rows | 120,000 rows |
| search_indices | 50,000 rows | 600,000 rows |
| feedback | 5,000 rows | 60,000 rows |

---

*Confidential. Sovereign Assistant. All rights reserved.*
