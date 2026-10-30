# Plan 012 · Aprobaciones del agente IA en vivo

Cumple la [constitución](../../docs/constitution.md) (C3 capas por feature, FE-16 token en memoria). Cubre RF-1 a RF-4 de [spec.md](spec.md). Contrato del servidor: spec 011 de backPF y `mcp-server/README.md`.

## 1. Estructura de módulos

| Archivo (`src/features/agent-actions`) | Responsabilidad | RF |
| --- | --- | --- |
| `api/agent-actions-api.ts` | Listar, aprobar y rechazar | RF-2, RF-3 |
| `lib/sse.ts` | `parseSseChunk` (fragmentos, multilínea, comentarios) y `reconnectDelay` | RF-1.4, RF-1.5 |
| `lib/agent-action-rules.ts` | `canApprove`, `canReject`, `requiresTypedConfirmation`, `minutesLeft`, `upsertAction` | RF-2, RF-3.2 |
| `hooks/use-agent-action-stream.ts` | Hook de ciclo de vida: lee el stream, valida, deja vetar (`onEvent`), escribe en la caché, invalida OTs y stock, reconecta, renueva sesión ante 401 | RF-1 |
| `hooks/use-agent-actions.ts` | Consultas y mutaciones de React Query | RF-2, RF-3 |
| `components/AgentActionsLive.tsx` | Un stream por sesión (en `AppLayout`) y avisos solo a quien puede decidir | RNF-3 |
| `components/AgentApprovalModal.tsx` | Casilla "revisé la orden" y número de OT para destinos irreversibles | RF-3.1, RF-3.2 |
| `pages/AgentApprovalsPage.tsx` | Lista con botones según el rol, error de ejecución, estado vacío | RF-2, RF-3 |
| `app/navigation.tsx` · `app/nav-badge.tsx` | Ítem "Aprobaciones IA" con contador | RF-4.1 |

## 2. Modelo de datos

```json
{
  "evento SSE": { "event": "created | updated | ping", "data": "AgentAction (sin technicianId)" },
  "caché": { "agentActions.list('PENDING')": ["AgentAction, más nueva primero"] },
  "estado del stream": "connecting | live | offline"
}
```

## 3. Algoritmos

```text
stream():                                                        # RF-1
  loop:
    res = fetch('/agent-actions/stream', Authorization: Bearer <token en memoria>)
    if res.status = 401: refreshAuthSession() ; continue
    if !res.ok: status = offline ; sleep(reconnectDelay(intento)) ; continue   # 1 s, 2 s, 4 s … máx. 30 s
    for frame in parseSseChunk(texto acumulado):                 # RF-1.5
      action = validar(frame.data) ; if inválido: skip           # RF-1.3
      if onEvent(frame) === false: skip                          # veto del interceptor
      cache[PENDING] = action.status = PENDING ? upsert(action) : quitar(action)
      if action.status = EXECUTED: invalidar(workOrders) ; si action.to mueve stock: invalidar(spareParts)   # RF-1.2

canApprove(action, user) = user.id ≠ action.requestedBy.id ∧ user.role ∈ action.approverRoles   # RF-2
requiresTypedConfirmation(to) = to ∈ {CANCELLED, DELIVERED}                                     # RF-3.2
```

## 4. Contrato de uso

| Pantalla / pieza | Ruta | Roles |
| --- | --- | --- |
| Aprobaciones IA | `/aprobaciones` | Staff (Admin, Recepción, Técnico) |
| Contador del menú | ítem "Aprobaciones IA" | Staff |

## 5. Decisiones técnicas

| Decisión | Justificación | Alternativa descartada |
| --- | --- | --- |
| `fetch` + `ReadableStream` | El token sigue solo en memoria (FE-16) | `EventSource`: no admite cabeceras, el token iría en la URL |
| Escribir los eventos en la caché de React Query | Página, contador y avisos leen lo mismo sin otra conexión (RNF-3) | Estado propio por componente |
| Interceptor `onEvent` con veto | La pantalla puede filtrar eventos sin tocar el hook | Lógica de filtrado dentro del hook |
| Confirmación escrita solo en irreversibles | Fricción donde importa; el resto sigue siendo ágil | Escribir el número siempre |

## 6. Estrategia de tests

| Nivel | Tests | RF |
| --- | --- | --- |
| `lib/agent-actions-lib.test.ts` | fragmentos y multilínea · espera exponencial · aprobar según el rol · cuenta que propone · confirmación escrita · minutos y orden | RF-1.4, RF-1.5, RF-2, RF-3.2 |
| `hooks/use-agent-action-stream.test.tsx` (MSW) | caché e invalidación · veto y payload malformado · sin conexión | RF-1.1 a RF-1.4 |
| `pages/AgentApprovalsPage.test.tsx` | revisión obligatoria · número de OT · error de ejecución · decisiones por rol · lista vacía | RF-2.1, RF-3 |
| `app/navigation.test.ts` | el técnico ve "Aprobaciones IA" | RF-4.1 |
