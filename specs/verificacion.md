# Verificación de las specs del frontend

**Fecha:** 2026-10-29 · **Rama:** `diseño-nuevo` (incluye `main` actualizado) · **Constitución:** [docs/constitution.md](../docs/constitution.md)

## 1. Qué se ejecutó

| Suite | Comando | Resultado |
| --- | --- | --- |
| Tests | `npx vitest run` | ✅ **29 archivos, 204 tests, 0 fallos** (ninguno depende de la red: usan MSW) |
| Build | `npm run build` (`tsc -b` + Vite) | ✅ compila |
| Pre-commit | lint + typecheck + test (corre en cada commit) | ✅ pasó en el último commit |
| Reglas de la constitución | `grep` sobre `src/` | Ver sección 4 |

Leyenda: ✅ cubierto por un test que pasó · ⚠️ implementado pero **sin test** · ❌ **incumple la spec** · — no aplica (spec propuesta). Todos los tests de este repositorio se ejecutaron hoy, a diferencia del backend.

## 2. Requisito por requisito

### Spec 001 · Sesión y navegación por rol

| RF | Test | Resultado |
| --- | --- | --- |
| RF-1.1 Validación previa del login | `LoginPage`: "validates required fields before calling the API"; `login-schema` (4 tests) | ✅ |
| RF-1.2–1.4 Mensajes de error | "shows the backend message on bad credentials", "asks to wait when rate limited", "falls back to a generic message for unexpected errors" | ✅ |
| RF-1.5 Indicador y bloqueo de doble envío | — | ⚠️ |
| RF-2 Pantalla de llegada por rol | `router`: "opens the dashboard at /", "lands technicians on their orders…"; `RoleGuard`: "sends customers to the portal" | ✅ |
| RF-3 Menú por rol | `navigation.test` (5 tests); `app-sidebar` ("never asks technicians for stock alerts") | ✅ |
| RF-4 Protección de pantallas | `RoleGuard` (3 tests); `router`: "only accepts in-app return paths", "keeps technicians out of front-desk routes" | ✅ |
| RF-5.1, 5.2 Restaurar sesión | `AuthProvider`: "restores the session with a single refresh even under StrictMode double effects", "ends anonymous when there is no stored session" | ✅ |
| RF-5.3–5.6 Renovación compartida, aviso único, cola | `httpClient`: "shares one refresh among concurrent 401s…", "queues a request issued while a refresh is running…", "reports the expired session once…", "does not report an expired session for anonymous 401s", "never tries to refresh a failed login" | ✅ |
| RF-6.1 Cerrar sesión | `router` ("…and logs out") la ejecuta, pero sin verificar la llamada al servidor ni el borrado local | ⚠️ |
| RF-7 404, fallos, módulo no descargado, redirecciones | `router`: 404 con/sin sesión, "replaces a crashed page with a fallback…", "asks to reload when a lazy chunk cannot be fetched", "redirects legacy paths" | ✅ |
| RF-8 Cajón móvil | "opens the mobile drawer and highlights only the exact menu item" | ✅ |

**Veredicto 001: ✅ Cumplida**, con dos huecos de prueba (RF-1.5, RF-6.1).

### Spec 002 · Recepción del equipo

| RF | Test | Resultado |
| --- | --- | --- |
| RF-1 IMEI asistido | `CheckInPage`: "flags an invalid IMEI in real time and never calls the API (RN-02)", "formats the IMEI while typing"; `check-in-schema` (formato válido, dígito erróneo); `imei.test` (2) | ✅ |
| RF-2 Historial del equipo | — | ⚠️ |
| RF-3.1–3.4 Datos, batería y fecha | `check-in-schema`: "rejects battery above 100 and a past promise date" | ✅ |
| RF-4.1 PIN enmascarado | `CheckInPage`: "masks the PIN by default and shows the ticket…" | ✅ |
| RF-4.2, 4.3 Patrón y "sin bloqueo" | `check-in-schema`: "accepts a 4-node pattern and a device without lock", "builds the API payload without empty fields nor an unlock code for NONE" | ✅ |
| RF-4.4 Código no guardado ni en consola | `grep`: ni `localStorage` ni `console.*` (sección 4); sin test | ⚠️ |
| RF-5.1 Ticket con código de seguimiento | `CheckInPage` (mismo test del PIN) | ✅ |
| RF-5.2 El código no se vuelve a mostrar | — | ⚠️ |
| RF-6 Errores del servidor y doble envío | — | ⚠️ |
| RF-7.1 Solo recepción y administración | `router`: "keeps technicians out of front-desk routes" | ✅ |

