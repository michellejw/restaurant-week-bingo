# Restaurant Week Bingo

AI-first seasonal operations for a Next.js app (Clerk + Supabase + Vercel).

## Start Here (Fully Guided)

If you want a guided, one-step-at-a-time AI experience, start here and skip the rest for now.

### OpenCode

Run:

- `/new-season-quickstart` for season setup
- `/close-season` for season closeout

Wrapper files (repo):

- `.opencode/commands/new-season-quickstart.md`
- `.opencode/commands/close-season.md`

### Claude

Run:

- `/new-season-quickstart` for season setup
- `/close-season` for season closeout

These commands will guide you through everything, including safety checks and required outputs.

### Not Using OpenCode Or Claude?

Paste this into your AI to get a fully guided setup in your harness:

```text
You are my Restaurant Week Bingo operations assistant.

First, research whether this harness supports slash/custom commands and how to define them.
If slash/custom commands are supported, create thin wrappers named:
- /new-season-quickstart
- /close-season

Wrappers must load and follow exactly:
1) ops/environment-map.md
2) ops/playbooks/start-season.yaml (or close-season.yaml)
3) ops/ai/new-season-assistant.md (or close-season-assistant.md)

Rules:
- one step at a time
- require command output before moving on
- enforce hard-stop safety checks
- do not duplicate business logic inside wrappers

If slash/custom commands are NOT supported, run this workflow directly by loading the same files and guiding me step-by-step.
```

Fallback commands (works in any harness):

```bash
npm run ai:new-season-guide
npm run ai:close-season-guide
```

Then paste that guidance into your AI and follow it exactly.

---

## AI Guidance Reference

Use this section only if you need to inspect or customize the guidance.

### Universal (Works In Any Harness)

These commands print the canonical guidance from repo files:

```bash
npm run season:start-checklist
npm run season:close-checklist
npm run ai:new-season-guide
npm run ai:close-season-guide
```

Canonical sources:

- `ops/environment-map.md`
- `ops/playbooks/start-season.yaml`
- `ops/playbooks/close-season.yaml`
- `ops/ai/new-season-assistant.md`
- `ops/ai/close-season-assistant.md`

### Claude Slash Commands (Already Included)

- `/new-season-quickstart`
- `/close-season`

Files:

- `.claude/commands/new-season-quickstart.md`
- `.claude/commands/close-season.md`

### OpenCode Commands

OpenCode wrappers are included:

- `.opencode/commands/new-season-quickstart.md`
- `.opencode/commands/close-season.md`

If your OpenCode build uses a different command format, use canonical files directly:

```text
Use ops/environment-map.md, ops/playbooks/start-season.yaml, and
ops/ai/new-season-assistant.md.
Guide me one step at a time. Ask for command output before moving on.
Enforce hard-stop safety checks.
```

For closeout:

```text
Use ops/environment-map.md, ops/playbooks/close-season.yaml, and
ops/ai/close-season-assistant.md.
Guide me one step at a time. Ask for output before moving on.
```

## Thin Wrapper Strategy (Future-Proof)

Keep business logic in `ops/*`. Wrappers should only load those files.

- Good wrapper: references canonical playbooks and execution rules
- Bad wrapper: duplicates setup steps, secrets flow, or environment mapping

If wrappers are missing, ask your AI to generate them for the current harness format.

### Wrapper Builder Prompt (Copy/Paste)

```text
First, research whether this harness supports slash/custom commands and how command files are defined.

If supported, create a thin command wrapper for this harness named /new-season-quickstart.
Wrapper must load and follow exactly:
1) ops/environment-map.md
2) ops/playbooks/start-season.yaml
3) ops/ai/new-season-assistant.md

Rules:
- one step at a time
- require command output before next step
- enforce hard stops from assistant file
- do not embed business logic in wrapper

Also create /close-season wrapper using:
1) ops/environment-map.md
2) ops/playbooks/close-season.yaml
3) ops/ai/close-season-assistant.md

If slash/custom commands are not supported, provide a direct prompt-based workaround that uses the same three files and step-by-step execution rules.
```

## Environment Mapping (Do Not Skip)

See `ops/environment-map.md` for the authoritative mapping of:

- local vs dev vs prod
- git branch (`dev`/`main`)
- Vercel target
- Supabase project ref
- Clerk key type (`test` vs `live`)

If any layer is mismatched, stop and fix it before continuing.

## Seasonal Operations

### Start Season

Primary flow is defined in `ops/playbooks/start-season.yaml`.

High-level sequence:

1. Preflight + security/build checks
2. Verify Sentry configuration for target environment
3. Update season config and logo
4. Apply migrations
5. Backup production
6. Archive prior season + reset active gameplay
7. Import restaurants
8. Validate on dev preview
9. Deploy to production, smoke test, and check Sentry for new critical issues

### Close Season

Primary flow is defined in `ops/playbooks/close-season.yaml`.

High-level sequence:

1. Confirm season ended
2. Draw raffle winners
3. Backup production
4. Generate and share summary artifacts

## Operational Commands

```bash
# app health
npm run lint
npm run build
npm audit --omit=dev

# data operations
npm run backup
npm run backup:prod
npm run season:rollover
npm run restaurant:import
npm run sponsor:import
```

## Project Basics (Non-AI)

```bash
git clone https://github.com/michellejw/restaurant-week-bingo.git
cd restaurant-week-bingo
npm install
# configure env files (see docs/ENVIRONMENT_SETUP.md)
npm run dev
```

Open `http://localhost:3000`.

## Key Docs

- `docs/ENVIRONMENT_SETUP.md`
- `docs/OPERATIONS.md`
- `docs/ROADMAP.md`

## Stack

- Next.js 15 + React 19 + TypeScript
- Supabase Postgres
- Clerk authentication
- Vercel deployment
- Sentry monitoring

## Sentry Checks (Required For Launch)

- Confirm Sentry env vars are set correctly in Vercel for dev/prod.
- After production deploy + smoke test, check Sentry for new untriaged critical errors.
- Keep sample/example error routes disabled in production.

## Notes

- Canonical schema history: `supabase/migrations/`
- Raffle rule source of truth: `config/game-rules.json`
- Season runtime config: `src/config/restaurant-week.ts`
