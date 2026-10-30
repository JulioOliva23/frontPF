# Plan 003 · Listado y búsqueda de órdenes

Cumple la [constitución](../../docs/constitution.md) (C3.2 datos por *hooks*, C7.1 estados de carga/vacío/error). Cubre RF-1 a RF-8 de [spec.md](spec.md).

## 1. Estructura de módulos

| Archivo (`src/features/work-orders`) | Responsabilidad | RF |
| --- | --- | --- |
| `pages/WorkOrdersPage.tsx` | Compone filtros, vista (tabla/tablero), estados y paginación | RF-1, RF-7, RF-8 |
| `hooks/use-work-order-filters.ts` | Filtros ↔ parámetros de la dirección (`status`, `technicianId`, `search`) | RF-2, RF-3, RF-5 |
| `hooks/use-work-orders.ts` · `api/work-orders-api.ts` | `useWorkOrders`, `useTechnicians` y llamadas | RF-2 a RF-4, RF-6 |
| `components/StatusFilterChips.tsx` | Chips de estado | RF-2 |
| `components/TechnicianFilter.tsx` | Selector de técnico (solo recepción/admin) | RF-3 |
| `components/WorkOrderSearchInput.tsx` | Caja de búsqueda con pausa y Enter | RF-4 |
| `components/WorkOrdersTable.tsx` · `WorkOrdersBoard.tsx` · `WorkOrderCard.tsx` | Vistas | RF-1 |
| `shared/lib/use-debounced-callback.ts` | Pausa de tecleo | RF-4.1 |
| `shared/components/Pagination.tsx` · `EmptyState.tsx` · `ErrorState.tsx` · `LoadingSkeleton.tsx` | Estados genéricos | RF-7, RF-8 |

## 2. Modelo de datos

Estado en la dirección, p. ej. `/ordenes?status=BUDGETED&technicianId=6f1c…&search=maria`:

```json
{
  "filtros": { "status": "BUDGETED", "technicianId": "6f1c…", "search": "maria" },
  "consulta": { "page": 1, "pageSize": 20 },
  "respuesta": {
    "data": [ { "id": "…", "number": 123, "status": "BUDGETED", "statusLabel": "Presupuestado",
                "device": { "brand": "Apple", "model": "iPhone 13" }, "customer": { "name": "María Quispe" } } ],
    "total": 48, "page": 1, "pageSize": 20
  }
}
```

La clave de caché de React Query incluye los filtros; cada combinación tiene su propia entrada.

## 3. Algoritmos

```text
readFilters(params):                                            # RF-5.1, RF-5.2
  status = ALL_STATUSES.find(s => s == params.status)           # desconocido → undefined
  technicianId = trim(params.technicianId) o ausente
  search = trim(params.search) o ausente

update(patch): setSearchParams(prev => aplicar patch, {replace: true})   # RF-5.3: sin historial por tecla

búsqueda (WorkOrderSearchInput):                                # RF-4
  onChange(texto): local = texto ; debounce(commit(texto.trim()), SEARCH_DEBOUNCE_MS = 300 ms)
  onEnter(): cancelar debounce ; commit(texto.trim())
  commit(valor): setSearch(valor || undefined)                  # una sola petición con el texto completo

lista(rol, filtros):                                            # RF-3.3, RF-6
  mostrarFiltroTecnico = rol ∈ {ADMIN, RECEPTIONIST}
  mostrarBotonRecepcion = rol ∈ {ADMIN, RECEPTIONIST}
  petición = GET /work-orders?status&technicianId&search&page  # el técnico se limita en el servidor

estado de la pantalla:                                          # RF-7
  cargando → skeleton ; error → ErrorState(reintentar)
  vacío: hasActiveFilters ? "Sin resultados + Restablecer filtros" : EmptyState simple
```

## 4. Contrato de uso

| Pantalla | Acción | Llamada |
| --- | --- | --- |
| `/ordenes` (Staff) | Cargar lista | `GET /work-orders?status=&technicianId=&search=&page=&pageSize=` |
| | Cargar técnicos | `GET /users?role=TECHNICIAN` (solo recepción/admin) |
| | Abrir una orden | navegación a `/ordenes/:id` (spec 004) |
| Enlaces desde el panel | `/ordenes?status=<ESTADO>` | restauran el filtro (RF-5.1) |

## 5. Decisiones técnicas

| Decisión | Justificación | Alternativa descartada |
| --- | --- | --- |
| Filtros en la dirección (`useSearchParams`) | Compartibles, recargables y enlazables desde el panel (RNF-2) | Estado local: se pierde al recargar |
| `replace: true` al teclear | No llena el historial con cada tecla (RF-5.3) | `push` por tecla: "Atrás" inservible |
| Búsqueda en el servidor | La lista es paginada; filtrar en el navegador mostraría resultados parciales | Filtrar la página cargada |
| Debounce + Enter inmediato | Equilibra rapidez y número de peticiones (RNF-1) | Buscar por tecla: ráfagas de peticiones |
| Tabla y tablero comparten los mismos filtros; el tablero consulta cada columna por separado (20 por columna) | Un solo estado de filtros y cada columna se pagina por su cuenta | Una consulta global agrupada en el navegador: cargaría todas las órdenes |
| Alcance del técnico impuesto por el servidor | No depende de ocultar un control (RNF-4) | Filtrar en el navegador |

## 6. Estrategia de tests (`WorkOrdersPage.test.tsx`, `Pagination.test.tsx`)

| Test | RF |
| --- | --- |
| "lists orders in a table and filters by status" | RF-1.1, RF-2 |
| "switches to the board with one column per status" | RF-1.1 |
| "sends a single request with the full text once typing stops" · "commits at once on Enter" | RF-4 |
| "restores the filters from the URL" · "ignores an unknown status in the URL" | RF-5.1, RF-5.2 |
| "lists the active technicians and filters by the chosen one" · "combines the technician with the status chips" | RF-3.1, RF-3.2 |
| "is not offered to technicians, who only see their queue (RN-06)" · "shows technicians only their orders and hides the intake button (RN-06)" | RF-3.3, RF-6 |
| "explains the empty search and resets every filter" · "keeps the plain empty state when there are no orders at all" | RF-7.1, RF-7.2 |
| "shows an error state with retry" | RF-7.4 |
| `Pagination.test.tsx` (rango, última página parcial, avance/retroceso, no se muestra si cabe) | RF-8 |
| `WorkOrdersPage.test.tsx` "shows a loading skeleton…" | RF-7.3 |
| `WorkOrdersPage.test.tsx` "replaces the history entry…" | RF-5.3 |
