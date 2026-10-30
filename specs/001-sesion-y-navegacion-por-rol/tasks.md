# Tareas 001 · Sesión y navegación por rol

Leyenda: `[x]` hecha · `[~]` parcial · `[ ]` pendiente.

- [x] **T1 · Formulario de login con validación zod** — RF-1.1
  Hecho cuando: pasan los 4 tests de `login-schema.test.ts` y "validates required fields before calling the API".
- [x] **T2 · Mensajes de error del login** — RF-1.2 a RF-1.4
  Hecho cuando: pasan "shows the backend message on bad credentials", "asks to wait when rate limited" y "falls back to a generic message…".
- [x] **T3 · Rutas de llegada por rol y grupos de roles** — RF-2
  Hecho cuando: `router.test.tsx` comprueba la llegada de técnicos a sus órdenes y la de administración al panel.
- [x] **T4 · Menú filtrado por rol** — RF-3
  Hecho cuando: pasan los 5 tests de `navigation.test.ts`.
- [x] **T5 · `RoleGuard` y retorno seguro** — RF-4
  Hecho cuando: pasan los 3 tests de `RoleGuard.test.tsx` y "only accepts in-app return paths".
- [x] **T6 · Restauración de sesión con una sola renovación** — RF-5.1, RF-5.2
  Hecho cuando: pasan los 2 tests de `AuthProvider.test.tsx`.
- [x] **T7 · Renovación compartida y cola de peticiones** — RF-5.3, RF-5.6
  Hecho cuando: pasan "shares one refresh among concurrent 401s…" y "queues a request issued while a refresh is running…".
- [x] **T8 · Aviso único de sesión expirada y regreso a la pantalla** — RF-5.4, RF-5.5
  Hecho cuando: pasan "reports the expired session once…", "does not report an expired session for anonymous 401s" y "never tries to refresh a failed login".
- [x] **T9 · Pantallas 404, de fallo y de módulo no descargado** — RF-7
  Hecho cuando: pasan los tests de 404, de "crashed page" y de "chunk" de `router.test.tsx`.
- [x] **T10 · Cajón de menú móvil** — RF-8
  Hecho cuando: pasa "opens the mobile drawer and highlights only the exact menu item".
- [~] **T11 · Cierre de sesión** — RF-6.1
  Hecho cuando: un test comprueba que cerrar sesión llama al servidor, borra el almacenamiento y navega al login.
  *Parcial:* `router.test.tsx` ejercita "logs out" en el flujo del técnico, pero no verifica la llamada ni el borrado.
- [ ] **T12 · Test del indicador y de la protección contra doble envío** — RF-1.5
  Hecho cuando: un test pulsa dos veces "Ingresar" y solo se envía una petición.
- [ ] **T13 · Responder dudas abiertas (recuperar contraseña, aviso previo)** — dudas abiertas
  Hecho cuando: el cliente decide y las reglas quedan escritas como RF.
