# ERP-Assistant - Phase 0: Foundation and Tooling

Last updated: 2026-02-28

## Objectives

- Category: **Enterprise AI Assistant**
- North-star: Provide a trustworthy, context-rich assistant that can act across the full ERP estate.
- Benchmarks: Microsoft Copilot, Notion AI, Slack AI

## Expected Outcomes

- Repository baseline, env contracts, and dependency hygiene are deterministic.
- AIDD guardrail policy is versioned and audited.
- CI has baseline lint, test, build, and policy checks.

## Implementation Steps

- Standardize `.env.example` and secrets source mapping.
- Lock entrypoint telemetry and tenant/request correlation IDs.
- Validate generated guardrail and release-gate artifacts.

## AIDD Guardrail Alignment

- Autonomous: low-risk, high-confidence operations only.
- Supervised: approvals required for high-value or broad-impact operations.
- Protected: cross-tenant, privilege-escalation, and destructive unsafe actions are blocked.

## Domain Event Focus

- Contract and test flow for `assistant.runs`
- Contract and test flow for `assistant.approvals`
- Contract and test flow for `assistant.events`
