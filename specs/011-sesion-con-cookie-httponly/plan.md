# Plan 011 · Sesión con cookie protegida (frontend)

Cumple la [constitución](../../docs/constitution.md) (C5.2 almacenamiento de la sesión, C3.3 todo por el cliente HTTP). Cubre RF-1 a RF-5 de [spec.md](spec.md). **Estado: propuesta**; solo RF-4.1 está implementado. Depende de la [spec 009 del backend](https://github.com/JulioOliva23/backPF/tree/main/specs/009-sesion-con-cookie-httponly).

## 1. Estructura de módulos

| Archivo (`src`) | Cambio propuesto | RF |
| --- | --- | --- |
| `features/auth/providers/AuthProvider.tsx` | Quitar `storage` (`sessionStorage`); `isLoading` inicial = «intentar restaurar»; `refreshSession` sin argumento | RF-1, RF-2, RF-3 |
| `features/auth/api/auth-service.ts` | `refresh()` y `logout()` sin cuerpo; `login` ignora `refreshToken` | RF-1, RF-2, RF-3 |
| `shared/api/httpClient.ts` | `withCredentials: true` ✅ ya hecho; cabecera `X-Requested-With: XMLHttpRequest` en `/auth/refresh` y `/auth/logout` | RF-4 |
| `features/auth/providers/AuthProvider.tsx` (arranque) | Borrar `servicio_refresh_token` si existe de versiones previas | RF-5.2 |
| `vercel.json` | Reescritura `/api/v1/*` → URL del servidor (si se adopta el dominio compartido) | RNF-3 |
| `shared/config/env.ts` | `VITE_API_URL` pasa a `/api/v1` en producción (mismo origen) | RNF-3 |

## 2. Modelo de datos

```json
{
  "antes": { "memoria": { "accessToken": "…" }, "sessionStorage": { "servicio_refresh_token": "eyJ…" } },
  "despues": { "memoria": { "accessToken": "…" }, "sessionStorage": {}, "cookie (HttpOnly, no visible al código)": "refresh_token=…" }
}
```

## 3. Algoritmos

```text
al arrancar:                                                     # RF-2, RF-5.2
  sessionStorage.removeItem("servicio_refresh_token")            # limpieza de versiones previas
  isLoading = true
  try  { resp = POST /auth/refresh  (sin cuerpo; el navegador envía la cookie)
         applySession(resp.accessToken) }                         # sin refreshToken
  catch { usuario = anónimo }                                     # RF-2.2: sin error visible
  isLoading = false

refreshOnce():                                                   # RF-2.3
  compartir UNA promesa en vuelo para todos los llamadores (StrictMode, 401 paralelos)
  # ya no hay token que comparar: la clave de la promesa en vuelo es única

login(u, p): resp = POST /auth/login ; setAuthToken(resp.accessToken)         # RF-1.2
logout():    POST /auth/logout (el servidor invalida y borra la cookie) ; setAuthToken(null) ; user = null   # RF-3

interceptor: para /auth/refresh y /auth/logout agregar "X-Requested-With: XMLHttpRequest"   # RF-4.2
```

## 4. Contrato de uso

| Acción | Antes | Después |
| --- | --- | --- |
| Restaurar sesión | `POST /auth/refresh {refreshToken}` | `POST /auth/refresh` (cookie + cabecera) |
| Cerrar sesión | `POST /auth/logout {refreshToken}` | `POST /auth/logout` (cookie + cabecera) |
| Iniciar sesión | recibe `{accessToken, refreshToken}` | recibe `{accessToken}` y `Set-Cookie` |

## 5. Decisiones técnicas

| Decisión | Justificación | Alternativa descartada |
| --- | --- | --- |
| Quitar por completo el almacenamiento de la credencial de renovación | Nada que robar desde la página (RNF-1) | Mantener `sessionStorage` "por si acaso": conserva la exposición |
| Arranque siempre intenta renovar | Sin token local no se puede saber si hay cookie | Preguntar al servidor solo si hay una marca local: reintroduce estado en el navegador |
| Servir la API bajo el dominio del frontend (rewrite de Vercel) | Evita cookies de terceros bloqueadas en Safari y modos de privacidad | `SameSite=None` entre dominios: frágil |
| Cabecera `X-Requested-With` | Defensa sencilla contra peticiones forzadas desde otros sitios (RF-4.2) | Tokens CSRF: más estado |
| Limpiar la clave antigua al arrancar | Quien tenía sesión no queda con una credencial muerta guardada | Dejarla hasta que expire la pestaña |
| Mantener el esquema anterior en paralelo durante la transición | Los dos despliegues no ocurren al mismo instante (RF-5.1) | Cambio simultáneo: ventana de errores |

## 6. Estrategia de tests

| Nivel | Test propuesto | RF |
| --- | --- | --- |
| `httpClient.test.ts` | «sends credentials so the httpOnly refresh cookie can travel» ✅ existe | RF-4.1 |
| `httpClient.test.ts` | Las peticiones de refresh/logout llevan `X-Requested-With` | RF-4.2 |
| `AuthProvider.test.tsx` | Al iniciar sesión, `sessionStorage` queda sin credencial de renovación | RF-1 |
| `AuthProvider.test.tsx` | El arranque llama a refresh sin cuerpo y restaura la sesión | RF-2.1 |
| `AuthProvider.test.tsx` | Si refresh falla, queda anónimo sin error visible | RF-2.2 |
| `AuthProvider.test.tsx` | Bajo StrictMode se hace una sola llamada de refresh | RF-2.3 (ya cubierto en su forma actual) |
| `AuthProvider.test.tsx` | Se borra una clave `servicio_refresh_token` heredada | RF-5.2 |
| Manual | Iniciar sesión, recargar y comprobar la sesión en producción | criterio de finalización |
