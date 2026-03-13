#!/usr/bin/env bash
set -euo pipefail

# Push pending migrations to both dev and prod Supabase databases,
# then dump a fresh schema snapshot.

DEV_REF="lhynosiqalkouyotibwt"
PROD_REF="ncezsildjpkioofgsmkj"

echo "=== Checking pending migrations ==="
supabase link --project-ref "$DEV_REF"
supabase migration list

read -p "Push pending migrations to BOTH dev and prod? (y/N) " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "=== Pushing to DEV ($DEV_REF) ==="
supabase db push

echo ""
echo "=== Pushing to PROD ($PROD_REF) ==="
supabase link --project-ref "$PROD_REF"
supabase db push

echo ""
echo "=== Re-linking to DEV ==="
supabase link --project-ref "$DEV_REF"

echo ""
echo "=== Dumping fresh schema snapshot ==="
supabase db dump -s public -f supabase/schema.sql

echo ""
echo "Done. Remember to commit supabase/schema.sql alongside your migration."
