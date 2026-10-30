# CLAUDE.md

SPA del Servicio Técnico de Celulares (React 19 + Vite + TypeScript). Reglas de arquitectura, rutas y RBAC: [README.md](README.md) y la constitución `frontend.md` del repo [backPF](https://github.com/JulioOliva23/backPF/blob/main/ai-context/constitution/frontend.md).

Subagents live in `.claude/agents/` (validated in CI by `scripts/hooks/check-agents.sh`): `@agent-ui-feature`, `@agent-api-contract`, `@agent-qa-frontend`.

Claude Code hooks (`.claude/settings.json`):
- `PreToolUse` → `scripts/hooks/claude-guard.sh`: blocks reading/editing real `.env` files, destructive commands, `git push --force` and `git commit --no-verify`.
- `PostToolUse` → `scripts/hooks/claude-post-edit.sh`: after editing a file in `src/`, runs oxlint on it and its related Vitest tests; failures come back to you to fix.

AI agent proposals (AG-01, backend `mcp-server/README.md`): `features/agent-actions/`. `useAgentActionStream` is the frontend lifecycle hook: it reads the SSE stream with fetch (the token stays in memory, FE-16), lets callers veto events through `onEvent`, writes them into the React Query cache and invalidates work orders/stock once a proposal is executed. `AgentActionsLive` (mounted in `AppLayout`) opens one stream per session and toasts only people who can decide. `AgentApprovalModal` is the human-in-the-loop gate.

Never edit `src/shared/api/schema.gen.ts` by hand: regenerate it with `npm run gen:schema`.
