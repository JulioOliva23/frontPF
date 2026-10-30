# Plan 007 · Portal del cliente

Cumple la [constitución](../../docs/constitution.md) (C3.1 reglas puras de formato, C5.3 datos sensibles, C7.1 estados de la pantalla). Cubre RF-1 a RF-7 de [spec.md](spec.md).

## 1. Estructura de módulos

| Archivo (`src`) | Responsabilidad | RF |
| --- | --- | --- |
| `features/customer-portal/pages/CustomerPortalPage.tsx` | Elige entre formulario, resultado y lista de la cuenta; cabecera propia | RF-1.3, RF-5, RF-6 |
| `features/customer-portal/components/TrackingForm.tsx` | Formulario, envío, errores, enfriamiento de 60 s | RF-1, RF-2, RF-3 |
| `features/customer-portal/schemas/tracking-schema.ts` | Normaliza y valida número y código | RF-1.2, RF-2 |
| `features/customer-portal/lib/tracking-messages.ts` | Mensajes únicos y tiempo de espera | RF-3 |
| `features/customer-portal/components/CustomerOrderStatus.tsx` | Vista de una orden (solo campos del DTO del cliente) | RF-4 |
| `features/customer-portal/api/customer-portal-api.ts` | `track` (público) y `mine` | RF-1, RF-5 |
| `shared/lib/tracking-code.ts` | `normalizeTrackingCode`, `TRACKING_CODE_PATTERN`, `parseWorkOrderNumber` (copia del dominio del backend) | RF-1.2, RF-2 |
| `shared/components/StatusTimeline.tsx` | Avance por etapas | RF-4.1 |

## 2. Modelo de datos

Entrada del formulario → solicitud (normalizada por zod):

```json
{ "number": "OT-000123", "trackingCode": "k7qm-3xpa" }
→ { "number": 123, "trackingCode": "K7QM3XPA" }
```

Respuesta mostrada (`CustomerWorkOrderStatus`, solo estos campos):

```json
{
  "id": "…", "number": 123, "status": "IN_REPAIR", "statusLabel": "En Reparación",
  "device": "Apple iPhone 13", "promisedAt": "2026-10-25T18:00:00.000Z",
  "budgetTotal": "1130.00", "updatedAt": "2026-10-20T15:31:08.000Z"
}
```

## 3. Algoritmos

```text
trackingSchema:                                                  # RF-1.2, RF-2
  number:       trim → parseWorkOrderNumber ("OT-000123" | "000123" | "123" → 123)
                → entero >= 1, si no "Número de orden inválido (ej. OT-000123)"
  trackingCode: normalizeTrackingCode (quita espacios y guion, mayúsculas)
                → /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/, si no "El código tiene 8 caracteres"

enviar(valores):
  if !schema.valid: mostrar errores, no llamar a la red                       # RF-2
  resultado = POST /public/tracking {number, trackingCode}
  404 → TRACKING_MESSAGES.notFound (el mismo texto, nunca distingue)           # RF-3.1
  429 → TRACKING_MESSAGES.rateLimited ; botón deshabilitado 60 s              # RF-3.2
  error de red → TRACKING_MESSAGES.network                                     # RF-3.3
  éxito → onFound(resultado)

página:
  if user.role == CUSTOMER: saludo + GET /work-orders/mine → lista | vacío     # RF-5
  else if found: <CustomerOrderStatus/> + "Consultar otra orden"
  else: formulario ; si !user: enlace "Ingresar con mi cuenta"                 # RF-6
```

## 4. Contrato de uso

| Pantalla | Acción | Llamada |
| --- | --- | --- |
| `/portal-cliente` (público) | Consultar con el ticket | `POST /public/tracking` (sin sesión, 5/min por IP) |
| | Con sesión de cliente | `GET /work-orders/mine` |
| | Cerrar sesión | `POST /auth/logout`, luego vuelve al formulario |
| `/tracking` | — | Redirige a `/portal-cliente` |

## 5. Decisiones técnicas

| Decisión | Justificación | Alternativa descartada |
| --- | --- | --- |
| Normalizar y validar antes de enviar | Cada intento fallido cuenta contra el límite del servidor; no se gastan con errores de tipeo | Enviar todo y mostrar el error del servidor |
| Un solo mensaje de "no encontrado" | No revela qué números existen (RNF-1) | Mensajes distintos para número y código |
| Enfriamiento visible de 60 s ante 429 | El cliente entiende que debe esperar y no insiste | Mostrar solo el error |
| Rechazar códigos de 4 dígitos | Evita que el cliente escriba el PIN de su celular por confusión | Aceptarlo y dejar que falle |
| Copia de las utilidades de código del backend | Mismas reglas de formato en ambos lados | Reimplementar |
| Página fuera del *layout* de personal | El cliente no ve menú de personal ni rutas ajenas | Reutilizar el layout con menú vacío |
| Mostrar solo los campos del DTO del cliente | Un campo nuevo del servidor nunca se muestra por accidente | Renderizar el objeto completo |

## 6. Estrategia de tests

| Archivo | Tests | RF |
| --- | --- | --- |
| `TrackingForm.test.tsx` | envía número y código normalizados y devuelve el estado · un solo mensaje ante 404 · explica el límite y desactiva el botón (429) · rechaza un código de 4 dígitos antes de llamar | RF-1, RF-2.2, RF-3.1, RF-3.2 |
| `CustomerPortalPage.test.tsx` | consulta anónima y "consultar otra" · lista las órdenes del cliente incluidas las canceladas · cliente sin órdenes y cierre de sesión · el personal ve el formulario sin enlaces de cuenta | RF-1.3, RF-5, RF-6.2 |
| Pendiente | Mensaje de red caída | RF-3.3 |
| Pendiente | Orden cancelada muestra el aviso de retiro | RF-4.2 |
| Pendiente | Enlace "Ingresar con mi cuenta" solo para anónimos | RF-6.1 |
| Pendiente | La vista no muestra campos internos aunque el servidor los enviara | RF-4.3 |
