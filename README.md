# ERP-Assistant

Sovereign ERP 2026 module frontend.

## Local Development

- Primary URL: http://localhost:5181
- Additional URLs: http://localhost:5173
- Auth policy: iam-only

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Architecture

- Next.js 16 App Router + TypeScript
- Shadcn UI primitives + Tailwind CSS v4
- Workik feature slices under `src/features/*`
- TanStack Query (`staleTime` 5 minutes)
- Realtime invalidation via Centrifugo topic:
  `${NEXT_PUBLIC_ENV}.${NEXT_PUBLIC_ORG}.${NEXT_PUBLIC_MODULE}.${tenant}.ui.invalidate`
- OIDC via ERP-IAM (Authentik) with optional fallback policy per module
