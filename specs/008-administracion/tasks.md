# Tareas 008 · Administración de usuarios y modelos de equipos

Leyenda: `[x]` hecha · `[~]` parcial · `[ ]` pendiente.

- [x] **T1 · Esquemas de usuario (usuario, contraseña, roles de personal)** — RF-2
  Hecho cuando: pasan "normalizes the username to lowercase", "rejects usernames with spaces or symbols", "never offers the CUSTOMER role (RN-14)" y "requires both passwords to match".
- [x] **T2 · Lista de usuarios con filtros y paginación** — RF-1
  Hecho cuando: pasan "lists every account…", "filters by text, role and status in the browser" y "paginates long lists".
- [x] **T3 · Alta de usuario con avisos y error 409** — RF-2.5, RF-2.6
  Hecho cuando: pasan "creates the account, shows a toast and refreshes the list" y "marks a taken username on the field (409)".
- [x] **T4 · Edición con rol bloqueado para la cuenta propia** — RF-3.2
  Hecho cuando: pasa "locks the role when the admin edits their own account".
- [x] **T5 · Reinicio de contraseña** — RF-3.3
  Hecho cuando: pasa "resets a password with the same rules as creation".
- [x] **T6 · Desactivación con confirmación y protección de la cuenta propia** — RF-4.1, RF-4.2
  Hecho cuando: pasan "deactivates another user after confirming" y "never offers to deactivate the signed-in admin".
- [x] **T7 · Catálogo de modelos agrupado y filtrable** — RF-5
  Hecho cuando: pasan "groups active models by brand, sorted by brand and model", "shows deactivated models on demand" y "filters the catalog in the browser by brand or model".
- [x] **T8 · Alta de modelos con detección de duplicados** — RF-6.1 a RF-6.6
  Hecho cuando: pasan los 6 tests de alta de `DeviceModelsPage.test.tsx` y los de duplicados de `admin-schemas.test.ts`.
- [x] **T9 · Desactivar un modelo con aviso** — RF-6.7
  Hecho cuando: pasa "deactivates a model and shows the feedback".
- [x] **T10 · Rutas protegidas para administradores** — RF-7
  Hecho cuando: pasan los 4 tests de administración de `router.test.tsx`.
- [x] **T11 · Reactivar usuarios** — RF-4.3
  Hecho cuando: un test reactiva una cuenta inactiva tras confirmar.
  *Evidencia: `UsersPage.test` "reactivates an inactive account after confirming [008/RF-4.3]".*
- [x] **T12 · Test de edición de nombre y rol de otra persona** — RF-3.1
  Hecho cuando: se cambia el rol de un técnico a recepción y la lista se actualiza.
  *Evidencia: `UsersPage.test` "changes the name and the role of another staff member [008/RF-3.1]".*
- [x] **T13 · Test de acceso por rol a la sección** — RF-7.1
  Hecho cuando: recepción y técnico no ven "Administración" ni acceden a la ruta.
  *Evidencia: `router.test` "keeps reception out of the admin section and sends it to its own landing page [008/RF-7.1]" y `navigation.test` (la sección solo se ofrece al administrador).*
- [ ] **T14 · Responder dudas abiertas (editar marca/modelo, último administrador)** — dudas abiertas
  Hecho cuando: el cliente decide y las reglas quedan escritas como RF.
