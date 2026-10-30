# Plan 008 · Administración de usuarios y modelos de equipos

Cumple la [constitución](../../docs/constitution.md) (C3.1 reglas puras en `schemas/`, C3.4 el servidor autoriza, C7.3 validación previa). Cubre RF-1 a RF-7 de [spec.md](spec.md).

## 1. Estructura de módulos

| Archivo (`src`) | Responsabilidad | RF |
| --- | --- | --- |
| `app/admin-routes.tsx` · `app/router.tsx` | Rutas `/administracion/usuarios` y `/modelos` bajo `RoleGuard(ADMIN)`; 404 interno | RF-7 |
| `features/admin/pages/UsersPage.tsx` | Lista, filtros en el navegador, paginación, acciones por fila | RF-1, RF-3.2, RF-4 |
| `features/admin/components/CreateUserModal.tsx` · `EditUserModal.tsx` · `ResetPasswordModal.tsx` · `UserStatusModal.tsx` | Alta, edición, reinicio de contraseña, (des)activación | RF-2, RF-3, RF-4 |
| `features/admin/schemas/user-schemas.ts` | Esquemas zod: usuario, contraseña, confirmación, roles de personal | RF-2.2 a RF-2.4 |
| `features/admin/pages/DeviceModelsPage.tsx` | Catálogo agrupado por marca, filtros, inactivos a pedido | RF-5, RF-6.7 |
| `features/admin/components/DeviceModelQuickAdd.tsx` | Alta rápida con marca recordada | RF-6 |
| `features/admin/schemas/device-model-schema.ts` | Esquema, clave de duplicado, agrupación, marca canónica, búsqueda | RF-5, RF-6 |
| `features/admin/hooks/use-admin.ts` · `api/admin-api.ts` | Consultas y mutaciones | todos |

## 2. Modelo de datos

```json
{
  "UserResponse": { "id": "6f1c…", "username": "tecnico01", "fullName": "Técnico Uno", "role": "TECHNICIAN", "isActive": true },
  "CreateUserPayload": { "username": "tecnico03", "fullName": "Técnico Tres", "role": "TECHNICIAN", "password": "Clave2026Segura" },
  "DeviceModel": { "id": "8c1d…", "brand": "Apple", "model": "iPhone 13", "isActive": true }
}
```

`confirmPassword` solo existe en el formulario y nunca se envía.

## 3. Algoritmos

```text
createUserSchema:                                                # RF-2
  username: trim → minúsculas → /^[a-z0-9._-]{3,80}$/
  password: 10–128, con [a-z], [A-Z] y \d ; confirmPassword == password
  role ∈ {ADMIN, RECEPTIONIST, TECHNICIAN}        # CUSTOMER no se ofrece (RN-14)

filtrar usuarios (en el navegador, sobre includeInactive=true):  # RF-1.2
  texto ∈ username|fullName (sin mayúsculas) ∧ rol ∧ estado ; luego paginar

acciones por fila:
  si entry.id == user.id: sin "Desactivar" (etiqueta "No puedes desactivar tu propia cuenta")  # RF-4.2
  EditUserModal: omite el rol si es la cuenta propia o un cliente                              # RF-3.2

modelKey(brand, model) = lower(trim(brand)) + "\0" + lower(trim(model))      # RF-6.2
deviceModelSchema(catálogo): marca 2–60, modelo 1–80 ; error en 'model' si modelKey ∈ catálogo (incluidos inactivos)

groupByBrand(modelos):                                           # RF-5.1
  agrupar por marca sin distinguir mayúsculas ; la primera escritura nombra el grupo
  ordenar con Intl.Collator("es", {sensitivity: "base", numeric: true})

canonicalBrand(texto, catálogo): reutiliza la escritura existente de la marca     # RF-6.5

alta de modelo: POST ; 409 → error en el campo modelo ; éxito: conservar marca, limpiar modelo, refrescar   # RF-6.4, RF-6.6
```

## 4. Contrato de uso

| Pantalla | Acción | Llamada (solo Admin) |
| --- | --- | --- |
| `/administracion/usuarios` | Listar (con inactivos) | `GET /users?includeInactive=true` |
| | Crear / editar | `POST /users` · `PATCH /users/:id` |
| | Reiniciar contraseña | `POST /users/:id/password` |
| | Desactivar / reactivar | `DELETE /users/:id` · `POST /users/:id/activate` |
| `/administracion/modelos` | Listar (con inactivos) | `GET /device-models?includeInactive=true` |
| | Crear / desactivar | `POST /device-models` · `PATCH /device-models/:id {isActive}` |

## 5. Decisiones técnicas

| Decisión | Justificación | Alternativa descartada |
| --- | --- | --- |
| Cargar todo con `includeInactive` y filtrar en el navegador | Catálogo y plantilla pequeños; filtros instantáneos (RNF-3) | Filtros en el servidor: una espera por cada cambio |
| Detectar el duplicado antes de enviar con la misma clave que el servidor | El administrador se entera al instante; el servidor sigue siendo la garantía final (409) | Esperar el 409 |
| Marca canónica y agrupación sin distinguir mayúsculas | Evita "apple" y "Apple" como marcas distintas | Respetar tal cual lo escrito |
| Orden natural (`numeric: true`) | "iPhone 9" antes que "iPhone 10" | Orden alfabético simple |
| No ofrecer el rol Cliente | Esas cuentas se vinculan a un cliente real; no se crean aquí (RN-14) | Permitirlo y que el servidor falle |
| Confirmación para desactivar y reactivar | Acción con consecuencias para otra persona | Un clic directo |
| Ocultar la acción propia en vez de mostrarla desactivada sin explicación | Evita un error que el servidor igual rechazaría (RN-14/spec 002) | Dejarlo y mostrar el 422 |

## 6. Estrategia de tests

| Archivo | Tests | RF |
| --- | --- | --- |
| `UsersPage.test.tsx` | lista con usuario, rol y estado · filtros por texto/rol/estado · paginación · validación previa de campos y contraseña · alta con aviso y actualización · usuario ocupado (409) · desactivar tras confirmar · no ofrece desactivar al propio admin · bloquea el rol propio · reinicia contraseña | RF-1 a RF-4 |
| `DeviceModelsPage.test.tsx` | agrupa por marca ordenado · inactivos a pedido · filtra en el navegador · desactiva con aviso · exige marca y modelo · rechaza duplicado ignorando mayúsculas y espacios · acepta el nombre bajo otra marca · agrega conservando marca y refresca · reutiliza la escritura de la marca · muestra el 409 en el campo | RF-5, RF-6 |
| `admin-schemas.test.ts` | usuario a minúsculas · rechaza espacios y símbolos · nunca ofrece CUSTOMER · confirma contraseña · edición sin rol · agrupa sin distinguir mayúsculas y orden natural · duplicado también contra inactivos · búsqueda por marca y modelo | RF-2, RF-5, RF-6 |
| `router.test.tsx` | anónimo al login desde `/administracion/*` · el admin entra · `/administracion` abre usuarios · pantalla desconocida da 404 | RF-7 |
| Pendiente | Editar nombre/rol de otra persona | RF-3.1 |
| Pendiente | Reactivar una cuenta | RF-4.3 |
