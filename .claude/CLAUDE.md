# Project Instructions for Claude

## Review Workflow

**Pause after each file**: After creating or significantly editing a file, STOP and prompt me to review
before moving to the next file. Don't batch-create multiple files without review.

I'll use these markers:
- `[Q: ...]` - question
- `[C: ...]` - comment/feedback
- `[TODO: ...]` - something to add

When I say "check my comments", scan the file for these markers:
- Make straightforward changes immediately
- Discuss anything non-obvious before changing

When I say "looks good" or "done", proceed to the next file.

## Preferences

- Don't edit files unless I tell you to - I like to discuss first and agree on a plan
- Use `uv` for all Python operations: `uv run script.py`, `uv pip install`, `uv sync`, etc.

## Project Guidelines

- **Roadmap**: Feature roadmap lives at `.specify/roadmap.md`. Check it when ready for next steps.
- **Spec-first**: Before implementing any feature, ensure a spec exists. If unclear, write/update the  
  spec first.     