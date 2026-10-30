# Tareas 002 · Recepción del equipo (pantalla de ingreso)

Leyenda: `[x]` hecha · `[~]` parcial · `[ ]` pendiente.

- [x] **T1 · Utilidades de IMEI (normalizar, validar, formatear)** — RF-1
  Hecho cuando: pasan los 2 tests de `imei.test.ts`.
- [x] **T2 · Esquema zod del ingreso** — RF-1.2, RF-3.3, RF-3.4
  Hecho cuando: pasan los 5 tests de `check-in-schema.test.ts`.
- [x] **T3 · Reglas del código según el tipo de bloqueo** — RF-4.2, RF-4.3
  Hecho cuando: pasa "accepts a 4-node pattern and a device without lock" y "builds the API payload without empty fields nor an unlock code for NONE".
- [x] **T4 · Formulario con IMEI en tiempo real** — RF-1.1, RF-1.2
  Hecho cuando: pasan "flags an invalid IMEI in real time and never calls the API (RN-02)" y "formats the IMEI while typing".
- [x] **T5 · Estado cosmético por zonas** — RF-3.1
  Hecho cuando: el formulario envía las cinco zonas (verificado en el *payload* de los tests de esquema).
- [x] **T6 · Campo de código enmascarado y cuadrícula de patrón** — RF-4.1, RF-4.2
  Hecho cuando: pasa "masks the PIN by default and shows the ticket with the tracking code after creating the order (SUP-05)".
- [x] **T7 · Ticket con número y código de seguimiento imprimible** — RF-5
  Hecho cuando: el mismo test muestra el ticket tras crear la orden; el *layout* oculta navegación al imprimir (`print:hidden`).
- [x] **T8 · Panel de historial del equipo** — RF-2
  Hecho cuando: un test escribe un IMEI conocido y aparecen las reparaciones previas tras la pausa de tecleo.
  *Evidencia: `CheckInPage.test` "shows the earlier repairs of a known IMEI [002/RF-2.1]".*
- [x] **T9 · Errores del servidor y doble envío** — RF-6
  Hecho cuando: un test provoca un 409 y comprueba que se muestra el motivo y se conserva lo escrito.
  *Evidencia: `CheckInPage.test` "shows the reason and keeps what was typed… [002/RF-6.1]" y "sends a single request while the first one is still in flight [002/RF-6.2]".*
- [x] **T10 · Acceso solo para administración y recepción** — RF-7
  Hecho cuando: la ruta está bajo `RoleGuard` de recepción (revisión del router) y el test del técnico fuera de rutas de recepción en `router.test.tsx` pasa.
- [x] **T11 · Test del historial al ingresar un IMEI conocido y de 404 sin error** — RF-2
  Hecho cuando: ambos casos tienen un test con MSW.
  *Evidencia: `CheckInPage.test` [002/RF-2.1] y "treats an unregistered IMEI as a new device, not as an error [002/RF-2.2]".*
- [x] **T12 · Test del error del servidor y del botón deshabilitado** — RF-6
  Hecho cuando: un 409 muestra el motivo y el botón no permite un segundo envío.
  *Evidencia: `CheckInPage.test` [002/RF-6.1] y [002/RF-6.2].*
- [x] **T13 · Altura mínima de 44 px en el interruptor de mostrar código** — constitución C7.2
  Hecho cuando: el control mide al menos 44 px (hoy 36 px). Se resuelve junto con las demás excepciones en la tarea T6 de la spec 010.
  *Evidencia: regla de diseño `design-rules.test` "gives every pressable control at least 44 px of height [010/RF-4.1]" (el interruptor ahora mide 44 px).*
