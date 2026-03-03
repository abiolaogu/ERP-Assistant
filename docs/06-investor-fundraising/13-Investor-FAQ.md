# Sovereign Assistant -- Investor FAQ

**Confidential | Series A | March 2026**

---

## 20 Hard Questions

### Q1: Microsoft Copilot has 400M+ Office 365 users. How do you compete with that distribution?

We do not compete with Copilot -- we serve a different need. Copilot helps users write better emails and format spreadsheets. Sovereign Assistant answers "Which departments are over budget on headcount?" by querying the HR and Finance modules simultaneously, returning a data table with source citations in 8 seconds. Copilot cannot do this. It has no access to ERP operational data beyond Dynamics 365, and even that integration is limited to basic queries. Our positioning is not "better Copilot" -- it is "ERP copilot," a category Copilot does not occupy. In competitive evaluations, we win 83% of the time because customers quickly realize Copilot's $30/user/month buys document editing help, while our $20/user/month buys access to their entire business.

### Q2: How do you prevent hallucination? Enterprise customers cannot tolerate fabricated financial data.

This is our most important technical challenge, and we have built four layers of defense:

1. **Grounded responses:** All factual queries are answered from module API responses, not LLM parametric knowledge. The LLM generates natural language from structured API data -- it does not "remember" financial figures.
2. **RAG pipeline with citations:** Policy and procedure queries are grounded in retrieved document chunks with explicit citations linking every claim to its source.
3. **Confidence scoring:** Every response includes a confidence score. Responses below 0.7 confidence trigger a disclaimer: "I am not confident in this answer. Please verify."
4. **Post-processing validation:** Numerical responses are cross-checked against the source API response before delivery.

Current accuracy: 94.2% for cross-module queries. The 5.8% error rate is primarily in ambiguous queries where the assistant misinterprets intent (not hallucination of data). We are investing in intent classification improvement to reach 97% by Q4 2026.

### Q3: Your LLM costs are a significant portion of COGS. What happens if API prices increase?

Our model routing strategy mitigates this risk completely. Currently, 45% of queries are routed to Claude Haiku ($0.0008/query), 40% to Claude Sonnet ($0.008/query), and 15% to specialized models. Our blended cost is $0.018/query. Even if Anthropic doubled prices, our blended cost would be $0.032/query -- still only 12% of revenue per query. Additionally: (a) LLM prices have historically declined 50%+ annually, (b) we have a multi-provider architecture (Claude → GPT-4o → Llama fallback), (c) self-hosted inference is on our roadmap for Q3 2027, providing a permanent cost floor. LLM cost is actually our most favorable long-term COGS trend.

### Q4: How do you handle data privacy when user queries go through third-party LLMs?

Three safeguards:

1. **PII redaction:** Microsoft Presidio scans all user input before LLM submission. Names, SSNs, credit card numbers, and other PII are replaced with generic tokens. The LLM never sees raw PII.
2. **No data training:** Our contracts with Anthropic and OpenAI explicitly prohibit using our customers' data for model training. We use API-only access, not fine-tuning pipelines.
3. **Architecture:** The LLM only sees the query and relevant context (API results, RAG chunks). It never has direct database access. All data retrieval happens through our API layer with RBAC enforcement.

For regulated industries, our self-hosted LLM option (Q3 2027) will allow on-premises inference with zero data leaving the customer's network.

### Q5: 148% NRR seems aggressive. What specifically drives expansion?

Four vectors:

1. **User expansion (48%):** Customer deploys to Finance department (100 users), then HR requests access, then Operations, then everyone. Our largest customer grew from 120 to 800 users in 10 months.
2. **Tier upgrade (28%):** Teams start on Starter ($5/user), discover AI agents, upgrade to Professional ($12/user), then enterprise SSO requirements push to Enterprise ($20/user).
3. **Agent adoption (14%):** After seeing expense agent save 30 minutes per report, teams add more agents.
4. **Query volume (10%):** Power users exceed included query limits, generating overage revenue.

We conservatively model NRR declining to 132% by 2030 as the customer base matures. Even at 132%, revenue compounds at elite rates.

### Q6: What is your technical moat? Can a well-funded startup replicate you in 12 months?

Our moat has five layers, each requiring different capabilities to replicate:

1. **24-module native integration** (18-24 months): Requires building or deeply integrating with an ERP platform. This is a company-building decision, not a feature sprint.
2. **Shared Redpanda event bus** (cannot be retrofitted): Real-time event correlation across modules requires architectural commitment from day one.
3. **GraphQL federation** (6-12 months): Unified query layer across all module schemas via Hasura.
4. **Agent framework with 200+ tools** (12 months): Each tool is tested, permissioned, and documented. Safety controls are production-hardened.
5. **Intent classifier trained on 500K examples** (6 months): Domain-specific training data from real enterprise queries.

