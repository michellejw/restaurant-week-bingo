# Assistant Memory

## User Profile
- Experience with project: yes (built it)
- Code comfort: very
- Name: Michelle
- Notes: Project owner. Direct, no hand-holding needed.

## Session Log
### 2026-03-26
- Completed:
  - Added check-in cutoff note (6am Sunday) to close-season playbook and config
  - Rewrote raffle-draw.js with interactive exclude/redraw flow
  - Drew raffle winner: Allie Galati (a.galati26@gmail.com)
  - Excluded Alma (Michelle's daughter) from draw
- Notes: Spring 2026 season just finished, went well

## Next Season Notes
- Require a name at sign-in/sign-up for all users (3 "Unknown" users in Spring 2026 raffle pool)
- Close check-ins at 6am Sunday morning after last day, not midnight (late-night bar check-ins)

## ⚠️ Infrastructure status (as of 2026-05-11)
- Both Supabase projects (dev + prod) transferred to a new free org and **paused** to free up slots while pi-local-sunshine builds out its own dev env.
- Free tier keeps paused projects for **90 days** — earliest deletion window ~**2026-08-09**.
- **Before next season:** check Supabase dashboard. If projects still exist, unpause. If gone, follow `ops/RESTORE-FROM-PAUSED.md` to rebuild from migrations + data dump. Everything needed is in the repo (Clerk handles auth, no Storage to restore).
- When user mentions "next season", "Supabase", "database missing/paused", or starts the season playbook → surface `ops/RESTORE-FROM-PAUSED.md` first.
