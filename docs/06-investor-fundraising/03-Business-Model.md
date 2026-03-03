# Business Model -- Sovereign Assistant

**Confidential -- Series A Investment Memorandum**

---

## 1. Revenue Model: Per-User Pricing

| Tier | Price/User/Month | Target Segment | Included |
|---|---|---|---|
| **Starter** | $15 | All knowledge workers | Chat AI, RAG over documents, document summarization, enterprise search, 5 knowledge bases |
| **Professional** | $30 | Power users, managers | All Starter + NLQ, workflow automation, email drafting, meeting intelligence, unlimited KBs |
| **Enterprise** | $45 | Executives, admins, regulated | All Professional + agent framework, custom agents, API access, SSO/SAML, compliance audit, SLA |

**Deployment add-on:** Self-hosted / on-premises: +$5/user/month (includes Helm charts, support, updates)

---

## 2. Revenue Per Customer

| Segment | Avg Users | Tier Mix | Monthly Revenue | ACV |
|---|---|---|---|---|
| SMB (50-200) | 40 | 70% Starter, 30% Pro | $780 | $9,360 |
| Mid-Market (200-2K) | 200 | 40% Starter, 40% Pro, 20% Ent | $5,400 | $64,800 |
| Enterprise (2K+) | 1,500 | 20% Starter, 40% Pro, 40% Ent | $49,500 | $594,000 |

**Blended average ACV:** $80,000 (Year 1 mix) scaling to $141,000 by Year 5.

---

## 3. Unit Economics

| Metric | Year 1 | Year 3 | Year 5 |
|---|---|---|---|
| ACV | $80K | $122K | $141K |
| CAC | $65K | $48K | $38K |
| CAC Payback | 10 months | 5 months | 3 months |
| Gross Margin | 68% | 79% | 84% |
| NRR | 120% | 140% | 150% |
| Logo Churn | 12% | 7% | 4% |
| LTV (5-year) | $336K | $732K | $1.18M |
| LTV:CAC | 5.2:1 | 15.3:1 | 31:1 |

### COGS Breakdown

| Component | % Revenue | Notes |
|---|---|---|
| LLM inference compute (GPU) | 18% | Self-hosted, amortized across users |
| Embedding & search infrastructure | 5% | pgvector, index maintenance |
| Object storage (documents) | 3% | S3/GCS for uploaded documents |
| Support engineering | 6% | Technical support team |
| **Total COGS** | **32%** | Improves to 16% at scale |

---

## 4. Five-Year Revenue Projections

| Metric | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|---|---|---|---|---|---|
| New Customers | 30 | 70 | 145 | 190 | 250 |
| Churned | 0 | 5 | 10 | 15 | 18 |
| Total Customers | 30 | 95 | 230 | 405 | 637 |
| Total Licensed Users | 8K | 28K | 75K | 140K | 230K |
| Avg Revenue/User/Mo | $25 | $30 | $31 | $32 | $33 |
| MRR | $200K | $850K | $2.3M | $4.5M | $7.7M |
| **ARR** | **$2.4M** | **$10.2M** | **$28M** | **$54M** | **$92M** |
| YoY Growth | - | 325% | 175% | 93% | 70% |
| Gross Margin | 68% | 74% | 79% | 82% | 84% |

---

## 5. Go-to-Market

### 5.1 Sales Motion
- **Phase 1 (Months 1-9):** Founder-led sales to design partners and early adopters
- **Phase 2 (Months 6-18):** Inside sales team for mid-market (30-45 day cycles)
- **Phase 3 (Months 12+):** Enterprise sales with solutions engineers (60-90 day cycles)
- **Channel:** Cloud marketplace (AWS/GCP), technology partners, consulting firms

### 5.2 Land & Expand
```
Month 1: 20 users (IT + HR department, Starter tier) = $300/month
Month 3: 100 users (expand to Sales + Engineering, upgrade to Pro) = $2,400/month
Month 6: 300 users (company-wide, mixed tiers) = $7,200/month
Month 12: 500 users (full deployment + Enterprise tier for execs) = $14,500/month = $174K ARR
```

---

## 6. Funding Requirements

### $20M Series A

| Use of Funds | Amount | % |
|---|---|---|
| Engineering (12 -> 35) | $7.2M | 36% |
| AI infrastructure (GPU compute) | $3.0M | 15% |
| Sales & marketing | $5.0M | 25% |
| Customer success | $2.0M | 10% |
| G&A + working capital | $2.8M | 14% |

**Runway:** 18 months to $10.2M ARR and Series B readiness.

---

*This document is confidential and intended for potential investors only.*
