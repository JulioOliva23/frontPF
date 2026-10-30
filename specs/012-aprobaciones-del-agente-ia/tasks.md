# Tareas 012 · Aprobaciones del agente IA en vivo

Leyenda: `[x]` hecha · `[~]` parcial · `[ ]` pendiente.

- [x] **T1 · Tipos y cliente de la API desde el Swagger del backend** — RF-2, RF-3
  Hecho cuando: `schema.gen.ts` incluye `/agent-actions` y `npm run typecheck` pasa.
- [x] **T2 · Parser SSE y espera de reconexión** — RF-1.4, RF-1.5
  Hecho cuando: pasan los tests de `sse` etiquetados `[012/RF-1.5]` y `[012/RF-1.4]`.
- [x] **T3 · Hook de streaming con interceptor** — RF-1.1 a RF-1.4
  Hecho cuando: pasan los tres tests de `use-agent-action-stream`.
- [x] **T4 · Reglas de decisión de la interfaz** — RF-2
  Hecho cuando: pasan "only offers approval to a role the state machine accepts" y "never lets the proposing account decide".
- [x] **T5 · Modal de aprobación con confirmación** — RF-3.1, RF-3.2
  Hecho cuando: pasan "approves only after the person confirms…" y "requires typing the order number…".
- [x] **T6 · Página, error de ejecución y estado vacío** — RF-3.3, RF-3.4
  Hecho cuando: pasan "shows why the execution failed…" y "says when nothing is waiting".
- [x] **T7 · Menú, contador y avisos** — RF-4.1, RNF-3
  Hecho cuando: el técnico ve `/aprobaciones` en `navigation.test` y `AgentActionsLive` monta un solo stream en `AppLayout`.
- [ ] **T8 · Test del aviso emergente solo para quien decide** — RNF-3
  Hecho cuando: un test de `AgentActionsLive` comprueba que recepción no recibe aviso por un inicio de reparación.
