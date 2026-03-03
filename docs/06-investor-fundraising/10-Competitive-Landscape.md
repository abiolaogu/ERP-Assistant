# Sovereign Assistant -- Competitive Landscape

**Confidential | Series A | March 2026**

---

## 1. Market Map

```
┌─────────────────────────────────────────────────────────────┐
│              ENTERPRISE AI ASSISTANT ECOSYSTEM               │
├───────────────┬───────────────┬──────────────┬──────────────┤
│  PRODUCTIVITY │   SEARCH      │  IT HELPDESK │  ERP COPILOT │
│               │               │              │              │
│  MS Copilot   │  Glean        │  Moveworks   │  Sovereign   │
│  Google Duet  │  Guru         │  Espressive  │  Assistant   │
│  Notion AI    │  Coveo        │  Aisera      │              │
│  Jasper       │  Elastic      │              │  (sole       │
│               │               │              │   occupant)  │
│  "Edit docs"  │ "Find info"   │ "Fix IT"     │ "Run biz"   │
└───────────────┴───────────────┴──────────────┴──────────────┘
```

## 2. Detailed Competitor Analysis

### 2.1 Microsoft Copilot

| Attribute | Details |
|---|---|
| Revenue | ~$5B run rate (estimated, bundled pricing) |
| Pricing | $30/user/month (Microsoft 365 Copilot) |
| Focus | Office 365 productivity (Word, Excel, PowerPoint, Outlook, Teams) |

**Strengths:** Massive distribution (400M+ Office 365 users), deep integration with Microsoft stack, enterprise trust, Dynamics 365 integration roadmap.

**Weaknesses:** Office-centric (cannot query non-Microsoft systems), no cross-module ERP queries, no autonomous agent execution, limited to Microsoft ecosystem, $30/user is expensive for limited scope.

**Sovereign vs. Copilot:**

| Capability | Sovereign | Copilot |
|---|---|---|
| ERP data access | 24 modules natively | Only Dynamics 365 (limited) |
| Cross-module queries | Yes (any combination) | No |
| Workflow execution | Yes (AI agents) | Limited (Office tasks) |
| Document generation from ERP data | Yes | Templates only (no live ERP data) |
| Vendor agnostic | Yes | Microsoft ecosystem only |
| Price | $5-20/user | $30/user |

### 2.2 Google Duet AI

| Attribute | Details |
|---|---|
| Focus | Google Workspace (Docs, Sheets, Slides, Gmail, Meet) |
| Pricing | $30/user/month |

**Strengths:** Strong in Google Workspace ecosystem, good meeting summarization, Workspace distribution.

**Weaknesses:** Google Workspace only (no ERP access), no enterprise operations capability, limited enterprise adoption vs. Microsoft, no agent framework.

### 2.3 Glean

| Attribute | Details |
|---|---|
| Revenue | ~$120M ARR (estimated) |
| Funding | $360M total raised |
| Pricing | ~$8/user/month |
| Focus | Enterprise search across SaaS applications |

**Strengths:** Best-in-class enterprise search, 100+ SaaS connectors, strong NLP for search relevance, growing rapidly.

**Weaknesses:** Read-only (search, not action), no workflow execution, no document generation from live data, connector-based integration (not native), no AI agents.

**Sovereign vs. Glean:**

| Capability | Sovereign | Glean |
|---|---|---|
| Enterprise search | Yes (24 modules) | Yes (100+ SaaS) |
| Natural language query | Yes (structured data) | Yes (unstructured docs) |
| Cross-module data joins | Yes | No (search only) |
| Workflow execution | Yes (mutations, agents) | No |
| Document generation | Yes (from ERP data) | No |
| AI agents | 7 pre-built | No |
| Data freshness | Real-time (live APIs) | Periodic sync (hours lag) |
| RBAC enforcement | Native (per-module) | Connector-dependent |

### 2.4 Moveworks

| Attribute | Details |
|---|---|
| Revenue | ~$100M ARR (estimated) |
| Funding | $315M total raised |
| Pricing | ~$15/user/month |
| Focus | IT service desk automation |