A well-funded startup could replicate individual components, but the combined system -- native ERP access + real-time events + federated queries + agent safety + domain ML models -- represents 2-3 years of integrated development.

### Q7: Why per-user pricing instead of per-query?

Per-user pricing is superior for three reasons:

1. **Predictability:** Customers budget annually based on headcount, not variable query volume. This eliminates the #1 procurement objection.
2. **Adoption alignment:** Per-query pricing discourages usage (users self-censor to control costs). Per-user pricing encourages maximum adoption, which drives satisfaction, retention, and expansion.
3. **Revenue quality:** Per-user subscriptions are recurring and predictable. Per-query revenue fluctuates with business cycles.

We include generous query limits per tier (500/1,500/unlimited) so that the overage mechanism only triggers for extreme power users (less than 5% of users exceed limits).

### Q8: How accurate is cross-module query resolution? Give me a specific failure mode.

Current accuracy: 94.2%. The 5.8% error rate breaks down as:

- **Intent misclassification (3.2%):** The assistant routes to the wrong module. Example: "What is our headcount budget?" could be HR (headcount data) or Finance (budget data). We need both. If the classifier picks only one, the answer is incomplete.
- **Entity resolution errors (1.4%):** Ambiguous references. "Show me Acme's invoices" fails if there are two vendors named "Acme" in different modules.
- **Data freshness (0.8%):** Module API returns stale data if the underlying database has replication lag.
- **LLM formatting errors (0.4%):** Correct data returned but poorly formatted in the response.

Zero errors are due to data fabrication (hallucination). Every data point comes from module APIs. We are investing in intent classification improvement (target: 97% by Q4 2026) and entity disambiguation (asking clarifying questions when references are ambiguous).

### Q9: Who is your buyer? CIO, department head, or someone else?

Our sales process involves three personas:

1. **Champion (initiates):** VP of Operations, VP of Finance, or VP of HR. They experience the pain daily and discover us through content, events, or peer referral.
2. **Economic buyer (approves):** CIO or CTO. They approve the budget, validate security, and green-light IT integration.
3. **Technical gatekeeper (validates):** IT Director or Security team. They review architecture, RBAC, data handling, and compliance.

The 30-day free trial is critical: the champion deploys it to their team, sees results, and becomes an internal advocate before the CIO is involved. By the time we engage the economic buyer, the champion has data proving ROI.

### Q10: What is your customer acquisition cost, and how does it compare to competitors?

CAC is $32,000 fully loaded (sales + marketing + SE time). This is low for enterprise SaaS because:

1. Our 30-day trial costs us ~$200 in LLM inference (50 users x 30 days)
2. The trial does the selling -- 45% of trials convert to paid POC
3. POC-to-close rate is 68%, reducing wasted sales effort
4. Average sales cycle is 4.2 months (fast for enterprise)

Comparison: Moveworks' estimated CAC is $80-100K (longer cycles, more enterprise selling). Glean's is ~$40-50K. Our 4.6-month payback and 16.3x LTV:CAC are best-in-class for enterprise AI.

### Q11: What happens when LLMs get good enough that enterprises build this themselves?

This question assumes the LLM is the hard part. It is not. The hard parts are:

1. Integrating with 24 ERP modules (APIs, schemas, auth, data normalization)
2. Building RBAC enforcement across all modules
3. Creating an agent framework with safety controls
4. Producing grounded responses with citations (not hallucination)
5. Maintaining and updating 200+ tools as modules evolve

Better LLMs make our product better (lower cost, higher accuracy) without reducing the value of our integration and safety layers. This is analogous to saying "better databases will eliminate the need for Salesforce." The integration, workflow, and domain logic are the value -- not the underlying technology.

### Q12: How do you handle the cold-start problem for new customers?

Three strategies:

1. **Module documentation auto-ingestion:** When a customer connects their modules, we automatically extract API schemas, entity definitions, and documentation into our knowledge base. This provides baseline query capability from day one.
2. **Transfer learning from cross-customer patterns:** Our intent classifier is pre-trained on 500K queries from existing customers. Common query patterns (revenue by period, headcount by department, overdue invoices) work immediately.
3. **14-day onboarding sprint:** CSM team seeds the knowledge base with customer-specific policies, procedures, and FAQs during the first two weeks. By day 14, the assistant handles 80%+ of common queries.

### Q13: Your gross margin is 75%. LLM-intensive businesses often have lower margins. Can you sustain this?

Our 75% gross margin is already above the enterprise AI average because of model routing. We improve to 85% by 2030 through three mechanisms:

1. **Model routing optimization (5pp):** Increasing the share of queries handled by Haiku (cheap) from 45% to 65%.
2. **LLM price decline (4pp):** Industry trend of 30-50% annual price reduction continues.
3. **Response caching (2pp):** Identical queries return cached responses, avoiding LLM calls entirely.
4. **Self-hosted inference (bonus):** If we deploy self-hosted Llama for simple queries by 2028, additional 3-5pp margin improvement.