**Veredicto 002: ⚠️ Cumplida con huecos** (RF-2, 5.2, 6 sin test).

### Spec 003 · Listado y búsqueda

| RF | Test | Resultado |
| --- | --- | --- |
| RF-1 Tabla y tablero | "lists orders in a table and filters by status", "switches to the board with one column per status" | ✅ |
| RF-2 Filtro por estado | mismo test de la tabla | ✅ |
| RF-3 Filtro por técnico | "lists the active technicians and filters by the chosen one", "combines the technician with the status chips", "is not offered to technicians…" | ✅ |
| RF-4 Búsqueda con pausa y Enter | "sends a single request with the full text once typing stops", "commits at once on Enter"; `use-debounced-callback` (4) | ✅ |
| RF-5.1, 5.2 Filtros en la dirección | "restores the filters from the URL", "ignores an unknown status in the URL" | ✅ |
| RF-5.3 Sin llenar el historial al teclear | — | ⚠️ |
| RF-6 Alcance del técnico | "shows technicians only their orders and hides the intake button (RN-06)" | ✅ |
| RF-7.1, 7.2, 7.4 Vacío y error | "explains the empty search and resets every filter", "keeps the plain empty state…", "shows an error state with retry" | ✅ |
| RF-7.3 Estado de carga | — | ⚠️ |
| RF-8 Paginación | `Pagination.test` (4 tests, a nivel de componente) | ✅ |

**Veredicto 003: ✅ Cumplida** (RF-5.3 y 7.3 sin test).

### Spec 004 · Detalle de la orden

| RF | Test | Resultado |
| --- | --- | --- |
| RF-1 Información, avance, cancelada, errores | `WorkOrderDetailPage`: "shows the order data, progress and audit history…", "shows a cancelled order as interrupted and with no actions" | ✅ |
| RF-2.1, 2.2, 2.7 Botones del servidor | `TransitionActions`: "renders only the backend-allowed transitions…", "renders nothing when the viewer has no transitions" | ✅ |
| RF-2.3, 2.6 Sin cancelar si Presupuestada; botones bloqueados en curso | — (la lógica existe en `visible-transitions` y `TransitionActions`) | ⚠️ |
| RF-2.4, 2.5 Texto del retorno y confirmación | "runs a transition and reports the new status" | ✅ |
| RF-3 Stock Guard | "shows the missing parts when the Stock Guard blocks IN_REPAIR (RN-09)", "names the parts that block the repair" | ✅ |
| RF-4 Cambio simultáneo | "warns about concurrent changes instead of showing a raw error (RN-04)" | ✅ |
| RF-5 Cancelación con motivo | "cancels an order with a reason…", "closes the cancel dialog without changing the order" | ✅ |
| RF-6 Asignación | "reassigns the technician and reports failures (RN-06)" | ✅ |
| RF-7 Diagnóstico | "lets the assigned technician save the diagnosis", "shows diagnosis errors from the backend" | ✅ |
| RF-8.1, 8.2, 8.4 Revelado confirmado y restringido | `UnlockCodeReveal`: "masks the code and reveals it only after confirming the audited call", "offers no reveal button to users who may not see the code" | ✅ |
| RF-8.3 Se oculta a los 30 s | "hides the code again after 30 seconds" | ✅ |
| RF-8.3 (pestaña oculta / desmontar) | — | ⚠️ |
| RF-9 Reponer el código de seguimiento | "regenerates the tracking code after confirming (SUP-05)" | ✅ |
| RF-10 Historial | "shows the order data, progress and audit history…", "reports when the audit history cannot be loaded" | ✅ |
| RF-11 Acceso a presupuestos | — | ⚠️ |

