# Sovereign Assistant -- Financial Model

**Confidential | 5-Year Projections | March 2026**

---

## 1. Revenue Model

### 1.1 Pricing Assumptions

| Tier | Price/User/Month | Mix (2026) | Mix (2030) |
|---|---|---|---|
| Starter | $5 | 20% | 5% |
| Professional | $12 | 50% | 35% |
| Enterprise | $20 | 30% | 60% |
| **Blended ARPU** | **$12.70** | -- | **$16.85** |

### 1.2 Customer and User Assumptions

| Metric | 2026 | 2027 | 2028 | 2029 | 2030 |
|---|---|---|---|---|---|
| New Customers | 9 | 23 | 50 | 95 | 180 |
| Churned Customers | 0 | 0 | 1 | 3 | 6 |
| Ending Customers | 12 | 35 | 84 | 176 | 350 |
| Avg Users/Customer | 400 | 629 | 810 | 938 | 1,000 |
| Total Users | 4,800 | 22,000 | 68,000 | 165,000 | 350,000 |
| NRR | 148% | 142% | 138% | 135% | 132% |

## 2. Five-Year Income Statement

| Line Item | 2026 | 2027 | 2028 | 2029 | 2030 |
|---|---|---|---|---|---|
| **Revenue** | | | | | |
| Subscription Revenue | $1,080K | $5,220K | $16,650K | $43,200K | $85,500K |
| Query Overage | $72K | $348K | $1,110K | $2,880K | $5,700K |
| Professional Services | $48K | $232K | $740K | $1,920K | $3,800K |
| **Total Revenue** | **$1,200K** | **$5,800K** | **$18,500K** | **$48,000K** | **$95,000K** |
| YoY Growth | 380% | 383% | 219% | 159% | 98% |
| | | | | | |
| **COGS** | | | | | |
| LLM Inference (API costs) | $144K | $580K | $1,480K | $3,360K | $5,700K |
| Cloud Infrastructure | $72K | $290K | $740K | $1,680K | $2,850K |
| Vector DB / Search | $24K | $116K | $370K | $960K | $1,900K |
| Customer Support | $60K | $232K | $740K | $1,920K | $3,800K |
| **Total COGS** | **$300K** | **$1,218K** | **$3,330K** | **$7,920K** | **$14,250K** |
| **Gross Profit** | **$900K** | **$4,582K** | **$15,170K** | **$40,080K** | **$80,750K** |
| **Gross Margin** | **75.0%** | **79.0%** | **82.0%** | **83.5%** | **85.0%** |
| | | | | | |
| **Operating Expenses** | | | | | |
| R&D | $3,120K | $5,220K | $7,770K | $10,560K | $14,250K |
| Sales & Marketing | $1,200K | $3,190K | $7,030K | $13,440K | $21,850K |
| G&A | $780K | $1,276K | $2,220K | $3,840K | $6,175K |
| **Total OpEx** | **$5,100K** | **$9,686K** | **$17,020K** | **$27,840K** | **$42,275K** |
| | | | | | |
| **EBITDA** | **($4,200K)** | **($5,104K)** | **($1,850K)** | **$12,240K** | **$38,475K** |
| **EBITDA Margin** | **-350%** | **-88%** | **-10%** | **25.5%** | **40.5%** |

## 3. Cash Flow

| Line Item | 2026 | 2027 | 2028 | 2029 | 2030 |
|---|---|---|---|---|---|
| EBITDA | ($4,200K) | ($5,104K) | ($1,850K) | $12,240K | $38,475K |
| Stock-Based Comp | $240K | $580K | $925K | $1,440K | $1,900K |
| Change in Working Capital | $90K | $435K | $1,388K | $3,600K | $7,125K |
| CapEx | ($180K) | ($290K) | ($555K) | ($960K) | ($1,425K) |
| **Free Cash Flow** | **($4,050K)** | **($4,379K)** | **($92K)** | **$16,320K** | **$46,075K** |
| | | | | | |
| Beginning Cash | $2,400K | $18,350K | $13,971K | $13,879K | $30,199K |
| Series A Proceeds | $20,000K | $0 | $0 | $0 | $0 |
| **Ending Cash** | **$18,350K** | **$13,971K** | **$13,879K** | **$30,199K** | **$76,274K** |

