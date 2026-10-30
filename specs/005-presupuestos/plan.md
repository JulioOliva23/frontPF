# Plan 005 · Presupuestos

Cumple la [constitución](../../docs/constitution.md) (C3.1 reglas puras, C5.4 dinero en centavos, C3.4 servidor decide). Cubre RF-1 a RF-6 de [spec.md](spec.md).

## 1. Estructura de módulos

| Archivo (`src/features/budgets`) | Responsabilidad | RF |
| --- | --- | --- |
| `pages/BudgetsPage.tsx` | Dos colas por estado de la orden | RF-1 |
| `pages/BudgetEditorPage.tsx` | Compone armado, versiones y decisión | RF-2, RF-3, RF-4, RF-6 |
| `components/BudgetBuilder.tsx` | Líneas de mano de obra y repuesto, vista previa del total | RF-2 |
| `components/BudgetVersionCard.tsx` · `BudgetStatusBadge.tsx` | Versión, estado, vencimiento, acciones | RF-3, RF-5 |
| `components/BudgetDecisionModal.tsx` | Medio de respuesta y motivo | RF-4 |
| `lib/budget-status.ts` | **Funciones puras**: etiquetas, canales, `effectiveBudgetStatus`, `daysUntilExpiry`, `toCents`, `centsToAmount` | RF-4.2, RF-5, RNF-1 |
| `schemas/budget-schema.ts` | Esquema zod de líneas y armado del *payload* | RF-2 |
| `hooks/use-budgets.ts` · `api/budgets-api.ts` | `useBudgets`, `useCreateBudget`, `useBudgetDecision` (enviar, aprobar, rechazar) | RF-2 a RF-4 |
| `features/inventory/components/DeviceModelPicker.tsx` · `api/spare-parts-api.ts` | Repuestos compatibles con el modelo | RF-2.3 |

## 2. Modelo de datos

*Payload* de creación (nótese que las líneas de repuesto **no llevan precio**):

```json
{
  "items": [
    { "itemType": "LABOR", "description": "Micro-soldadura", "quantity": 1, "unitPrice": "150.00" },
    { "itemType": "PART",  "description": "Pantalla OLED iPhone 13", "quantity": 1, "sparePartId": "5b2e…" }
  ]
}
```

Decisión: aprobar `{ "channel": "WHATSAPP" }` · rechazar `{ "channel": "PHONE", "reason": "Precio alto" }`. Versión recibida: `{ version, status, total: "1130.00", expiresAt, sentAt, items:[…] }`.

## 3. Algoritmos

```text
effectiveBudgetStatus(budget, now):                              # RF-5.2
  budget.status == SENT and Date(budget.expiresAt) < now ? EXPIRED : budget.status

daysUntilExpiry(budget, now): ceil((Date(budget.expiresAt) − now) / 86 400 000)   # RF-5.3

toCents("150.5"):                                                # RNF-1
  if !/^\d{1,10}(\.\d{1,2})?$/.test(v): return 0
  [whole, frac=""] = v.split("."); return int(whole)*100 + int(frac.padEnd(2,"0"))
centsToAmount(c): `${trunc(c/100)}.${pad2(c % 100)}`

total de la vista previa (BudgetBuilder):
  suma = Σ  toCents(unitPrice) * quantity       # mano de obra: precio escrito
          + precioCatalogo(repuesto) * quantity # repuestos: precio del catálogo
  mostrar centsToAmount(suma)      # solo vista previa; el total válido lo devuelve el servidor

canBudget = order.status ∈ {IN_DIAGNOSIS, BUDGETED}              # RF-2.1
mostrar Aprobar/Rechazar solo si order.status == BUDGETED        # RF-4.1

decisión:                                                        # RF-4
  valid = channel != "" and (aprobando or reason.trim().length >= 3)
  confirmar → mutate ; éxito: cerrar y toast ; error: mostrar mensaje dentro del modal
```

## 4. Contrato de uso

| Pantalla | Acción | Llamada |
| --- | --- | --- |
| `/presupuestos` (Admin, Recepción) | Cargar colas | `GET /work-orders?status=IN_DIAGNOSIS&pageSize=50` y `…status=BUDGETED…` |
| `/presupuestos/:workOrderId` | Cargar orden y versiones | `GET /work-orders/:id` · `GET /work-orders/:id/budgets` |
| | Repuestos compatibles | `GET /spare-parts?deviceModelId=…` |
| | Crear borrador | `POST /work-orders/:id/budgets` |
| | Enviar | `POST /budgets/:id/send` |
| | Aprobar / rechazar | `POST /budgets/:id/approve` · `/reject` |

## 5. Decisiones técnicas

| Decisión | Justificación | Alternativa descartada |
| --- | --- | --- |
| Vista previa del total en centavos enteros | Evita el error de coma flotante (RNF-1) | `number` con decimales y `toFixed` |
| El servidor es dueño del total y de los precios de repuesto | Nadie altera un precio desde el navegador (C3.4) | Enviar el precio de cada línea |
| Estado "expirado" derivado de `expiresAt` | El servidor solo lo marca cuando alguien decide (SUP-04); el usuario debe verlo ya | Confiar en el `status` recibido |
| Decisión en un cuadro modal con medio obligatorio | Queda constancia, y el error del servidor se ve en contexto | Aprobar con un solo clic |
| Esquema de líneas como unión discriminada (`LABOR`/`PART`) | El tipo de línea determina qué campos existen | Un único esquema con campos opcionales |
| Colas con `pageSize` 50 | Suficiente para el mostrador sin paginar | Paginación: añade pasos a un flujo corto |

## 6. Estrategia de tests

| Archivo | Tests | RF |
| --- | --- | --- |
| `BudgetsPage.test.tsx` | reparte las órdenes en "por presupuestar" y "esperando respuesta" | RF-1.1 |
| `BudgetEditorPage.test.tsx` | error al cargar · orden que ya no admite presupuestos · borrador con mano de obra y repuesto compatible sin precio de repuesto · líneas inválidas, quitar y errores del servidor · envío · motivo del fallo de envío · aprobación con canal · rechazo con motivo y errores en el modal · cerrar el modal sin llamar · marcas de vencido y rechazado | RF-2 a RF-6 |
| `budget-status.test.ts` | totales en centavos sin deriva · enviado vencido se muestra expirado | RNF-1, RF-5.2 |
| `BudgetEditorPage.test.tsx` | "Vence en 3 día(s)" con una fecha controlada | RF-5.3 |
| `BudgetsPage.test.tsx` | "Nada pendiente" en una cola vacía | RF-1.3 |
| `BudgetEditorPage.test.tsx` | con 2 caracteres el botón está desactivado y con 3 se activa | RF-4.3 |
