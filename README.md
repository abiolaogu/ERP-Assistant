# ERP-Assistant

Personal AI assistant module for the ERP suite.

Includes connector scaffolds for internal ERP modules and external tools (Google Workspace, Microsoft 365, Notion, Slack, Jira, Trello, Asana, WhatsApp, Telegram, and storage providers).


<!-- SOVEREIGN_NEXT16_STANDARD_2026_03 -->

## Sovereign 2026 Frontend Standard

- Canonical frontend path: apps/sovereign-next16
- Frontend architecture: Next.js 16 App Router + Shadcn UI + Tailwind v4
- Service pattern: Workik-style features/*/services + TanStack Query hooks
- Realtime contract: Centrifugo subscriptions backed by Redpanda topics
- Shared API/data contract: Cosmo Router + Hasura + YugabyteDB

### Cutover Policy

- Treat legacy UI paths (web, apps/web, frontend) as transitional until parity cutover is fully signed off.
- New feature work should target apps/sovereign-next16 by default.
- Do not add new Refine/Ant Design dependencies in new surfaces.
