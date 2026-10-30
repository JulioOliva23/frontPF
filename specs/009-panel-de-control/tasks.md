# Tareas 009 · Panel de control

Leyenda: `[x]` hecha · `[~]` parcial · `[ ]` pendiente.

- [x] **T1 · Hooks del resumen y del conteo de stock bajo** — RF-1, RF-4
  Hecho cuando: el panel obtiene ambos valores y el test de contadores pasa.
- [x] **T2 · Cuatro indicadores con cifras del servidor** — RF-1.1
  Hecho cuando: pasa "shows the workload counters from the summary and the stock alerts".
- [x] **T3 · Accesos directos a lista filtrada e inventario** — RF-2
  Hecho cuando: pasa "links to the filtered order list and to the inventory".
- [x] **T4 · Cola por estado** — RF-3
  Hecho cuando: pasa "lists every status with a link to its queue".
- [x] **T5 · Fallo del resumen con reintento y contador de stock conservado** — RF-4
  Hecho cuando: pasa "offers a retry when the summary fails, keeping the stock counter".
- [x] **T6 · Acceso solo para administración y recepción** — RF-6
  Hecho cuando: pasan "opens the dashboard at /" y "lands technicians on their orders with a role-filtered menu".
- [~] **T7 · Marcador de carga, guion en error y resaltado de alertas** — RF-1.2, RF-1.3
  Hecho cuando: tres tests cubren la carga (`…`), el error (`—`) y las variantes `danger`/`warning`.
  *Parcial:* implementado en el componente; sin tests específicos.
- [ ] **T8 · Test del saludo y la fecha** — RF-5.1
  Hecho cuando: el encabezado muestra el primer nombre y la fecha en español (con reloj controlado).
- [ ] **T9 · Enlace del indicador "OTs retrasadas"** — duda abierta
  Hecho cuando: el cliente decide y, si procede, el indicador abre la lista de atrasadas (requiere filtro nuevo en la spec 003).
- [ ] **T10 · Indicador de presupuestos vencidos** — duda abierta (depende de backend 010)
  Hecho cuando: el servidor informa `expiredBudgets` y el panel lo muestra.
