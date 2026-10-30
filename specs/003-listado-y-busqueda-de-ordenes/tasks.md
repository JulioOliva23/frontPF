# Tareas 003 · Listado y búsqueda de órdenes

Leyenda: `[x]` hecha · `[~]` parcial · `[ ]` pendiente.

- [x] **T1 · Hook de filtros ligados a la dirección** — RF-5
  Hecho cuando: pasan "restores the filters from the URL" e "ignores an unknown status in the URL".
- [x] **T2 · Tabla y tablero** — RF-1
  Hecho cuando: pasan "lists orders in a table and filters by status" y "switches to the board with one column per status".
- [x] **T3 · Chips de estado** — RF-2
  Hecho cuando: el test de tabla filtra por estado y el filtro se refleja en la dirección.
- [x] **T4 · Filtro por técnico** — RF-3
  Hecho cuando: pasan "lists the active technicians and filters by the chosen one" y "combines the technician with the status chips".
- [x] **T5 · Búsqueda con pausa y Enter inmediato** — RF-4
  Hecho cuando: pasan "sends a single request with the full text once typing stops" y "commits at once on Enter"; `use-debounced-callback.test.ts` pasa.
- [x] **T6 · Vista del técnico** — RF-6, RF-3.3
  Hecho cuando: pasan "shows technicians only their orders and hides the intake button (RN-06)" y "is not offered to technicians…".
- [x] **T7 · Estados vacío y error** — RF-7.1, RF-7.2, RF-7.4
  Hecho cuando: pasan "explains the empty search and resets every filter", "keeps the plain empty state…" y "shows an error state with retry".
- [x] **T8 · Paginación** — RF-8
  Hecho cuando: pasan los 4 tests de `Pagination.test.tsx`.
- [x] **T9 · Test del estado de carga** — RF-7.3
  Hecho cuando: mientras la consulta está pendiente se ve el *skeleton*.
  *Evidencia: `WorkOrdersPage.test` "shows a loading skeleton while the list is on its way [003/RF-7.3]".*
- [x] **T10 · Test: teclear no agrega entradas al historial** — RF-5.3
  Hecho cuando: tras escribir una búsqueda, `history.length` no aumenta.
  *Evidencia: `WorkOrdersPage.test` "replaces the history entry instead of adding one per keystroke [003/RF-5.3]".*
- [x] **T11 · Test de paginación integrada en la pantalla** — RF-8
  Hecho cuando: con más de 20 órdenes se muestra el rango y "Siguiente" pide la página 2.
  *Evidencia: `WorkOrdersPage.test` "asks the server for the next page when the person presses 'Siguiente' [003/RF-8.1]".*
- [ ] **T12 · Definir columnas de la tabla** — dudas abiertas
  Hecho cuando: el cliente decide las columnas y quedan escritas como RF.
