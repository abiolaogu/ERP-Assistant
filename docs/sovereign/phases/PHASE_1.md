# ERP-Assistant - Phase 1: Data and Cache Plane

Last updated: 2026-02-28

## Objectives

- Category: **Enterprise AI Assistant**
- North-star: Provide a trustworthy, context-rich assistant that can act across the full ERP estate.
- Benchmarks: Microsoft Copilot, Notion AI, Slack AI

## Expected Outcomes

- Tenant data access is enforced by default with RLS-compatible contracts.
- Cache keys are tenant-scoped and invalidation-aware.
- Data model hot paths have explicit indexing strategy.

## Implementation Steps

- Adopt `infra/sovereign/data/tenant-rls.sql` migration patterns.
- Apply Dragonfly key namespace: `tenant:{tenant_id}:...`.
- Track read/write SLO budgets for critical domain entities.

## AIDD Guardrail Alignment

- Autonomous: low-risk, high-confidence operations only.
- Supervised: approvals required for high-value or broad-impact operations.
- Protected: cross-tenant, privilege-escalation, and destructive unsafe actions are blocked.

## Domain Event Focus

- Contract and test flow for `assistant.runs`
- Contract and test flow for `assistant.approvals`
- Contract and test flow for `assistant.events`
