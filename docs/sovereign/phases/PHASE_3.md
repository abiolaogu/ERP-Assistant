# ERP-Assistant - Phase 3: Category-King UX and Product Intelligence

Last updated: 2026-02-28

## Objectives

- Category: **Enterprise AI Assistant**
- North-star: Provide a trustworthy, context-rich assistant that can act across the full ERP estate.
- Benchmarks: Microsoft Copilot, Notion AI, Slack AI

## Expected Outcomes

- Sovereign command-surface UX is active with explicit operating modes.
- High-impact workflows expose confidence, approvals, and blast-radius hints.
- User friction telemetry is captured for top journeys.

## Implementation Steps

- Adopt web shell guardrail affordances and mode labels.
- Gate risky operations via AIDD policy decisions.
- Instrument completion-time and drop-off metrics for critical tasks.

## AIDD Guardrail Alignment

- Autonomous: low-risk, high-confidence operations only.
- Supervised: approvals required for high-value or broad-impact operations.
- Protected: cross-tenant, privilege-escalation, and destructive unsafe actions are blocked.

## Domain Event Focus

- Contract and test flow for `assistant.runs`
- Contract and test flow for `assistant.approvals`
- Contract and test flow for `assistant.events`
