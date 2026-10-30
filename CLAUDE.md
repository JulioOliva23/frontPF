# CLAUDE.md

SPA del Servicio Técnico de Celulares (React 19 + Vite + TypeScript). Reglas de arquitectura, rutas y RBAC: [README.md](README.md) y la constitución `frontend.md` del repo [backPF](https://github.com/JulioOliva23/backPF/blob/main/ai-context/constitution/frontend.md).

Subagents live in `.claude/agents/` (validated in CI by `scripts/hooks/check-agents.sh`): `@agent-ui-feature`, `@agent-api-contract`, `@agent-qa-frontend`.

Claude Code hooks (`.claude/settings.json`):
- `PreToolUse` → `scripts/hooks/claude-guard.sh`: blocks reading/editing real `.env` files, destructive commands, `git push --force` and `git commit --no-verify`.
- `PostToolUse` → `scripts/hooks/claude-post-edit.sh`: after editing a file in `src/`, runs oxlint on it and its related Vitest tests; failures come back to you to fix.

AI agent proposals (AG-01, backend `mcp-server/README.md`): `features/agent-actions/`. `useAgentActionStream` is the frontend lifecycle hook: it reads the SSE stream with fetch (the token stays in memory, FE-16), lets callers veto events through `onEvent`, writes them into the React Query cache and invalidates work orders/stock once a proposal is executed. `AgentActionsLive` (mounted in `AppLayout`) opens one stream per session and toasts only people who can decide. `AgentApprovalModal` is the human-in-the-loop gate.

Never edit `src/shared/api/schema.gen.ts` by hand: regenerate it with `npm run gen:schema`.

## Spec-Driven Development (obligatorio)

Constitution: `docs/constitution.md`. Specs: `specs/NNN-nombre/{spec,plan,tasks}.md`. Index and verification report: `specs/README.md`, `specs/verificacion.md`. Server behaviour is specified in [backPF/specs](https://github.com/JulioOliva23/backPF/tree/main/specs) and wins on business rules.

1. **Spec first.** Before changing behavior, read the spec. If the change is not covered, edit `spec.md` first (a numbered `RF-x` with EARS acceptance criteria). When the spec and the code disagree, the spec wins (C2.2); doubts stay as `[NECESITA ACLARACIÓN]`.
2. **Test second, code third.** Write the failing test, then the code. Every test title carries the requirement it proves, e.g. `it('rejects … [001/RF-5.4]')`. A requirement or acceptance criterion without a tagged test fails `npm run sdd:check` (pre-commit and the `sdd` CI job).
3. **Design rules are tests** (`src/test/design-rules.test.ts`): no `lime-` colours, controls of at least 44 px, no hard-coded hex colours in screens, dark header and print rules. Do not weaken them to make a change pass.
4. **Tasks with evidence.** Mark `[x]` in `tasks.md` only when the "Hecho cuando" line is verifiably true.
5. Everything a person reads is in Spanish (C6.2); the refresh token never goes to `localStorage` (C5.2).
