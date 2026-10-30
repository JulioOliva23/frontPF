# Plan 009 · Panel de control

Cumple la [constitución](../../docs/constitution.md) (C3.2 datos por *hooks*, C5.1 el servidor es la fuente de las cifras, C7.1 estados de carga y error). Cubre RF-1 a RF-6 de [spec.md](spec.md).

## 1. Estructura de módulos

| Archivo (`src`) | Responsabilidad | RF |
| --- | --- | --- |
| `features/dashboard/pages/DashboardPage.tsx` | Cabecera, cuatro indicadores, accesos directos, cola por estado | RF-1 a RF-5 |
| `shared/components/MetricCard.tsx` | Tarjeta de indicador con variantes `default`, `warning`, `danger` | RF-1.3 |
| `features/work-orders/hooks/use-work-orders.ts` → `useWorkOrderSummary` | Resumen (`staleTime` 30 s) | RF-1, RF-3, RF-4 |
| `features/inventory/hooks/use-spare-parts.ts` → `useLowStockCount` | Cantidad de repuestos con stock bajo | RF-1, RF-4 |
| `features/work-orders/hooks/use-work-order-filters.ts` | Parámetro `status` de los enlaces a la lista | RF-2.2, RF-3.1 |
| `app/router.tsx` (`RoleGuard` de recepción en `/`) | Acceso solo para administración y recepción | RF-6 |

## 2. Modelo de datos

Resumen recibido (`GET /work-orders/summary`):

```json
{
  "active": 14, "overdue": 3,
  "byStatus": [ { "status": "RECEIVED", "count": 2 }, { "status": "BUDGETED", "count": 1 }, "… (los 9 estados, incluso con 0)" ]
}
```

Enlaces generados: `/ordenes?status=BUDGETED`, `/inventario/alertas`, `/ordenes/nueva`.

## 3. Algoritmos

```text
countOf(summary, status): summary.byStatus.find(e => e.status == status)?.count ?? 0

valor(count, isLoading, isError):                                # RF-1.2
  isLoading ? "…" : isError ? "—" : (count ?? 0)

variantes:                                                       # RF-1.3
  retrasadas:  overdue > 0 ? danger : default
  por aprobar: awaiting > 0 ? warning : default        # awaiting = countOf(summary, BUDGETED)
  stock bajo:  lowStockCount > 0 ? warning : default

enlaces:                                                         # RF-2, RF-3
  activas → /ordenes ; por aprobar → /ordenes?status=BUDGETED ; stock bajo → /inventario/alertas
  retrasadas → sin enlace (hoy)
  cola: para cada estado de los 9 → /ordenes?status=<ESTADO>

si summary falla: <ErrorState onRetry/> pero se siguen mostrando los demás indicadores     # RF-4
```

## 4. Contrato de uso

| Pantalla | Acción | Llamada |
| --- | --- | --- |
| `/` (Admin, Recepción) | Cargar | `GET /work-orders/summary` y `GET /spare-parts/alerts/low-stock` (independientes) |
| | Reintentar | repite el resumen |
| Otros roles en `/` | — | `RoleGuard` los envía a su pantalla de llegada |

## 5. Decisiones técnicas

| Decisión | Justificación | Alternativa descartada |
| --- | --- | --- |
| Dos consultas independientes | Si una falla, la otra se muestra (RNF-2) | Un único endpoint agregado: el fallo tumba todo el panel |
| Cifras tal como las informa el servidor | Una sola definición de "activa" y "retrasada" (RNF-1) | Recalcular en el navegador a partir de la lista |
| Cada indicador importante es un enlace | De la cifra a la causa en un clic (RNF-3) | Panel solo informativo |
| `staleTime` de 30 s para el resumen | Evita recargar al volver a la pantalla sin dejar datos viejos mucho tiempo | Sin caché: más carga; caché larga: cifras desactualizadas |
| Guion `—` ante error en vez de 0 | Un 0 falso engañaría a recepción | Mostrar 0 |
| Estados completos aunque tengan 0 | El servidor ya los entrega; la cola nunca "pierde" un estado | Mostrar solo los que tienen órdenes |

## 6. Estrategia de tests (`DashboardPage.test.tsx`, `router.test.tsx`)

| Test | RF |
| --- | --- |
| "shows the workload counters from the summary and the stock alerts" | RF-1.1 |
| "links to the filtered order list and to the inventory" | RF-2 |
| "lists every status with a link to its queue" | RF-3 |
| "offers a retry when the summary fails, keeping the stock counter" | RF-4 |
| `router.test.tsx` "opens the dashboard at /" y redirección del técnico a sus órdenes | RF-6 |
| `DashboardPage.test.tsx` | `…` mientras carga y `—` si falla | RF-1.2 |
| `DashboardPage.test.tsx` | retrasadas en rojo; pendientes y stock bajo en ámbar; sin resaltar si no hay nada | RF-1.3 |
| `DashboardPage.test.tsx` | primer nombre y fecha en español con reloj controlado | RF-5.1 |