**Veredicto 004: ✅ Cumplida** con huecos en RF-2.3, 2.6, 8.3 (parte) y 11.

### Spec 005 · Presupuestos

| RF | Test | Resultado |
| --- | --- | --- |
| RF-1.1, 1.2 Colas | `BudgetsPage`: "splits orders into 'to budget' and 'waiting for the customer' queues" | ✅ |
| RF-1.3 "Nada pendiente" | — | ⚠️ |
| RF-2.1 Orden que ya no admite presupuestos | "tells the user when the order no longer accepts budgets and has none" | ✅ |
| RF-2.2–2.5, 2.7 Armado y validación | "builds a draft with labor and a compatible part, and posts it without part prices (RN-10)", "flags invalid labor lines, lets the user remove them and shows backend errors" | ✅ |
| RF-2.6 Vista previa sin deriva | `budget-status`: "previews totals in integer cents, without floating point drift" | ✅ |
| RF-3 Envío | "sends a draft to the customer", "shows why sending failed" | ✅ |
| RF-4.1, 4.2, 4.4, 4.5 Decisión | "records the customer approval with the channel used (RN-05)", "records a rejection… and shows backend errors in the modal", "closes the decision modal without calling the API" | ✅ |
| RF-4.3 Motivo mínimo de 3 caracteres | — | ⚠️ |
| RF-5.1, 5.2, 5.4 Versiones y vencido | "marks expired and rejected versions (SUP-04)"; "treats a SENT budget past its expiry as expired" | ✅ |
| RF-5.3 Días restantes | — | ⚠️ |
| RF-6 Contexto y error de carga | "shows an error state when the order cannot be loaded" | ✅ |

**Veredicto 005: ✅ Cumplida** (RF-1.3, 4.3, 5.3 sin test).

### Spec 006 · Inventario y alertas

| RF | Test | Resultado |
| --- | --- | --- |
| RF-1.1 Existencias visibles | — | ⚠️ |
| RF-1.2, 1.3 Filtros, vacío y error | "sends search, category and model filters to the API", "shows the empty and error states" | ✅ |
| RF-2 Privacidad de costos | "lists the catalog for reception without costs nor admin actions (RN-07)" | ✅ |
| RF-3 Alta y edición | "creates a part as admin, normalizing the SKU (FE-11)", "explains a duplicated SKU", "edits a part without sending the SKU", "edits compatibility as admin and shows it read-only to reception (RN-10)" | ✅ |
| RF-4 Entradas y ajustes | "registers a stock entry and shows backend errors", "registers a negative adjustment and explains reserved units (RN-09)" | ✅ |
| RF-5 Alertas | `LowStockPage` (3 tests) | ✅ |
| RF-6 Contador del menú | `app-sidebar` (6 tests) | ✅ |
| Baja de repuestos desde la interfaz (fuera de alcance actual) | — | ⚠️ la operación existe en la capa de datos pero **ninguna pantalla la ofrece** |

**Veredicto 006: ✅ Cumplida** en lo especificado; RF-1.1 sin test.

### Spec 007 · Portal del cliente

| RF | Test | Resultado |
| --- | --- | --- |
| RF-1 Consulta con el ticket | `TrackingForm`: "sends the normalized number and code and returns the status"; `CustomerPortalPage`: "looks up one order anonymously and lets the visitor search again" | ✅ |
| RF-2 Validación previa | "rejects a 4-digit PIN-like code before calling the API" | ✅ |
| RF-3.1, 3.2 Mensaje único y límite | "shows a single message for an unknown order or a wrong code (404)", "explains the rate limit and disables the button (429)" | ✅ |
| RF-3.3 Sin conexión | — | ⚠️ |
| RF-4.1 Vista del equipo | los tests de la página muestran estado y datos | ✅ |
| RF-4.2 Orden cancelada | — | ⚠️ |
| RF-4.3 Sin datos internos | — (la vista renderiza una lista fija de campos; sin test) | ⚠️ |
| RF-5 Cliente con cuenta | "lists every order of a logged-in customer, including cancelled ones (RN-14)", "tells a customer without orders and logs them out" | ✅ |
| RF-6.1 Enlace "Ingresar con mi cuenta" | — | ⚠️ |
| RF-6.2 Personal sin enlaces | "shows staff the public form without account links" | ✅ |
| RF-7 Ruta pública | `router`: redirecciones heredadas | ✅ |

