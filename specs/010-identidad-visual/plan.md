# Plan 010 · Identidad visual y usabilidad básica

Cumple la [constitución](../../docs/constitution.md) (C1.1 solo Tailwind, sin kit externo; C7.2 controles de 44 px). Cubre RF-1 a RF-5 de [spec.md](spec.md).

## 1. Estructura de módulos

| Archivo (`src`) | Responsabilidad | RF |
| --- | --- | --- |
| `index.css` | Paleta en `@theme` (`canvas`, `surface*`, `ink*`, `muted`, `line`, `mint`, `mint-deep`, `lavender`); fondo oscuro; selección y foco lavanda; `glass-card`, `primary-action`, `secondary-action`, `app-header`, `app-sidebar`, `mascot-halo`; impresión; movimiento reducido | RF-1, RF-2, RF-4.4 |
| `app/app-layout.tsx` | Cabecera y menú translúcidos, cajón, barra de navegación inferior, `print:hidden` | RF-2.1, RF-2.4, RF-4.3 |
| `app/app-sidebar.tsx` | Elemento activo en menta | RF-1.1, RF-2.1 |
| `shared/components/Mascot.tsx` | Gato reparador (`/brand/repair-cat.png`) | RF-2.3 |
| `features/auth/pages/LoginPage.tsx` | Marca, mascota con halo y formulario en tarjeta de vidrio | RF-2.3 |
| `shared/components/Button.tsx` · `Card.tsx` · `Badge.tsx` · `MetricCard.tsx` · `ui/form-field.tsx` … | Variantes comunes; únicos lugares con colores propios | RF-1.3, RF-3 |
| Pantallas de `features/**` | Solo tokens del tema (`text-mint`, `bg-surface`, `border-line`…) | RF-3.1 |

## 2. Modelo de datos

Sin datos. La paleta vive en `@theme`:

```json
{
  "fondo": { "canvas": "#120e20", "surface": "#231e33", "surface-soft": "#191624", "surface-raised": "#302a42" },
  "texto": { "ink": "#f5f3fc", "ink-soft": "#d3cfe2", "muted": "#b5afc7" },
  "acento": { "mint": "#9af2c7", "mint-deep (texto sobre menta)": "#102b22", "lavender": "#c4b5fd" },
  "botón principal": "degradado mint → #b5e2e8 → lavender con texto #12231f",
  "estados": { "error": "red-*", "aviso": "orange-* / amber-*", "ok": "emerald-*" }
}
```

## 3. Algoritmos

```text
reglas de estilo:                                                # RF-1, RF-3
  acento = mint (acción, activo, foco de campo) + lavender (foco de teclado, selección)
  prohibido: lime-*, cyan-*
  menta sólida (bg-mint) ⇒ texto mint-deep ; decorativo (aria-hidden) exento
  error/aviso/ok = red / orange-amber / emerald (nunca el acento)

tamaños:                                                         # RF-4
  Button: min-h-[44px] min-w-[44px] ; nativos: min-height 44 px en @layer base
  ningún min-h-[0..39px]

responsive: menú lateral desde lg ; por debajo, cajón + barra inferior fija   # RF-4.3
impresión: cabecera, menú y barra inferior print:hidden ; body blanco         # RF-2.4
prefers-reduced-motion: duración de animaciones y transiciones ≈ 0            # RF-4.4
```

## 4. Contrato de uso

No hay API. Contrato visual para quien agregue pantallas:

| Necesito… | Uso |
| --- | --- |
| Acción principal | `<Button variant="primary">` (degradado menta–lavanda) |
| Acción de contorno / secundaria | `variant="outline-light"` / `ghost-light` |
| Acción destructiva | `variant="danger"` |
| Tarjeta | `<Card>` (`glass-card`) |
| Estado de la orden | `<WorkOrderStatusBadge>` |
| Control pulsable propio | `min-h-[44px]` |

## 5. Decisiones técnicas

| Decisión | Justificación | Alternativa descartada |
| --- | --- | --- |
| Diseño oscuro con mascota (PR #8) | El equipo lo eligió sobre el cian: transmite cercanía al cliente sin perder el tono técnico | Acento cian sobre azul (`diseño-nuevo`): frío para el portal del cliente |
| Menta como acento, lavanda como apoyo | El menta se distingue del verde esmeralda de "ok" por saturación y contexto; el lavanda marca el foco sin competir con la acción | Un solo acento: el foco de teclado se confunde con lo activo |
| Paleta en `@theme` | Un solo lugar para cambiarla (RNF-2) | Colores sueltos por pantalla |
| Hexadecimales solo en `shared/components` e `index.css` | Las pantallas heredan cualquier ajuste de paleta | Permitirlos en pantallas |
| Tailwind sin kit de componentes externo | Menos dependencias (C1.1) | Instalar un kit de UI |

## 6. Estrategia de tests y verificación

| Qué | Cómo | RF |
| --- | --- | --- |
| Reglas de diseño | `src/test/design-rules.test.ts` lee las fuentes y falla ante lima o cian, un hexadecimal en una pantalla, un control menor de 44 px, menta sólida sin texto oscuro o falta de reglas de impresión y de movimiento reducido | RF-1 a RF-5.1 |
| Menú, cajón y resaltado exacto | `router.test.tsx` ("opens the mobile drawer…") | RF-4.3 |
| Error por más que el color | `form-field.test.tsx` | RF-5.2 |
| Pendiente: revisión visual en celular | manual | RF-4.2 |
