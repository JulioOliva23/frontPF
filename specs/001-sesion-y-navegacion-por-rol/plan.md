# Plan 001 · Sesión y navegación por rol

Cumple la [constitución](../../docs/constitution.md) (C3.4 RBAC visual, C3.3 todo por el cliente HTTP, C5.2 almacenamiento de la sesión). Cubre RF-1 a RF-8 de [spec.md](spec.md).

## 1. Estructura de módulos

| Archivo (`src`) | Responsabilidad | RF |
| --- | --- | --- |
| `features/auth/pages/LoginPage.tsx` · `schemas/login-schema.ts` | Formulario, validación zod y mensajes de error | RF-1 |
| `features/auth/providers/AuthProvider.tsx` · `auth-context.ts` · `hooks/useAuth.ts` | Estado de sesión, almacenamiento de la credencial, renovación única compartida | RF-5, RF-6 |
| `features/auth/api/auth-service.ts` | Llamadas de login, refresh, logout | RF-1, RF-5, RF-6 |
| `features/auth/config/role-routes.ts` | Rutas de llegada por rol, grupos de roles, validación de la ruta de retorno | RF-2, RF-4 |
| `features/auth/components/RoleGuard.tsx` | Guarda de ruta por rol | RF-4 |
| `app/navigation.tsx` · `app-sidebar.tsx` · `app-layout.tsx` | Menú filtrado por rol, cajón móvil | RF-3, RF-8 |
| `app/router.tsx` · `admin-routes.tsx` | Mapa de rutas con carga perezosa y redirecciones heredadas | RF-4, RF-7.4 |
| `app/session-expiry.ts` | Lleva al login al caducar la sesión | RF-5.4 |
| `app/errors/` (`NotFoundPage`, `RouteErrorBoundary`, `chunk-load-error`) | 404 y recuperación de fallos | RF-7 |
| `shared/api/httpClient.ts` | Interceptores: bearer, 401 → renovación única + cola | RF-5.3 a RF-5.6 |

## 2. Modelo de datos

Estado de sesión (memoria) y almacenamiento:

```json
{
  "memoria": {
    "accessToken": "eyJ…",
    "user": { "id": "6f1c…", "fullName": "Técnico Uno", "username": "tecnico01", "role": "TECHNICIAN" }
  },
  "sessionStorage": { "servicio_refresh_token": "eyJ…" },
  "estadoDeNavegacion": { "from": "/ordenes/8a1…", "reason": "session-expired" }
}
```

Rutas de llegada: `ADMIN`/`RECEPTIONIST` → `/` · `TECHNICIAN` → `/ordenes` · `CUSTOMER` → `/portal-cliente`.

## 3. Algoritmos

```text
refreshOnce(token):                                             # RF-5.1, RF-5.3
  if inFlight.token != token: inFlight = {token, promise: authService.refresh(token)}
  return inFlight.promise                       # StrictMode y 401 paralelos comparten UNA renovación

al arrancar:
  isLoading = existeRefreshGuardado()                           # RF-5.2: sin token → anónimo directo
  if isLoading: refreshSession()

interceptor de respuesta (401):                                 # RF-5.3 – RF-5.5
  if 401 and !_retry and !esLlamadaDeAuth(request) and hayToken:
      ok = await refreshOnce()                  # compartida entre todas las peticiones
      if ok: reintentar con el token nuevo (una vez)
      else:  avisarSesionExpirada()             # una sola vez
  else: rechazar con ApiError
interceptor de petición:
  if renovando and !esLlamadaDeAuth: await renovación                  # RF-5.6

readLoginRedirectState(state):                                  # RF-4.3
  from válido si empieza con "/" y no con "//" y no es el login

RoleGuard(allowedRoles):                                        # RF-4
  if !sesión: navegar(LOGIN, {from: ubicaciónActual})
  if rol ∉ allowedRoles: navegar(ROLE_DEFAULT_ROUTE[rol])

navItemsForRole(rol): NAV_ITEMS.filter(item => item.roles.includes(rol))   # RF-3
```

## 4. Contrato de uso

| Pantalla / ruta | Roles | Resultado |
| --- | --- | --- |
| `/auth/login` | Público | Formulario; al éxito, ruta de llegada o `from` |
| `/` | Admin, Recepción | Panel (spec 009) |
| `/ordenes` y detalle | Staff | spec 003 y 004 |
| `/presupuestos`, `/inventario*`, `/ordenes/nueva` | Admin, Recepción | specs 002, 005, 006 |
| `/administracion/*` | Admin | spec 008 |
| `/portal-cliente` | Público y Cliente | spec 007 |
| `*` | Todos | 404 con navegación |
| `/login`, `/tracking` | Todos | Redirigen a `/auth/login` y `/portal-cliente` |

API usada: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` (backend, spec 001).

## 5. Decisiones técnicas

| Decisión | Justificación | Alternativa descartada |
| --- | --- | --- |
| Acceso en memoria + renovación en `sessionStorage` | Menos exposición que un almacenamiento persistente; se cierra con la pestaña (C5.2) | `localStorage`: sobrevive y es legible por cualquier script |
| Una renovación compartida por token | El servidor rota y revoca la familia si ve reutilización: dos renovaciones paralelas romperían la sesión | Renovar por petición: cierres de sesión espurios |
| Cola de peticiones durante la renovación | Evita 401 en cascada con la credencial vieja | Dejar fallar y reintentar: tormenta de errores |
| `RoleGuard` + menú desde la misma tabla de roles | Menú y rutas no se desalinean (C3.4) | Listas duplicadas |
| Carga perezosa por ruta + pantalla "recargar" | Bundle inicial pequeño; los despliegues nuevos no dejan la página en blanco | Un solo bundle: arranque más lento |
| `RouteErrorBoundary` por árbol de rutas | Un fallo de una pantalla no tumba el menú | Un único *boundary* en la raíz |

## 6. Estrategia de tests

| Nivel | Tests | RF |
| --- | --- | --- |
| `LoginPage.test.tsx` | validación previa · mensaje del servidor · espera por límite · mensaje genérico | RF-1.1 a RF-1.4 |
| `login-schema.test.ts` | válido · vacío · usuario largo · contraseña vacía | RF-1.1 |
| `AuthProvider.test.tsx` | una sola renovación bajo StrictMode · anónimo sin sesión | RF-5.1, RF-5.2 |
| `httpClient.test.ts` | credenciales con la petición · renovación compartida · cola · aviso único · 401 anónimo sin aviso · el login fallido no renueva · reintento una vez | RF-5.3 a RF-5.6 |
| `RoleGuard.test.tsx` | técnico fuera de presupuestos · anónimo al login · cliente al portal | RF-4 |
| `navigation.test.ts` · `app-sidebar.test.tsx` | menú del técnico, de recepción/admin, sección de administración, cliente sin enlaces, ítem padre no resaltado | RF-3 |
| `router.test.tsx` | 404 con y sin sesión · panel en `/` · administración protegida · fallo de pantalla · fallo de módulo · retorno con ruta interna · redirecciones heredadas · cajón móvil | RF-2, RF-4, RF-7, RF-8 |
| `LoginPage.test.tsx` | indicador "Ingresando…" y una sola petición aunque se pulse otra vez | RF-1.5 |
| `AuthProvider.test.tsx` + `router.test.tsx` | cierra en el servidor, borra el almacenamiento, queda anónimo y navega al login | RF-6.1 |
