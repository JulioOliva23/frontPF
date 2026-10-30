# Plan 004 · Detalle de la orden de trabajo

Cumple la [constitución](../../docs/constitution.md) (C3.4 el servidor decide, C5.3 código de desbloqueo, C7.1 estados). Cubre RF-1 a RF-11 de [spec.md](spec.md).

## 1. Estructura de módulos

| Archivo (`src/features/work-orders`) | Responsabilidad | RF |
| --- | --- | --- |
| `pages/WorkOrderDetailPage.tsx` | Compone la pantalla; decide qué paneles ve cada rol | RF-1, RF-7.3, RF-11 |
| `lib/visible-transitions.ts` | Función pura: quita BUDGETED/APPROVED y la cancelación en BUDGETED | RF-2.2, RF-2.3 |
| `components/TransitionActions.tsx` | Botones de transición, diálogo de cancelación, avisos | RF-2, RF-3, RF-4, RF-5 |
| `components/StockGuardBanner.tsx` | Nombra los repuestos faltantes | RF-3.1 |
| `components/AssignTechnicianPanel.tsx` | Asignar o cambiar técnico | RF-6 |
| `components/DiagnosisForm.tsx` | Diagnóstico preliminar | RF-7 |
| `components/UnlockCodeReveal.tsx` | Enmascarado, confirmación, temporizador de 30 s | RF-8 |
| `components/TrackingCodePanel.tsx` | Reposición del código de seguimiento | RF-9 |
| `components/AuditTimeline.tsx` | Historial de estados | RF-10 |
| `shared/components/StatusTimeline.tsx` · `Modal.tsx` | Avance de la orden y diálogos | RF-1.3, RF-5 |
| `hooks/use-work-orders.ts` · `api/work-orders-api.ts` | `useWorkOrder`, `useTransitionWorkOrder`, `useAssignTechnician`, `useUpdateDiagnosis`, `useRevealUnlockCode`, `useRegenerateTrackingCode`, `useWorkOrderAudit` | todos |

## 2. Modelo de datos

Orden mostrada (recorte de `WorkOrder` del contrato generado):

```json
{
  "id": "8a1c…", "number": 123, "status": "APPROVED", "statusLabel": "Aprobado",
  "allowedTransitions": ["IN_REPAIR"],
  "hasUnlockCode": true, "lockType": "PIN",
  "technician": { "id": "6f1c…", "name": "Técnico Uno" },
  "cosmeticCheckIn": { "screen": "CRACKED", "backCover": "OK", "frame": "SCRATCHED", "cameraLens": "OK", "buttons": "OK" }
}
```

Error del Stock Guard (`ApiError`): `{ statusCode: 422, code: "INSUFFICIENT_STOCK", sparePartIds: ["…"] }`.

## 3. Algoritmos

```text
visibleTransitions(order):                                      # RF-2
  order.allowedTransitions.filter(to =>
      to != BUDGETED and to != APPROVED and !(to == CANCELLED and order.status == BUDGETED))

run(to, reason?):                                               # RF-2.5, RF-4
  mutate({to, reason})
  onSuccess: cerrar diálogo ; toast("Orden en <etiqueta>") ; invalidar consultas de la orden y la lista
  onError:   si 409 → toast.warning("La orden cambió mientras tanto") ; refrescar    # RF-4.1
             si 422 y code == INSUFFICIENT_STOCK → <StockGuardBanner sparePartIds/>   # RF-3.1
             si no → mostrar error.message en la sección de acciones                  # RF-3.2

cancelar:                                                       # RF-5
  abrir diálogo ; confirmar habilitado si reason.trim().length >= 3 ; máximo 500 caracteres

permisos locales (solo para ofrecer controles):
  isAssignedTechnician = rol == TECHNICIAN and order.technician.id == user.id
  canDiagnose = status == IN_DIAGNOSIS and (isAssignedTechnician or ADMIN)       # RF-7.1
  canReveal   = isAssignedTechnician or ADMIN                                    # RF-8.4
  isFrontDesk = rol ∈ {ADMIN, RECEPTIONIST}                                      # RF-6, RF-9, RF-11

UnlockCodeReveal:                                               # RF-8
  estado: enmascarado → (pulsar Revelar) → diálogo de aviso de auditoría
        → (confirmar) llamada directa al reveal (sin caché de consultas)
        → visible 30 s (REVEAL_DURATION_SECONDS) → enmascarado
  se oculta también al pasar la pestaña a segundo plano (visibilitychange) y al desmontar
  el código vive solo en el estado del componente; cada revelado es una llamada nueva y auditada
```

