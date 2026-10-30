# Plan 006 · Inventario de repuestos y alertas de stock

Cumple la [constitución](../../docs/constitution.md) (C3.4 servidor decide permisos, C7.1 estados de carga/vacío/error, C5.1 servidor como fuente de verdad). Cubre RF-1 a RF-6 de [spec.md](spec.md).

## 1. Estructura de módulos

| Archivo (`src`) | Responsabilidad | RF |
| --- | --- | --- |
| `features/inventory/pages/InventoryPage.tsx` | Catálogo con filtros, acciones según rol | RF-1, RF-2 |
| `features/inventory/components/SparePartFormModal.tsx` · `schemas/spare-part-schema.ts` | Alta/edición; SKU a mayúsculas; SKU no editable | RF-3.1 a RF-3.3 |
| `features/inventory/components/CompatibilityModal.tsx` · `DeviceModelPicker.tsx` | Modelos compatibles (editable solo para admin) | RF-3.4 |
| `features/inventory/components/StockMovementModal.tsx` | Entrada y ajuste, con errores del servidor | RF-4 |
| `features/inventory/components/StockBadge.tsx` | Señal visual del nivel de stock | RF-1.1 |
| `features/inventory/pages/LowStockPage.tsx` | Lista de alertas | RF-5 |
| `features/inventory/hooks/use-spare-parts.ts` · `api/spare-parts-api.ts` | `useSpareParts`, `useLowStock`, mutaciones | todos |
| `app/nav-badge.tsx` · `app-sidebar.tsx` | Contador en el menú | RF-6 |

## 2. Modelo de datos

Repuesto recibido (el servidor omite campos según el rol):

```json
{
  "id": "5b2e…", "sku": "OLED-IP13", "name": "Pantalla OLED iPhone 13", "category": "DISPLAY_OLED",
  "unitCost": "620.00", "workshopPrice": "980.00",
  "physicalStock": 5, "reservedStock": 2, "availableStock": 3, "minStock": 2, "lowStock": false,
  "compatibleDeviceModelIds": ["8c1d…"]
}
```

Para recepción llega sin `unitCost`; el técnico no usa esta pantalla. Filtros: `?search=&category=&deviceModelId=&page=&pageSize=`.

## 3. Algoritmos

```text
columnas y acciones por rol:                                     # RF-2
  ADMIN:        costo + [Compatibilidad] [Entrada] [Ajuste] [Editar] + [Nuevo repuesto]
  RECEPTIONIST: sin costo, [Compatibilidad en solo lectura] [Entrada]

crear(valores):                                                  # RF-3.1
  payload = {..., sku: valores.sku.trim().toUpperCase()} ; POST
  409 → "SKU ya existe" junto al campo
editar(valores): payload sin sku                                 # RF-3.3

movimiento(kind, quantity, reason):                              # RF-4
  entrada:  POST stock-entries ; error → mostrar mensaje
  ajuste:   POST adjustments {delta, reason}
            422 por reservadas → "No se puede dar de baja lo que está reservado"   # RF-4.2

contador del menú:                                               # RF-6
  if rol ∈ {ADMIN, RECEPTIONIST}: n = useLowStock().data.length
  texto = n > 99 ? "99+" : String(n) ; singular si n == 1
  if n == 0 or error: no renderizar
  rol TECHNICIAN: la consulta está deshabilitada (no se pide)
```

## 4. Contrato de uso

| Pantalla | Acción | Llamada |
| --- | --- | --- |
| `/inventario` (Admin, Recepción) | Listar/filtrar | `GET /spare-parts?…` |
| | Crear / editar | `POST /spare-parts` · `PATCH /spare-parts/:id` (Admin) |
| | Compatibilidad | `PATCH /spare-parts/:id {compatibleDeviceModelIds}` (Admin) |
| | Entrada / ajuste | `POST /spare-parts/:id/stock-entries` · `/adjustments` (ajuste: Admin) |
| `/inventario/alertas` | Alertas | `GET /spare-parts/alerts/low-stock` |
| Menú | Contador | misma ruta de alertas, `staleTime` corto |

## 5. Decisiones técnicas

| Decisión | Justificación | Alternativa descartada |
| --- | --- | --- |
| Filtros enviados al servidor | La lista es paginada y los resultados deben ser completos | Filtrar la página cargada |
| Ocultar acciones por rol y confiar en el servidor para negar | Evita botones que fallarían, sin duplicar permisos (C3.4) | Mostrar todo y mostrar 403 |
| SKU normalizado en el cliente y no editable | Menos conflictos por mayúsculas y SKU estable | Normalizar solo en el servidor |
| Contador reutiliza la consulta de alertas | Una sola fuente de la verdad del "stock bajo" (RNF-3) | Calcular `available <= min` en el navegador |
| Mostrar disponible, reservado y físico | El técnico y recepción no prometen piezas reservadas | Mostrar solo el físico |
| Sin llamar a alertas si el rol es técnico | Evita un 403 inútil por cada vista | Llamar y esconder el error |

## 6. Estrategia de tests

| Archivo | Tests | RF |
| --- | --- | --- |
| `InventoryPage.test.tsx` | lista sin costos ni acciones de admin · envía búsqueda, categoría y modelo · vacío y error · crea (SKU normalizado) · SKU duplicado · edita sin enviar SKU · compatibilidad editable/solo lectura · entrada con errores · ajuste negativo y reservadas | RF-1 a RF-4 |
| `LowStockPage.test.tsx` | lista en o bajo el mínimo · todo sobre el mínimo · error | RF-5 |
| `app-sidebar.test.tsx` | muestra la cantidad · singular · tope 99+ · sin contador en cero · sin contador si falla · técnico no consulta | RF-6 |
| `InventoryPage.test.tsx` | SKU, nombre, categoría, `2 / 1 / 2` (disponible / reservado / mínimo) y "Stock bajo" | RF-1.1 |
| Pendiente | Baja de un repuesto desde la interfaz | ver tarea T12 |