**Veredicto 007: ✅ Cumplida en lo esencial**, con 4 huecos de prueba.

### Spec 008 · Administración

| RF | Test | Resultado |
| --- | --- | --- |
| RF-1 Lista, filtros, paginación | `UsersPage`: "lists every account…", "filters by text, role and status in the browser", "paginates long lists" | ✅ |
| RF-2 Alta y validaciones | "validates required fields and the password rules before sending", "creates the account, shows a toast and refreshes the list", "marks a taken username on the field (409)"; `admin-schemas` (usuario en minúsculas, símbolos, sin rol Cliente, contraseñas iguales) | ✅ |
| RF-3.1 Editar nombre/rol de otra persona | — | ⚠️ |
| RF-3.2, 3.3 Rol propio bloqueado; reiniciar contraseña | "locks the role when the admin edits their own account", "resets a password with the same rules as creation" | ✅ |
| RF-4.1, 4.2 Desactivar | "deactivates another user after confirming", "never offers to deactivate the signed-in admin" | ✅ |
| RF-4.3 Reactivar | — | ⚠️ |
| RF-5 Catálogo de modelos | `DeviceModelsPage`: agrupa, inactivos a pedido, filtra | ✅ |
| RF-6 Alta de modelos | 6 tests (obligatorios, duplicado sin mayúsculas, misma marca ajena, conserva marca, reutiliza escritura, 409 en campo); "deactivates a model and shows the feedback" | ✅ |
| RF-7 Acceso | `router`: anónimo al login, admin entra, `/administracion` abre usuarios, 404 interno | ✅ |

**Veredicto 008: ✅ Cumplida** (RF-3.1 y 4.3 sin test).

### Spec 009 · Panel de control

| RF | Test | Resultado |
| --- | --- | --- |
| RF-1.1 Indicadores | `DashboardPage`: "shows the workload counters from the summary and the stock alerts" | ✅ |
| RF-1.2, 1.3 Carga, error y resaltado | — | ⚠️ |
| RF-2 Accesos directos | "links to the filtered order list and to the inventory" | ✅ |
| RF-3 Cola por estado | "lists every status with a link to its queue" | ✅ |
| RF-4 Fallo con reintento | "offers a retry when the summary fails, keeping the stock counter" | ✅ |
| RF-5 Saludo y fecha | — | ⚠️ |
| RF-6 Acceso | `router`: "opens the dashboard at /" y técnico redirigido | ✅ |

**Veredicto 009: ✅ Cumplida** (RF-1.2, 1.3, 5 sin test).

### Spec 010 · Identidad visual

| RF | Comprobación | Resultado |
| --- | --- | --- |
| RF-1.2 Sin verde lima | `grep -rn "lime-" src` → 0 coincidencias | ✅ (verificación manual, sin test automático) |
| RF-1.1, 2, 3 Aplicación del acento y la estructura | build compila; 204 tests pasan con el nuevo aspecto | ✅ (sin test visual) |
| RF-2.4 Impresión | `print:hidden` en cabecera y menú (revisión de código) | ⚠️ sin test |
| RF-4.1 Controles de al menos 44 px | `grep -rn "min-h-\[3" src` → **5 coincidencias** (36 px): `UnlockCodeField`, chips de `WorkOrdersPage`, `DeviceModelPicker`, chips de `BudgetBuilder`, acción de `DeviceModelsPage` | ❌ |
| RF-4.2 320 px sin desplazamiento horizontal | — | ⚠️ no verificado |
| RF-4.3 Cajón móvil | "opens the mobile drawer and highlights only the exact menu item" | ✅ |
| RF-5 Contraste | — | ⚠️ no medido |

