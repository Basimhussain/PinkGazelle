# Pink Gazelle — Task & Phase Plan

## Protocol 0: Initialization (Mandatory)
- [x] Create project memory (`task_plan.md`, `findings.md`, `progress.md`, `system_constitution.md`)
- [x] Define data schema and architectural rules
- [x] Answer 5 Discovery Questions

## Phase 1: Blueprint (Vision & Logic)
- [ ] Research Supabase RLS multi-tenant client isolation
- [ ] Research Auth invite flow with custom token
- [ ] Research Realtime subscription patterns
- [ ] Research React + Zustand hydration
- [ ] Research Resend Vite edge function pattern
- [ ] Update `findings.md` with research results

## Phase 2: Link (Connectivity)
- [ ] Scaffold `tools/` directory
- [ ] Write and run `test_supabase_connection.ts`
- [ ] Write and run `test_supabase_auth.ts`
- [ ] Write and run `test_resend.ts`
- [ ] Write and run `test_supabase_realtime.ts`
- [ ] Complete Handshake: Ensure all external APIs reachable from local environment

## Phase 3: Architect (The 3-Layer Build)
- [ ] Layer 1: Architecture (Write all SOP markdown files)
  - `auth-flow.md`, `rls-policies.md`, `invite-flow.md`, `ticket-lifecycle.md`, `comment-system.md`, `realtime-feed.md`, `progress-calc.md`, `client-isolation.md`
- [ ] Layer 3: Tools (Create deterministic TypeScript modules)
  - `src/lib/*` and `supabase/functions/*`
- [ ] Layer 2: Navigation (Integrate Decision Logic into React components & Stores)
- [ ] Build UI base structure

## Phase 4: Stylize (Refinement & UI)
- [ ] Index CSS & Design System integration
- [ ] Shared Components (`Toast.tsx`, `Badge.tsx`, etc.)
- [ ] Admin Interface (CRUD functionality)
- [ ] Client Interface (Read-Only + Comments)
- [ ] Component Testing against Payload Shapes

## Phase 5: Trigger (Deployment)
- [ ] Zero-error TypeScript checks
- [ ] Connect Vercel & Deploy frontend
- [ ] Configure Supabase production domains & Edge secrets
- [ ] Update `system_constitution.md` with final production URLs
- [ ] Document final state and admin guide
