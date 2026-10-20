#!/usr/bin/env bash
# Claude Code PostToolUse hook (.claude/settings.json).
# After Claude edits a source file under src/, lints that file with oxlint and
# runs the Vitest tests related to it. On failure, exit code 2 sends the errors
# back to Claude so it fixes them right away (GEN-12).
set -euo pipefail

INPUT="$(cat)"
FILE="$(node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d);process.stdout.write(j.tool_input?.file_path??"");});' <<<"$INPUT")"

ROOT="$(git rev-parse --show-toplevel)"

case "$FILE" in
  "$ROOT"/src/shared/api/schema.gen.ts) exit 0 ;;
  "$ROOT"/src/*.ts|"$ROOT"/src/*.tsx) ;;
  *) exit 0 ;;
esac
[ -f "$FILE" ] || exit 0
[ -d "$ROOT/node_modules" ] || exit 0

cd "$ROOT"
REL="${FILE#"$ROOT"/}"

if ! OUT="$(npx oxlint "$REL" 2>&1)"; then
  echo "✖ oxlint falló en $REL:" >&2
  echo "$OUT" >&2
  exit 2
fi

if ! OUT="$(npx vitest related "$REL" --run --passWithNoTests 2>&1)"; then
  echo "✖ Tests relacionados con $REL fallaron:" >&2
  echo "$OUT" | sed 's/\x1b\[[0-9;]*m//g' | tail -40 >&2
  exit 2
fi

exit 0
