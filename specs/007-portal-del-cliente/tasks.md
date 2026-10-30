# Tareas 007 · Portal del cliente

Leyenda: `[x]` hecha · `[~]` parcial · `[ ]` pendiente.

- [x] **T1 · Utilidades de número y código de seguimiento** — RF-1.2, RF-2
  Hecho cuando: `shared/lib/tracking-code.ts` normaliza y valida; los tests de `TrackingForm.test.tsx` lo ejercitan.
- [x] **T2 · Esquema de validación del formulario** — RF-2
  Hecho cuando: pasa "rejects a 4-digit PIN-like code before calling the API".
- [x] **T3 · Consulta con el ticket y normalización** — RF-1
  Hecho cuando: pasa "sends the normalized number and code and returns the status".
- [x] **T4 · Mensaje único ante 404 y enfriamiento ante 429** — RF-3.1, RF-3.2
  Hecho cuando: pasan "shows a single message for an unknown order or a wrong code (404)" y "explains the rate limit and disables the button (429)".
- [x] **T5 · Vista de la orden para el cliente** — RF-4.1
  Hecho cuando: pasa "looks up one order anonymously and lets the visitor search again".
- [x] **T6 · Lista de órdenes del cliente con sesión** — RF-5.1, RF-5.2
  Hecho cuando: pasan "lists every order of a logged-in customer, including cancelled ones (RN-14)" y "tells a customer without orders and logs them out".
- [x] **T7 · Formulario público para el personal** — RF-6.2
  Hecho cuando: pasa "shows staff the public form without account links".
- [x] **T8 · Ruta pública y redirección heredada** — RF-7
  Hecho cuando: `/portal-cliente` es accesible sin sesión y `/tracking` redirige (test de redirecciones del router).
- [ ] **T9 · Test del mensaje de red caída** — RF-3.3
  Hecho cuando: un error de red muestra el mensaje de intento posterior y no el de "no encontrada".
- [ ] **T10 · Test de la orden cancelada** — RF-4.2
  Hecho cuando: una orden cancelada muestra el aviso de retiro en el local.
- [ ] **T11 · Test del enlace "Ingresar con mi cuenta"** — RF-6.1
  Hecho cuando: aparece solo para visitantes anónimos.
- [ ] **T12 · Test de campos internos** — RF-4.3
  Hecho cuando: aunque la respuesta traiga campos extra, solo se renderizan los de la spec.
- [ ] **T13 · Definir el aspecto de la página pública** — duda abierta
  Hecho cuando: queda decidido y se refleja en la spec 010.
