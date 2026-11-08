# AGENTS.md — Persistent instructions for OpenCode

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project

Nissa Homeopathic Clinic — AI Receptionist & Clinic Management System. A production-minded hackathon MVP built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase (later), and a controlled AI receptionist (later).

The user is a beginner developer. Explain technical decisions in plain language. Work incrementally, one milestone at a time. Do not start the next milestone without explicit approval.

## Read first

1. `docs/PROJECT_PLAN.md` — current milestone and acceptance checks.
2. `docs/ARCHITECTURE.md` — system boundaries and folder structure.
3. `docs/DATABASE_SCHEMA.md` — planned database (not implemented until Milestone 2).
4. `docs/DECISIONS.md` — why the project is built this way.
5. `src/config/clinic.ts` — the single source of clinic defaults.

## Non-negotiable rules

- Inspect existing code before modifying it. Preserve working code.
- Never invent clinic information: address, phone, email, doctor name, timezone, working weekdays, testimonials, or medical claims.
- Confirmed defaults live in `src/config/clinic.ts`. In Milestone 3 they move to `clinic_settings` in Supabase, which becomes the source of truth. Do not duplicate clinic values in pages/components.
- `appConfig.previewMode` is `true` only until the dashboard has real Supabase data. Any preview/sample data must be clearly labelled and live in `src/lib/preview-data.ts`.
- Never present a fake integration as working. Email, WhatsApp, AI, video calling and online booking must show "not connected" until they are actually configured and tested.
- Do not claim a booking is confirmed unless the backend has confirmed it.
- All booking validation and capacity enforcement must happen server-side/database-side. Never rely on frontend checks.
- Never expose service-role keys, AI keys, or other secrets to the client.
- The AI receptionist must never diagnose, prescribe, interpret reports, or access unrestricted clinical records.
- Only the doctor may create or modify clinical records and prescriptions.
- Use TypeScript properly. Do not disable lint/type checks to make a build pass.
- Handle loading, empty, success and error states.
- Keep components modular and reusable. Follow the existing naming and file structure.
- Update `docs/PROJECT_PLAN.md` after every milestone.

## Commands

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm run build
```

On Windows PowerShell, if `npm` is blocked by the execution policy, use `npm.cmd` (for example `npm.cmd run dev`).

## Structure

```
src/app/(public)/          Public website (route group)
src/app/dashboard/         Doctor dashboard
src/components/brand/      Logo
src/components/public/     Public site components
src/components/dashboard/  Dashboard shell and cards
src/components/ui/         shadcn/ui primitives
src/config/                Central clinic + app + navigation config
src/lib/                   Utilities and labelled preview data
docs/                      Project documentation
```

## Design system

- White/soft-neutral surfaces, deep evergreen primary, sage accents, warm sand highlights.
- Fraunces for display headings (`font-heading`), Geist for UI/body (`font-sans`).
- Rounded corners, subtle borders, `shadow-soft` / `shadow-lift`, generous spacing.
- Accessible focus states, semantic headings, labelled controls.
- Lucide icons only. No stock medical imagery, no fabricated testimonials, no unnecessary animation.

## Milestone discipline

- Milestone 1 is the foundation and UI shell only. Booking, Supabase, AI, notifications and real patient data are intentionally not implemented yet.
- Before marking a milestone complete: run lint, typecheck and production build; verify routes; update the plan; summarize files and test steps; list missing credentials/configuration.
- Stop after the milestone report and wait for approval.
