# Tareas 010 · Identidad visual y usabilidad básica

Leyenda: `[x]` hecha · `[~]` parcial · `[ ]` pendiente.

- [x] **T1 · Cian como acento en todas las pantallas** — RF-1.1, RF-1.2
  Hecho cuando: `grep -rn "lime-" src` devuelve vacío (verificado el 2026-10-29).
- [x] **T2 · Cabecera y menú oscuros con elemento activo en cian** — RF-2.1
  Hecho cuando: `app-layout.tsx` y `app-sidebar.tsx` usan `slate-950/900` y `cyan-400`; pasa "opens the mobile drawer and highlights only the exact menu item".
- [x] **T3 · Utilidades de cuadrícula y fondo del contenido** — RF-2.2, RF-2.3
  Hecho cuando: `index.css` define `bg-tech-grid` y `bg-tech-grid-dark` y ambos aparecen en el CSS compilado.
- [x] **T4 · Inicio de sesión oscuro con resplandor** — RF-2.3
  Hecho cuando: `LoginPage.tsx` usa `bg-tech-grid-dark`; el login pasa sus 4 tests.
- [x] **T5 · Impresión sin menú ni cabecera** — RF-2.4
  Hecho cuando: cabecera y menú llevan `print:hidden` y el ticket usa borde sólido al imprimir.
- [x] **T6a · Controles base de 44 px** — RF-4.1
  Hecho cuando: `Button` y los campos nativos tienen `min-height: 44px`.
- [ ] **T6 · Subir a 44 px los 5 controles de 36 px** — RF-4.1
  Hecho cuando: `grep -rn "min-h-\[3" src` devuelve vacío. Controles: interruptor de mostrar código (`UnlockCodeField`), chips de estado (`WorkOrdersPage`), selector de modelos (`DeviceModelPicker`), chips de mano de obra (`BudgetBuilder`) y acción de modelos (`DeviceModelsPage`).
- [ ] **T7 · Verificación automática contra el color lima** — RF-3.1
  Hecho cuando: un test (o regla de lint) falla si algún archivo de `src` contiene `lime-`.
- [ ] **T8 · Revisión visual en celular real** — RF-4.2
  Hecho cuando: las pantallas de inicio de sesión, panel, órdenes, detalle y portal se revisaron a 320 px sin desplazamiento horizontal.
- [ ] **T9 · Auditoría de contraste (WCAG AA)** — RNF-3
  Hecho cuando: texto sobre cian, sobre azul oscuro y sobre los avisos supera 4,5:1, medido con una herramienta.
- [ ] **T10 · Decidir el aspecto del portal público** — duda abierta
  Hecho cuando: el cliente decide y el portal queda alineado (también en la spec 007).