## 4. Unit Economics

| Metric | 2026 | 2027 | 2028 | 2029 | 2030 |
|---|---|---|---|---|---|
| ACV | $100K | $166K | $220K | $267K | $271K |
| Gross Margin | 75% | 79% | 82% | 83.5% | 85% |
| CAC | $32K | $36K | $38K | $40K | $42K |
| CAC Payback (months) | 4.6 | 3.3 | 2.6 | 2.2 | 2.3 |
| LTV (5-year) | $520K | $780K | $1,050K | $1,280K | $1,310K |
| LTV:CAC | 16.3x | 21.7x | 27.6x | 32.0x | 31.2x |
| Revenue per Employee | $37K | $72K | $148K | $282K | $422K |

### 4.1 Per-Query Economics

| Metric | 2026 | 2028 | 2030 |
|---|---|---|---|
| Queries per day | 18,000 | 180,000 | 1,200,000 |
| Blended cost per query | $0.018 | $0.012 | $0.008 |
| Revenue per query | $0.015 | $0.019 | $0.014 |
| Model routing savings | 35% | 50% | 60% |

**Cost optimization:** Model routing (simple queries to Haiku, complex to Sonnet) reduces inference cost by 35% in 2026, improving to 60% by 2030 through continued model optimization and caching.

## 5. Headcount Plan

| Function | 2026 | 2027 | 2028 | 2029 | 2030 |
|---|---|---|---|---|---|
| Engineering | 20 | 32 | 44 | 56 | 68 |
| AI/ML Research | 4 | 7 | 10 | 13 | 16 |
| Product | 2 | 4 | 6 | 8 | 10 |
| Sales | 3 | 12 | 22 | 36 | 52 |
| Marketing | 1 | 4 | 7 | 12 | 18 |
| Customer Success | 1 | 5 | 10 | 18 | 28 |
| G&A | 3 | 6 | 10 | 15 | 20 |
| Executive | 3 | 4 | 5 | 6 | 7 |
| **Total** | **37** | **74** | **114** | **164** | **219** |

## 6. Sensitivity Analysis

### 6.1 Revenue Scenarios (2028)

| Scenario | New Customers | NRR | 2028 ARR | vs. Base |
|---|---|---|---|---|
| Bear | 35 (-30%) | 125% | $11.1M | -40% |
| Base | 50 | 138% | $18.5M | -- |
| Bull | 65 (+30%) | 148% | $27.8M | +50% |

### 6.2 LLM Cost Sensitivity

| Scenario | Cost/Query | 2028 Gross Margin | Impact |
|---|---|---|---|
| Costs increase 50% | $0.018 | 78% | -4pp margin |
| Base case | $0.012 | 82% | -- |
| Costs decrease 30% | $0.008 | 85% | +3pp margin |
| Self-hosted models | $0.005 | 88% | +6pp margin |

### 6.3 Valuation Sensitivity (Series B, 2028)

| ARR \ Multiple | 15x | 20x | 25x | 30x |
|---|---|---|---|---|
| $11.1M (Bear) | $167M | $222M | $278M | $333M |
| $18.5M (Base) | $278M | $370M | $463M | $555M |
| $27.8M (Bull) | $417M | $556M | $695M | $834M |

## 7. Key Assumptions

- LLM API costs decline 20% annually (consistent with historical trends)
- Per-user pricing increases 3% annually (inflation adjustment)
- NRR gradually declines from 148% to 132% as customer base matures
- Gross margin improves through model routing optimization and inference caching
- Sales productivity reaches full ramp at 6 months
- No revenue from APAC until 2029

---

*Confidential. Sovereign Assistant, Inc. All rights reserved.*
