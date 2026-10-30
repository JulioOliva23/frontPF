# Tareas 005 · Presupuestos

Leyenda: `[x]` hecha · `[~]` parcial · `[ ]` pendiente.

- [x] **T1 · Funciones puras de estado y dinero** — RF-5.2, RNF-1
  Hecho cuando: pasan "previews totals in integer cents, without floating point drift" y "treats a SENT budget past its expiry as expired (SUP-04)".
- [x] **T2 · Esquema de líneas (unión discriminada)** — RF-2.2 a RF-2.5
  Hecho cuando: el esquema valida descripción, cantidad 1–50, monto y 1–50 líneas; el test de líneas inválidas pasa.
- [x] **T3 · Colas por estado de la orden** — RF-1
  Hecho cuando: pasa "splits orders into 'to budget' and 'waiting for the customer' queues".
- [x] **T4 · Armado con repuestos compatibles y sin precio de repuesto** — RF-2.3, RF-2.4
  Hecho cuando: pasa "builds a draft with labor and a compatible part, and posts it without part prices (RN-10)".
- [x] **T5 · Errores de línea y del servidor** — RF-2.7
  Hecho cuando: pasa "flags invalid labor lines, lets the user remove them and shows backend errors".
- [x] **T6 · Envío al cliente** — RF-3
  Hecho cuando: pasan "sends a draft to the customer" y "shows why sending failed".
- [x] **T7 · Aprobación y rechazo con medio y motivo** — RF-4
  Hecho cuando: pasan "records the customer approval with the channel used (RN-05)", "records a rejection with its reason and shows backend errors in the modal" y "closes the decision modal without calling the API".
- [x] **T8 · Marcas de versión vencida y rechazada** — RF-5.1, RF-5.4
  Hecho cuando: pasa "marks expired and rejected versions (SUP-04)".
- [x] **T9 · Aviso de orden que ya no admite presupuestos y error de carga** — RF-2.1, RF-6.2
  Hecho cuando: pasan "tells the user when the order no longer accepts budgets and has none" y "shows an error state when the order cannot be loaded".
- [~] **T10 · Días restantes del presupuesto vigente** — RF-5.3
  Hecho cuando: un test muestra "Vence en N día(s)" con una fecha controlada.
  *Parcial:* el componente lo muestra; sin test directo.
- [ ] **T11 · Test del estado vacío de las colas** — RF-1.3
  Hecho cuando: sin órdenes se ve "Nada pendiente" en ambas colas.
- [ ] **T12 · Test del motivo mínimo del rechazo** — RF-4.3
  Hecho cuando: con 2 caracteres el botón de confirmar está desactivado y con 3 se activa.
- [ ] **T13 · Alinear con el vencimiento automático del backend (spec 010)** — RF-5.2
  Hecho cuando: el servidor devuelve el estado efectivo y la función local queda como respaldo.
