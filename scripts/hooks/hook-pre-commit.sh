#!/usr/bin/env bash
# Pre-commit validation hook (GEN-12 DoD), mirror of backPF's hook.
# Blocks the commit on lint errors, type errors or failing tests when any
# source file is staged. Also refuses staged secrets (.env files).
#
# Install: npm install (prepare → git config core.hooksPath .githooks)
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
step()  { printf '\033[36m▶ %s\033[0m\n' "$*"; }

# In CI there is no index: HOOK_BASE_REF makes the hook check the files
# changed between that ref and HEAD instead of the staged ones ("ALL" = every file).
if [ "${HOOK_BASE_REF:-}" = "ALL" ]; then
  STAGED="$(git ls-files)"
elif [ -n "${HOOK_BASE_REF:-}" ]; then
  STAGED="$(git diff --name-only --diff-filter=ACMR "$HOOK_BASE_REF"...HEAD)"
else
  STAGED="$(git diff --cached --name-only --diff-filter=ACMR)"
fi
[ -z "$STAGED" ] && exit 0

# GEN-11: never commit real environment files.
if printf '%s\n' "$STAGED" | grep -E '(^|/)\.env(\..+)?$' | grep -vE '\.env\.example$' >/dev/null; then
  red "✖ Staged .env file detected. Unstage it (GEN-11)."
  exit 1
fi

# SDD (constitution C2.3 / C4.1): every requirement and acceptance criterion of an
# implemented spec keeps a tagged test. Runs only when a spec or a test changes.
if grep -qE '^(specs/|src/.*\.test\.tsx?$)' <<<"$STAGED"; then
  step "SDD → spec to test traceability"
  if ! node scripts/sdd/check-traceability.mjs src; then
    red "✖ Commit blocked: a requirement has no tagged test, or a test cites a missing requirement (C2.3)."
    exit 1
  fi
fi

SOURCES='^(src/|public/|index\.html$|package(-lock)?\.json$|tsconfig.*\.json$|vite\.config\.ts$|vitest\.config\.ts$|\.oxlintrc\.json$)'
if ! grep -qE "$SOURCES" <<<"$STAGED"; then
  green "✔ No sources staged, skipping checks."
  exit 0
fi

FAILED=0
for script in lint typecheck test; do
  step "npm run $script"
  if ! npm run --silent "$script"; then
    red "✖ '$script' failed"
    FAILED=1
  fi
done

if [ "$FAILED" -ne 0 ]; then
  red "✖ Commit blocked: fix the errors above (GEN-12)."
  exit 1
fi
green "✔ Lint, types and tests passed."
