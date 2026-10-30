# Tareas 004 · Detalle de la orden de trabajo

Leyenda: `[x]` hecha · `[~]` parcial · `[ ]` pendiente.

- [x] **T1 · Datos de la orden y avance de estados** — RF-1
  Hecho cuando: pasan "shows the order data, progress and audit history to the front desk" y "shows a cancelled order as interrupted and with no actions".
- [x] **T2 · Botones de transición según el servidor** — RF-2.1, RF-2.2, RF-2.7
  Hecho cuando: pasan los tests de `TransitionActions.test.tsx` ("renders only the backend-allowed transitions…", "renders nothing when the viewer has no transitions").
- [x] **T3 · Aviso del Stock Guard con repuestos faltantes** — RF-3.1
  Hecho cuando: pasan "shows the missing parts when the Stock Guard blocks IN_REPAIR (RN-09)" y "names the parts that block the repair (Stock Guard, RN-09)".
- [x] **T4 · Cambio simultáneo con aviso amable** — RF-4.1
  Hecho cuando: pasa "warns about concurrent changes instead of showing a raw error (RN-04)".
- [x] **T5 · Cancelación con motivo** — RF-5
  Hecho cuando: pasan "cancels an order with a reason and shows other errors inline" y "closes the cancel dialog without changing the order".
- [x] **T6 · Asignación de técnico** — RF-6
  Hecho cuando: pasa "reassigns the technician and reports failures (RN-06)".
- [x] **T7 · Diagnóstico preliminar** — RF-7
  Hecho cuando: pasan "lets the assigned technician save the diagnosis" y "shows diagnosis errors from the backend".
- [x] **T8 · Revelado temporal del código de desbloqueo** — RF-8
  Hecho cuando: pasan los 3 tests de `UnlockCodeReveal.test.tsx`.
- [x] **T9 · Reposición del código de seguimiento** — RF-9
  Hecho cuando: pasa "regenerates the tracking code after confirming (SUP-05)".
- [x] **T10 · Historial de auditoría y su fallo** — RF-10
  Hecho cuando: pasan "shows the order data, progress and audit history…" y "reports when the audit history cannot be loaded".
- [~] **T11 · Acceso al flujo de presupuestos** — RF-11
  Hecho cuando: un test comprueba el enlace "Armar presupuesto" en Diagnóstico y "Registrar respuesta del cliente" en Presupuestada.
  *Parcial:* implementado, sin test directo.
- [ ] **T11b · Test: el código se oculta al pasar la pestaña a segundo plano** — RF-8.3
  Hecho cuando: un test dispara `visibilitychange` con la pestaña oculta y el código desaparece.
- [ ] **T12 · Test: cancelar oculto en Presupuestada** — RF-2.3
  Hecho cuando: con la orden Presupuestada no aparece "Cancelar".
- [ ] **T13 · Test: botones bloqueados durante la transición** — RF-2.6
  Hecho cuando: mientras la mutación está pendiente, los demás botones están deshabilitados.
- [ ] **T14 · Responder dudas abiertas (cancelación tras aprobar, presupuesto en la orden)** — dudas abiertas
  Hecho cuando: el cliente decide y las reglas quedan escritas como RF.