**Strengths:** Strong in IT ticketing automation, ServiceNow integration, employee service desk. Good traction in large enterprises.

**Weaknesses:** IT-only (no finance, HR, operations, procurement access), cannot query business data, no cross-module intelligence, expensive for narrow scope.

**Sovereign vs. Moveworks:**

| Capability | Sovereign | Moveworks |
|---|---|---|
| IT help desk | Yes (via IT module) | Yes (core focus) |
| Finance queries | Yes | No |
| HR queries | Yes | Limited (benefits FAQ) |
| Operations queries | Yes | No |
| Cross-module data | Yes | No |
| Document generation | Yes | No |
| Custom AI agents | Yes (any module) | Limited (IT workflows) |

### 2.5 Custom GPT Wrappers (Internal Build)

Many enterprises attempt to build their own AI assistant using ChatGPT API + custom connectors.

**Strengths:** Full control, no vendor dependency, can customize extensively.

**Weaknesses:** Typically takes 6-12 months to build basic functionality, no RBAC enforcement (security risk), no citation/grounding framework (hallucination risk), no agent safety controls, requires ongoing ML engineering team, expensive to maintain.

**Cost comparison:**
- Custom build: $500K-$1.5M initial + $300K+/year maintenance
- Sovereign Assistant: $48K-$480K/year (scales with users)
- Break-even: Sovereign is cheaper for organizations with <3 dedicated ML engineers

## 3. Feature Comparison Matrix

| Feature | Sovereign | Copilot | Duet | Glean | Moveworks |
|---|---|---|---|---|---|
| ERP data queries | 24 modules | Office only | Workspace only | Search only | IT only |
| Cross-module joins | Yes | No | No | No | No |
| Document generation | From ERP data | Templates | Templates | No | No |
| AI agents (task execution) | 7 pre-built | No | No | No | IT workflows |
| Meeting summarization | Yes | Yes | Yes | No | No |
| Voice commands | Yes | Yes (Teams) | Yes (Meet) | No | No |
| Receipt/image processing | Yes | No | No | No | No |
| Knowledge base (RAG) | Yes | Limited | Limited | Yes (core) | Limited |
| RBAC enforcement | Per-module | Per-file | Per-file | Connector | Per-ticket |
| Response citations | Yes | Limited | Limited | Yes | No |
| On-premises LLM option | Roadmap | No | No | No | No |
| Price (per user/month) | $5-20 | $30 | $30 | ~$8 | ~$15 |

## 4. Win/Loss Analysis

### Win Patterns (12 closed deals)

| Factor | Frequency | Description |
|---|---|---|
| Cross-module query capability | 100% | Every deal cited multi-module access as primary differentiator |
| 30-day trial results | 92% | Prospects saw measurable time savings in trial period |
| Lower price than Copilot | 83% | 33-83% less expensive with broader scope |
| Agent automation ROI | 67% | Expense and reporting agents demonstrated immediate value |
| RBAC enforcement | 58% | Security team approved due to native permission control |

### Loss Patterns (5 lost evaluations)

| Factor | Count | Description |
|---|---|---|
| Microsoft ecosystem lock-in | 2 | Customer all-in on Microsoft, chose Copilot for bundling |
| Build-not-buy | 2 | Internal engineering team insisted on custom build |
| Budget timing | 1 | AI budget allocated to different initiative for FY2026 |

## 5. Competitive Moat

| Moat | Defensibility | Time to Replicate |
|---|---|---|
| 24-module native integration | Very high | 18-24 months (requires ERP platform) |
| Shared Redpanda event bus | Very high | Cannot be retrofitted |
| Agent framework (200+ tools) | High | 12 months |
| RAG grounding pipeline | Medium | 6 months |
| RBAC enforcement layer | High | 6-12 months |
| Intent classifier (97% accuracy) | Medium | 6 months (500K labeled examples) |

---

*Confidential. Sovereign Assistant, Inc. All rights reserved.*
