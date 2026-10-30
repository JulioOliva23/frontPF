# Plan 002 · Recepción del equipo (pantalla de ingreso)

Cumple la [constitución](../../docs/constitution.md) (C3.1 reglas puras, C5.3 código de desbloqueo, C7.3 validación antes de enviar). Cubre RF-1 a RF-7 de [spec.md](spec.md).

## 1. Estructura de módulos

| Archivo (`src`) | Responsabilidad | RF |
| --- | --- | --- |
| `shared/lib/imei.ts` | Copia exacta del dominio del backend: `normalizeImei`, `isValidImei`, `formatImei` | RF-1 |
| `features/work-orders/schemas/check-in-schema.ts` | Esquema zod del ingreso, reglas del código según el bloqueo, armado del *payload* | RF-1.2, RF-3, RF-4 |
| `features/work-orders/pages/CheckInPage.tsx` | Formulario (react-hook-form), historial, ticket final | RF-1 a RF-6 |
| `features/work-orders/components/CosmeticChecklist.tsx` | Estado de las cinco zonas | RF-3.1 |
| `features/work-orders/components/UnlockCodeField.tsx` · `PatternGrid.tsx` | Campo enmascarado y cuadrícula de patrón | RF-4 |
| `features/work-orders/components/DeviceHistoryPanel.tsx` | Reparaciones previas | RF-2 |
| `features/work-orders/components/IntakeTicket.tsx` | Ticket con número y código de seguimiento, imprimible | RF-5 |
| `features/work-orders/hooks/use-work-orders.ts` · `api/work-orders-api.ts` | `useCreateWorkOrder`, `useDeviceHistory`, `useDeviceModels` | RF-2, RF-5, RF-6 |
| `features/inventory/components/DeviceModelPicker.tsx` | Selector marca/modelo | RF-3.1 |
| `shared/lib/use-debounced-callback.ts` | Pausa de tecleo para la consulta de historial | RF-2.1 |

## 2. Modelo de datos

*Payload* enviado al servidor (sin campos vacíos y sin código si no hay bloqueo):

```json
{
  "customer": { "identification": "5123456", "name": "María Quispe", "phone": "+591 71234567" },
  "device": { "imei": "356938035643809", "deviceModelId": "8c1d…", "color": "Negro" },
  "reportedProblem": "No carga y la pantalla está fisurada",
  "batteryLevel": 12,
  "cosmeticCheckIn": { "screen": "CRACKED", "backCover": "OK", "frame": "SCRATCHED", "cameraLens": "OK", "buttons": "OK", "notes": "Golpe en la esquina" },
  "lockType": "PATTERN",
  "unlockCode": "1-5-9-6",
  "promisedAt": "2026-10-25T18:00:00.000Z"
}
```

Respuesta mostrada en el ticket: `{ number: 123, trackingCode: "K7QM-3XPA", … }` (el código no se vuelve a pedir).

## 3. Algoritmos

```text
al escribir el IMEI:                                            # RF-1
  digits = normalizeImei(valor)         # quita espacios y guiones
  mostrar formatImei(digits)            # "35 209900 176148 1"
  error = !/^\d{15}$/.test(digits) ? "El IMEI tiene 15 dígitos"
        : !isValidImei(digits)    ? "IMEI inválido: el dígito verificador no coincide" : none
  history.enabled = isValidImei(digits)
  debounce(consultarHistorial(digits)); un 404 se trata como "equipo nuevo"    # RF-2

reglas del código según lockType:                               # RF-4
  NONE: sin campo, payload sin unlockCode
  PIN: /^\d{4,16}$/ · PATTERN: /^[1-9](-[1-9]){3,8}$/ (≥4 puntos) · PASSWORD: 1–64

buildPayload(values):                                           # RF-3, RF-4.3
  quitar cadenas vacías; batteryLevel '' → omitido; promisedAt '' → omitido, si no ISO
  unlockCode = lockType == NONE ? omitido : valor

enviar():                                                       # RF-1.2, RF-6
  if !schema.valid: mostrar errores y salir               # no hay petición
  mutate(payload) con botón deshabilitado mientras isPending
  onSuccess: mostrar IntakeTicket(number, trackingCode)         # RF-5.1
  onError:   mostrar mensaje del servidor, conservar el formulario  # RF-6.1
```

## 4. Contrato de uso

| Pantalla | Acción | Llamada al backend |
| --- | --- | --- |
| `/ordenes/nueva` (Admin, Recepción) | Escribir IMEI válido | `GET /devices/by-imei/:imei` (200 historial · 404 nuevo) |
| | Cargar modelos | `GET /device-models` |
| | Registrar | `POST /work-orders` → orden + `trackingCode` · 409 conflicto de modelo · 422 |
| | Imprimir | `window.print()`; menú y botones ocultos con `print:hidden` |

## 5. Decisiones técnicas

| Decisión | Justificación | Alternativa descartada |
| --- | --- | --- |
| Copia verbatim del IMEI del backend con los mismos tests | Cliente y servidor aceptan exactamente lo mismo | Reimplementar: se desalinean |
| Validar en el esquema zod antes de enviar | Respuesta inmediata y menos carga al servidor (C7.3) | Dejar que el servidor valide y mostrar su error |
| Historial con *debounce* y solo con IMEI válido | No consulta en cada tecla ni con valores incompletos | Consultar siempre: ruido y límites de uso |
| Un 404 de historial no es error | Es el caso normal de un equipo nuevo | Mostrar "no encontrado": confunde al mostrador |
| Cuadrícula 3×3 para el patrón | Es como la persona lo conoce en su celular | Texto libre `1-5-9`: errores de tipeo |
| Código enmascarado por defecto con interruptor | Privacidad ante quien mira la pantalla (RNF-2) | Texto visible siempre |
| Ticket con `print:hidden` en el *layout* | Imprime solo lo necesario sin generar PDF en el servidor | Servicio de impresión |

## 6. Estrategia de tests

| Nivel | Tests | RF |
| --- | --- | --- |
| `imei.test.ts` | dígito erróneo y entradas mal formadas · normalización y formato | RF-1 |
| `check-in-schema.test.ts` | IMEI con formato válido · dígito erróneo antes de enviar · patrón de 4 nodos y sin bloqueo · batería y fecha pasada · *payload* sin vacíos ni código para NONE | RF-1, RF-3, RF-4.3 |
| `CheckInPage.test.tsx` | IMEI inválido en tiempo real sin llamar a la API · formato mientras se escribe · PIN enmascarado y ticket con código de seguimiento | RF-1, RF-4.1, RF-5 |
| `use-debounced-callback.test.ts` | una sola llamada con los últimos argumentos · cancelación · no dispara tras desmontar · usa el *callback* más reciente | RF-2.1 |
| Pendiente | Historial de reparaciones al ingresar un IMEI conocido; 404 sin error | RF-2 |
| Pendiente | Error del servidor conserva el formulario; botón deshabilitado al enviar | RF-6 |
| Pendiente | El técnico no accede a la pantalla | RF-7 |