## 4. Contrato de uso

| Acción en pantalla | Llamada al backend |
| --- | --- |
| Cargar | `GET /work-orders/:id` · 403 «no asignada» · 404 |
| Avanzar / cancelar | `POST /work-orders/:id/transitions {to, reason?}` |
| Asignar técnico | `POST /work-orders/:id/assign-technician {technicianId}` |
| Guardar diagnóstico | `PATCH /work-orders/:id/diagnosis {preliminaryDiagnosis}` |
| Revelar código | `POST /work-orders/:id/unlock-code/reveal` |
| Reponer código | `POST /work-orders/:id/tracking-code/regenerate` |
| Historial | `GET /work-orders/:id/audit` |
| Presupuestos | enlaces a `/presupuestos/:id` (spec 005) |

## 5. Decisiones técnicas

| Decisión | Justificación | Alternativa descartada |
| --- | --- | --- |
| Botones derivados de `allowedTransitions` del servidor | La regla vive en un solo lugar (C3.4) | Tabla de transiciones duplicada en el navegador |
| Ocultar BUDGETED/APPROVED como botones | Esos pasos exigen un presupuesto enviado o aprobado; saltarlos daría 422 | Mostrarlos y dejar que el servidor rechace |
| Cancelar una orden presupuestada solo vía rechazo del presupuesto | Mantiene coherente presupuesto y orden | Cancelar directo: presupuesto "enviado" huérfano |
| Aviso de 409 en vez de error | Es una carrera normal entre dos personas, no una falla | Mostrar el mensaje técnico del servidor |
| Temporizador de 30 s | Reduce el tiempo que el código queda a la vista | Mostrar hasta cerrar la pantalla |
| Código solo en estado del componente | Nada en almacenamiento ni caché de consultas (C5.3) | Guardarlo en React Query: queda en la caché |
| `StockGuardBanner` resuelve nombres desde la lista de repuestos | El mensaje es útil para el técnico | Mostrar identificadores |

## 6. Estrategia de tests

| Archivo | Tests | RF |
| --- | --- | --- |
| `WorkOrderDetailPage.test.tsx` | datos, avance y auditoría a recepción · orden cancelada interrumpida y sin acciones · técnico guarda diagnóstico · errores de diagnóstico · reasigna técnico y reporta fallas · repone el código tras confirmar · ejecuta transición y reporta estado · avisa del cambio simultáneo · nombra los repuestos faltantes · cancela con motivo · cerrar el diálogo sin cambios · historial no disponible | RF-1, RF-3, RF-4, RF-5, RF-6, RF-7, RF-9, RF-10 |
| `TransitionActions.test.tsx` | solo transiciones permitidas, sin pasos de presupuesto · muestra faltantes del Stock Guard · no renderiza sin transiciones | RF-2, RF-3.1, RF-2.7 |
| `UnlockCodeReveal.test.tsx` | enmascarado y revelado tras confirmar · se oculta a los 30 s · sin botón para quien no puede | RF-8 |
| Pendiente | Enlaces a presupuestos según estado y rol | RF-11 |
| Pendiente | Cancelar oculto en Presupuestada | RF-2.3 |
| Pendiente | Botones bloqueados mientras hay una transición en curso | RF-2.6 |