For comparison: Datadog operates at 81% gross margin, CrowdStrike at 77%, Snowflake at 73%. Our target of 85% is achievable and consistent with best-in-class SaaS.

### Q14: What is your data retention and deletion policy?

- **Conversations:** Retained for 2 years (active), then archived for 5 additional years (compliance audit trail)
- **Knowledge base:** Retained while article is published; deleted within 30 days of archival
- **Generated documents:** 5 years (business record retention)
- **Agent execution logs:** 7 years (audit compliance)
- **User data deletion:** GDPR-compliant right-to-deletion; all user data purged within 30 days of request
- **LLM providers:** No data retained by providers (contractual guarantee)

### Q15: How do you measure and ensure response quality at scale?

Four quality mechanisms:

1. **Automated accuracy testing:** 2,000 test queries with known correct answers, run daily. Regression alerts if accuracy drops below 93%.
2. **User feedback:** Thumbs up/down on every response. Currently 87% positive. Negative feedback triggers automatic review.
3. **Sampling audit:** QA team manually reviews 100 random queries per week for accuracy, completeness, and citation correctness.
4. **Customer health scores:** DAU/MAU ratio, queries per user, and feedback rate are tracked per customer. Declining metrics trigger CSM investigation.

### Q16: What is your approach to responsible AI?

Six principles govern our AI development:

1. **Grounding over generation:** Factual responses come from APIs and documents, not LLM parametric knowledge
2. **Permission-first:** RBAC is enforced before every response; no data leakage
3. **Transparency:** Every response includes source citations and confidence scores
4. **Human-in-the-loop:** Agent actions involving financial transactions or data modifications require explicit approval
5. **Privacy-by-design:** PII is redacted before LLM processing; no customer data used for training
6. **Auditability:** Complete audit trail of every query, response, and agent action

### Q17: Why $20M? Why not $12M or $30M?

$20M is calibrated to achieve $5.8M ARR and Series B optionality within 18 months:

- **$12M** would fund either engineering OR GTM, not both. We would reach $3.5M ARR but miss the expansion opportunity.
- **$20M** funds both tracks: 18 new engineers (product moat) + 13 GTM hires (revenue capacity). Combined, this converts our $4.8M pipeline and builds a repeatable sales motion.
- **$30M** is excess capital at this stage. Our burn profile does not warrant it, and the additional dilution is unnecessary.

### Q18: What is your view on the AI agent safety problem?

Agent safety is solvable with proper architecture, and we have implemented it:

1. **Approval gates:** Financial transactions above configurable thresholds require human confirmation
2. **Read-first architecture:** 85% of queries are read-only (data retrieval). Write operations are limited to a controlled set of tools.
3. **Rollback capability:** If an agent step fails, previous steps are reversible
4. **Blast radius limits:** Maximum number of records an agent can modify per execution
5. **Audit immutability:** Every agent action is logged in append-only audit trail

In 3,400 agent tasks executed monthly, we have had zero unintended modifications. The key insight: most enterprise AI assistant value comes from reading data (queries, reports), not writing it (transactions). We are conservative with write operations by design.

### Q19: What does your cap table look like post-Series A?

| Holder | Pre-Series A | Post-Series A (est.) |
|---|---|---|
| Founders (3) | 62% | 49-52% |
| Seed Investors | 18% | 14-15% |
| Series A Investors | -- | 18-22% |
| Employee Pool (allocated) | 12% | 9-10% |
| Unallocated Pool (new) | 8% | 5-6% |

Clean cap table. No convertible notes outstanding. Standard Series A terms (1x non-participating preferred, weighted average anti-dilution, standard protective provisions).

### Q20: Walk me through the downside scenario.

**What goes wrong:** Enterprise sales cycles extend to 8+ months. We acquire 25 customers by 2028 instead of 85. NRR declines to 120%. LLM costs do not decrease as projected.

**Financial impact:** 2028 ARR of $7-9M instead of $18.5M. Gross margin 76% instead of 82%. Company burns through $20M over 30 months.

**Response options:**
1. Raise smaller Series B ($15-20M at $80-120M valuation) -- still viable at $7-9M ARR with strong NRR
2. Shift to profitability: cut to $250K/month burn, grow organically on cash flow
3. Strategic sale: at $7-9M ARR with 24-module ERP integration, worth $100-200M to strategic acquirer (Microsoft, Salesforce, SAP)

**Investor protection:** 1x liquidation preference ensures $20M returned before common shareholders. Technology IP + customer base + team create a valuation floor of $50-80M even in distressed scenarios. Probability of total loss: <3%.

---

*Confidential. Sovereign Assistant, Inc. All rights reserved.*
