# Sovereign Assistant -- Pitch Deck Script

**15-Slide Series A Presentation | March 2026**

---

## Slide 1: Title

**SOVEREIGN ASSISTANT**
*The AI Copilot for Enterprise Operations*

Series A | $20M Raise

Tagline: "Ask your business anything. Get answers in seconds. Automate the rest."

---

## Slide 2: The Problem

**Enterprise Knowledge Is Trapped in Silos**

- Employees spend **28% of their workweek** searching for information (McKinsey)
- Average cross-module query takes **47 minutes** of manual work
- **$18.7M/year** lost per 5,000-employee enterprise in productivity drag
- **72% of enterprise data** is never accessed because employees cannot find it
- New employees take **3-6 months** to learn ERP navigation
- IT help desk fields **40% tickets** for "how do I find X in the system"

---

## Slide 3: The Market

**$12B Enterprise AI Assistant Market, 32% CAGR**

| Segment | Size (2025) | Size (2030) | CAGR |
|---|---|---|---|
| TAM (Global Enterprise AI Assistant) | $12B | $48B | 32% |
| SAM (ERP-connected AI, 5K+ employees) | $3.6B | $14.4B | 32% |
| SOM (US enterprise, multi-module ERP) | $720M | $2.9B | 32% |

Three secular tailwinds: GenAI enterprise adoption, ERP complexity growth, labor cost inflation.

---

## Slide 4: The Solution

**Sovereign Assistant: Your ERP Speaks Natural Language**

| Capability | Description | Impact |
|---|---|---|
| **Natural Language Query** | Ask questions across 24 ERP modules | 47 min → 8 sec response time |
| **Document Generation** | Generate invoices, reports, contracts from live data | 45 min → 30 sec per document |
| **AI Agents** | Autonomous task execution (expense reports, PTO, onboarding) | 1,000+ tasks/month automated |
| **Meeting Intelligence** | Summarize meetings, extract action items, create tasks | 2 hours/week recovered per manager |
| **Knowledge Base** | RAG-powered institutional knowledge capture | 60% help desk deflection |
| **Multi-Modal Input** | Text, voice, and image (receipt scanning) | Warehouse/field worker access |

---

## Slide 5: Demo -- Real Customer Scenario

**"What is our gross margin by product line for Q4?"**

1. User types natural language query in chat interface
2. Intent classifier identifies: Finance module, aggregation query, Q4 2025 date range
3. Permission enforcer validates user has finance read access
4. GraphQL query executes against Finance module (1.2 seconds)
5. LLM generates natural language response with data table
6. Citation links to source: Finance > Revenue Report > Q4 2025
7. Follow-up: "Now compare to Q3" -- context maintained seamlessly

**Result:** Board-ready answer in 4.8 seconds. Previously required 2-day wait for finance team.

---

## Slide 6: AI Agents -- Beyond Answers

**"Process my expense report for the Chicago trip"**

Agent execution (fully autonomous):
1. Finds 4 receipts uploaded by user
2. OCR extracts vendor, amount, date, category from each
3. Categorizes: Flight ($648), Hotel ($1,420), Meals ($312), Transport ($467)
4. Creates expense report in Finance module
5. Shows summary for user approval (total: $2,847)
6. User clicks "Approve" -- submitted to manager

**7 pre-built agents:** Expense, PTO, Onboarding, Invoice, Inventory, Reporting, Compliance. Each eliminates 15-45 minutes of manual data entry per task.

---

## Slide 7: Architecture Moat

**Native ERP Integration Is Not Replicable**

- Shared **Redpanda event bus** connects all 24 ERP modules in real-time
- **GraphQL federation** (Hasura) provides unified query layer
- **RBAC enforcement** at every layer -- responses respect user permissions
- **Grounded responses** with source citations prevent hallucination
- **PII guard** redacts sensitive data before LLM processing

Competitors (Microsoft Copilot, Glean) require months of API integration per data source. We have native access to 24 modules from day one.

---

## Slide 8: Business Model

**Per-User Pricing with Query Overage**

| Tier | Price | Includes | Target |
|---|---|---|---|
| Starter | $5/user/month | NLQ, basic document gen, knowledge base | Department teams |
| Professional | $12/user/month | + AI agents, meeting intelligence, voice | Organization-wide |
| Enterprise | $20/user/month | + Custom agents, API access, SSO/RBAC, SLA | Large enterprise |

**Query Overage:** Included queries per tier (500/1,500/unlimited). Overage at $0.01/query.

**Unit Economics:**
- Average ACV: $100,000 (400 users x $20/user/month)
- Gross Margin: 75% (improving to 85% via inference cost optimization)
- CAC: $32,000
- LTV (5-year): $520,000
- LTV:CAC: 16.3x
- CAC Payback: 4.6 months

---

## Slide 9: Traction

**$1.2M ARR, Zero Churn, 148% NRR**