**Veredicto 010: ⚠️ Parcial.** RF-4.1 incumplido (H2) y buena parte de la spec solo se puede comprobar mirando la pantalla.

### Spec 011 · Cookie protegida (propuesta)

| RF | Comprobación | Resultado |
| --- | --- | --- |
| RF-4.1 Enviar cookies con las peticiones | `httpClient`: "sends credentials so the httpOnly refresh cookie can travel" | ✅ |
| RF-1, 2, 3, 4.2, 5 | `AuthProvider` aún guarda la credencial de renovación en `sessionStorage` | — (propuesta; no implementados) |

## 3. Hallazgos

| ID | Severidad | Dónde | Qué ocurre | Spec afectada |
| --- | --- | --- | --- | --- |
| **H1** | Media | `shared/api/httpClient.ts`, `shared/lib/utils.ts` (`cleanServerMessage`) | La interfaz solo quita códigos internos (`RN-09:`) de los mensajes del servidor y los muestra tal cual. Como casi todos están en **inglés** (ver backend H4), una persona verá, por ejemplo, "Only SENT budgets can be decided" o "Work order not found". Solo se traducen los 409 de usuario y de modelo | Todas; constitución C6.2 |
| **H2** | Baja | 5 controles | Miden 36 px, por debajo de los 44 px de la constitución (C7.2) | 010 RF-4.1 |
| **H3** | Baja | Capa de datos de inventario | Existe `deactivate` (y su *hook*) pero ninguna pantalla lo usa; el administrador no puede dar de baja un repuesto desde la interfaz | 006 |
| **H4** | Baja | Estado vacío del portal y mensajes de red | Varios comportamientos de pantalla no tienen test (ver ⚠️ de cada spec) | varias |

## 4. Reglas de la constitución

| Regla | Comprobación | Resultado |
| --- | --- | --- |
| C3.3 Toda petición por el cliente HTTP | `grep` de `fetch(` y `axios` fuera de `httpClient.ts` | ✅ ninguno |
| C5.2 Nunca `localStorage` | `grep` | ✅ solo aparece en un comentario |
| C5.2 Renovación solo en `sessionStorage` | `grep` | ✅ únicamente `AuthProvider` |
| C5.3 Código de desbloqueo sin `console` | `grep` de `console.log/debug/info` | ✅ ninguno |
| C1.1 Stack cerrado | `package.json` | ✅ sin librería de estado global ni kit de UI |
| C4.3 Lint, tipos y tests en commit y CI | hook pre-commit y workflows | ✅ |
| C6.2 Mensajes en español | revisión de mensajes propios | ✅ los de la interfaz; ❌ los que llegan del servidor sin traducir (H1) |
| C7.2 Controles de 44 px | `grep` | ❌ 5 excepciones (H2) |
| TypeScript sin `any` | `grep` | ✅ ninguno (solo aparece la palabra en dos comentarios) |

## 5. Veredicto

| Spec | Veredicto |
| --- | --- |
| 001 Sesión y navegación | ✅ Cumplida |
| 002 Recepción | ⚠️ Cumplida con huecos |
| 003 Listado y búsqueda | ✅ Cumplida |
| 004 Detalle de orden | ✅ Cumplida |
| 005 Presupuestos | ✅ Cumplida |
| 006 Inventario y alertas | ✅ Cumplida |
| 007 Portal del cliente | ✅ Cumplida en lo esencial |
| 008 Administración | ✅ Cumplida |
| 009 Panel de control | ✅ Cumplida |
| 010 Identidad visual | ⚠️ Parcial (RF-4.1 incumplido) |
| 011 Cookie protegida | — Propuesta |

**¿Está cumplida la spec del frontend? Sí en lo funcional, con dos salvedades.** Los 204 tests pasan y todos los requisitos de las specs 001 a 009 tienen cobertura, salvo unos 25 sub-requisitos de comportamiento menor que no tienen test. Pero **(1)** la constitución se incumple en C7.2 (5 controles de 36 px) y en C6.2 por los mensajes del servidor sin traducir (H1), y **(2)** la spec 010 depende de revisión visual que no se hizo en un celular real.
