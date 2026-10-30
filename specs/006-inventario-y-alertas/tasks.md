# Tareas 006 · Inventario de repuestos y alertas de stock

Leyenda: `[x]` hecha · `[~]` parcial · `[ ]` pendiente.

- [x] **T1 · Catálogo con filtros hacia el servidor** — RF-1.2
  Hecho cuando: pasa "sends search, category and model filters to the API".
- [x] **T2 · Vista de recepción sin costos ni acciones de admin** — RF-2.1
  Hecho cuando: pasa "lists the catalog for reception without costs nor admin actions (RN-07)".
- [x] **T3 · Estados vacío y error** — RF-1.3
  Hecho cuando: pasa "shows the empty and error states".
- [x] **T4 · Alta con SKU normalizado y aviso de SKU duplicado** — RF-3.1, RF-3.2
  Hecho cuando: pasan "creates a part as admin, normalizing the SKU (FE-11)" y "explains a duplicated SKU".
- [x] **T5 · Edición sin SKU** — RF-3.3
  Hecho cuando: pasa "edits a part without sending the SKU".
- [x] **T6 · Compatibilidad con modelos** — RF-3.4
  Hecho cuando: pasa "edits compatibility as admin and shows it read-only to reception (RN-10)".
- [x] **T7 · Entradas y ajustes** — RF-4
  Hecho cuando: pasan "registers a stock entry and shows backend errors" y "registers a negative adjustment and explains reserved units (RN-09)".
- [x] **T8 · Lista de stock bajo** — RF-5
  Hecho cuando: pasan los 3 tests de `LowStockPage.test.tsx`.
- [x] **T9 · Contador en el menú** — RF-6
  Hecho cuando: pasan los 6 tests de `app-sidebar.test.tsx`.
- [~] **T10 · Existencias disponible / reservado / físico** — RF-1.1
  Hecho cuando: un test comprueba que los tres valores y la señal de stock aparecen en la fila.
  *Parcial:* el componente `StockBadge` existe; sin test específico.
- [ ] **T11 · Test de edición de compatibilidad con modelos inexistentes** — RF-3.4
  Hecho cuando: un error 422 del servidor se muestra en el cuadro de compatibilidad.
- [ ] **T12 · Botón y confirmación para dar de baja un repuesto** — fuera de alcance actual
  Hecho cuando: el administrador ve "Dar de baja", confirma, y un repuesto con reservas muestra el motivo del rechazo; un test lo cubre.
- [ ] **T13 · Altura mínima de 44 px en el selector de modelos compatibles** — constitución C7.2
  Hecho cuando: los controles del selector de modelos (hoy 36 px) miden al menos 44 px; se coordina con la tarea T6 de la spec 010.