| Metric | Value |
|---|---|
| ARR | $1,200,000 |
| Customers | 12 enterprise accounts |
| Monthly Active Users | 4,800 |
| Daily Queries | 18,000 |
| Query Accuracy | 94.2% |
| Avg Response Time | 4.8 seconds |
| Documents/Month | 6,200 |
| Agent Tasks/Month | 3,400 |
| Net Revenue Retention | 148% |
| Logo Churn | 0% |

**Growth driver:** Land in one department (50-100 users) → word-of-mouth expansion to entire organization (500-2,000 users) within 6 months. Average customer quadruples user count within 12 months.

---

## Slide 10: Customer Proof Points

**Case Study 1: $3B Manufacturing Company**
- Deployed to 800 users across 6 departments
- Cross-module queries reduced from 47 min to 6 seconds average
- 4,200 documents generated per month (previously manual)
- IT help desk tickets for ERP questions reduced 58%
- ACV: $192K (grew from $48K initial contract)

**Case Study 2: 2,000-Employee Financial Services Firm**
- 1,200 active users (60% adoption in 3 months)
- Finance team saves 120 hours/month on report generation
- Expense agent processes 800+ reports/month autonomously
- ACV: $144K

**Case Study 3: Healthcare System (4 hospitals)**
- Compliance agent automates regulatory report generation
- Knowledge base captures 340 institutional knowledge articles
- New employee ERP proficiency: 2 weeks vs. 3 months previously
- ACV: $96K

---

## Slide 11: Competitive Landscape

| Capability | Sovereign Assistant | Microsoft Copilot | Google Duet | Glean | Moveworks |
|---|---|---|---|---|---|
| ERP Native Access (24 modules) | Yes | No | No | No | No |
| Cross-Module Queries | Yes | No | No | Limited | No |
| Workflow Execution (mutations) | Yes | Limited (Office) | Limited (Workspace) | No | Yes (IT only) |
| AI Agents | 7 pre-built | No | No | No | IT ticketing only |
| Document Generation from ERP Data | Yes | Templates only | Templates only | No | No |
| RBAC-Enforced Responses | Yes | Partial | Partial | Partial | Yes |
| On-Premises LLM Option | Yes | No | No | No | No |

**Key Insight:** Copilot and Duet are horizontal productivity tools. Glean is search. Moveworks is IT automation. Sovereign Assistant is the only **ERP-native AI copilot** that combines query, action, and automation across business operations.

---

## Slide 12: Go-To-Market

**Land in Finance → Expand to All Departments**

**Phase 1 (Now-Q4 2026):** US Enterprise
- Entry point: Finance and HR departments (highest query volume)
- Motion: Product-led trial (50 users free for 30 days) + enterprise sales
- Land: $48-96K ACV (100-400 users)
- Expand: $144-288K ACV (600-1,200 users within 12 months)

**Phase 2 (2027):** UK/EU + Mid-Market
- UK/EU: GDPR compliance, EU data residency, local sales team
- Mid-Market: Self-serve tier for 100-500 employee companies

**Phase 3 (2028+):** Platform + Global
- API platform for third-party integrations
- Marketplace for custom agent templates
- APAC expansion via channel partners

---

## Slide 13: Financial Projections

| Year | ARR | Customers | Users | Gross Margin | Net Burn |
|---|---|---|---|---|---|
| 2026 | $1.2M | 12 | 4,800 | 75% | $4.2M |
| 2027 | $5.8M | 35 | 22,000 | 78% | $6.1M |
| 2028 | $18.5M | 85 | 68,000 | 81% | $3.8M |
| 2029 | $48.0M | 180 | 165,000 | 83% | -$4.2M (CF+) |
| 2030 | $95.0M | 360 | 350,000 | 85% | -$22M (CF+) |

Cash-flow positive by Q2 2029. $20M provides 28 months of runway.

---

## Slide 14: Team

| Role | Background |
|---|---|
| CEO | Ex-VP Product at Salesforce Einstein; led AI integration across Sales Cloud |
| CTO | Ex-Staff Engineer at Anthropic; built enterprise API infrastructure for Claude |
| VP Engineering | Ex-Engineering Director at Slack; scaled platform from 10M to 40M DAU |
| VP Revenue | Built Moveworks enterprise sales from $5M to $60M ARR |
| Head of AI | Ex-Research Scientist at Google Brain; 18 papers on RAG and retrieval systems |

**Advisory Board:** Former CTO of ServiceNow, GP at Sequoia, CISO at JPMorgan Chase

---

## Slide 15: The Ask

**$20M Series A**

| Use of Funds | Amount | % |
|---|---|---|
| Engineering & AI Research | $9.0M | 45% |
| Sales & Marketing | $6.0M | 30% |
| Infrastructure | $2.0M | 10% |
| G&A / Buffer | $3.0M | 15% |

**18-Month Milestones:**
- $5.8M ARR (4.8x growth)
- 35 enterprise customers
- 22,000 active users
- SOC 2 Type II + ISO 27001
- UK/EU market entry

**Why now:** Pipeline is $4.8M and growing. We need AEs to close it. Every month of delay is enterprise revenue left on the table.

---

*Confidential. Do not distribute without written permission.*
