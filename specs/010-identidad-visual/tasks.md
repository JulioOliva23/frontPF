# Tareas 010 · Identidad visual y usabilidad básica

Leyenda: `[x]` hecha · `[~]` parcial · `[ ]` pendiente.

- [x] **T1 · Paleta oscura con menta y lavanda en `@theme`** — RF-1.1, RF-2.1
  Hecho cuando: `index.css` define los tokens y el fondo `canvas`; pasa "uses mint for the main action… [010/RF-1.1]".
- [x] **T2 · Quitar los acentos anteriores (lima y cian)** — RF-1.2
  Hecho cuando: pasa "never uses the old lime or cyan accents anywhere [010/RF-1.2]".
  *Evidencia: se corrigieron las dos casillas que quedaban (`accent-lime-600` en `DeviceModelsPage`, `accent-cyan-600` en `DeviceModelPicker`) a `accent-mint`.*
- [x] **T3 · Cabecera, menú y tarjetas de vidrio** — RF-2.1, RF-2.2
  Hecho cuando: pasan los tests `[010/RF-2.1]` y `[010/RF-2.2]`.
- [x] **T4 · Inicio de sesión con mascota** — RF-2.3
  Hecho cuando: pasa "shows the mascot with its halo on the sign-in page [010/RF-2.3]".
- [x] **T5 · Impresión limpia** — RF-2.4
  Hecho cuando: cabecera, menú y barra inferior llevan `print:hidden` y `@media print` pone el fondo blanco.
- [x] **T6 · Subir a 44 px los 5 controles de 36 px** — RF-4.1
  Hecho cuando: pasa "gives every pressable control at least 44 px of height [010/RF-4.1]". Controles: interruptor de mostrar código (`UnlockCodeField`), chips de vista (`WorkOrdersPage`), selector de modelos (`DeviceModelPicker`), chips de mano de obra (`BudgetBuilder`) y acción de modelos (`DeviceModelsPage`).
- [x] **T7 · Reglas de diseño como tests** — RF-1 a RF-5.1
  Hecho cuando: `src/test/design-rules.test.ts` cubre cada RF y corre con `npm test`.
- [x] **T8 · Movimiento reducido** — RF-4.4
  Hecho cuando: pasa "turns animations off when the person asks for reduced motion [010/RF-4.4]".
- [ ] **T9 · Revisión visual en celular real** — RF-4.2
  Hecho cuando: las pantallas de inicio de sesión, panel, órdenes, detalle y portal se revisaron a 320 px sin desplazamiento horizontal.
- [ ] **T10 · Auditoría de contraste (WCAG AA)** — RNF-3
  Hecho cuando: texto sobre menta, sobre el fondo oscuro y sobre los avisos supera 4,5:1, medido con una herramienta.
