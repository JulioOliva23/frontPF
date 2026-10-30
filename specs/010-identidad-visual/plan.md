# Plan 010 · Identidad visual y usabilidad básica

Cumple la [constitución](../../docs/constitution.md) (C1.1 solo Tailwind, sin kit externo; C7.2 controles de 44 px). Cubre RF-1 a RF-5 de [spec.md](spec.md).

## 1. Estructura de módulos

| Archivo (`src`) | Responsabilidad | RF |
| --- | --- | --- |
| `index.css` | Fuente base, selección de texto en cian, utilidades `bg-tech-grid` y `bg-tech-grid-dark` | RF-1.1, RF-2.2, RF-2.3 |
| `app/app-layout.tsx` | Cabecera `slate-950`, logotipo cian, avatar, fondo con cuadrícula, `print:hidden` | RF-2.1, RF-2.2, RF-2.4 |
| `app/app-sidebar.tsx` | Menú oscuro, ítem activo `cyan-400`, títulos de sección en cian | RF-2.1 |
| `features/auth/pages/LoginPage.tsx` | Fondo oscuro con cuadrícula y resplandor | RF-2.3 |
| `shared/components/Button.tsx` · `Card.tsx` · `Input.tsx` · `Badge.tsx` · `Modal.tsx` … | Componentes comunes con las variantes; botón primario cian | RF-3 |
| Pantallas de `features/**` | Usan solo clases `cyan-*` para el acento | RF-1, RF-3.1 |

## 2. Modelo de datos

Sin datos. La paleta se define por clases de Tailwind:

```json
{
  "acento": { "fondo": "cyan-400", "texto-sobre-acento": "cyan-950", "hover": "cyan-300", "foco": "cyan-600" },
  "estructura": { "cabecera-y-menu": "slate-950 / slate-900", "contenido": "slate-50 + cuadrícula", "borde-de-cabecera": "cyan-500/20" },
  "estados": { "error": "red-*", "aviso": "amber-*", "ok": "emerald-*", "info": "sky-*" },
  "utilidades": ["bg-tech-grid", "bg-tech-grid-dark"]
}
```

## 3. Algoritmos

```text
reglas de estilo:                                                # RF-1, RF-3
  acento = siempre una clase cyan-* ; prohibido lime-*
  botón primario = bg-cyan-400 + text-cyan-950 ; hover cyan-300 ; foco ring cyan
  error/aviso/ok = red/amber/emerald (nunca el acento)

bg-tech-grid:       líneas de 1 px cada 32 px con slate-200 al 60 %          # fondo del contenido
bg-tech-grid-dark:  resplandor radial cian arriba + líneas slate-800 al 70 % # login

tamaños:                                                         # RF-4
  baseStyles de Button: min-h-[44px] min-w-[44px]
  inputs/selects/botones nativos: min-height 44 px en @layer base
  excepción conocida (a corregir): 5 controles con min-h-[36px]

responsive: menú lateral visible desde lg ; por debajo, cajón (aside fijo con overlay)   # RF-4.3
impresión: la cabecera y el menú llevan print:hidden                                    # RF-2.4
```

## 4. Contrato de uso

No hay API. Contrato visual para quien agregue pantallas:

| Necesito… | Uso |
| --- | --- |
| Acción principal | `<Button variant="primary">` (cian) |
| Acción de contorno / secundaria | `variant="outline-light"` / `ghost-light` |
| Acción destructiva | `variant="danger"` |
| Tarjeta | `<Card variant="public">` sobre fondo claro |
| Estado de la orden | `<WorkOrderStatusBadge>` |
| Control pulsable propio | `min-h-[44px]` |

## 5. Decisiones técnicas

| Decisión | Justificación | Alternativa descartada |
| --- | --- | --- |
| Cian como único acento | Transmite "tecnología" y se distingue de rojo/ámbar/verde de estados (RF-1.3) | Verde lima (anterior): confundible con "ok"; azul puro: poco diferenciado de los enlaces |
| Cabecera y menú oscuros, contenido claro | Marco con carácter técnico sin sacrificar la lectura de tablas y formularios | Todo oscuro: bajo contraste en tablas largas |
| Cuadrícula con CSS (`@utility`) | Cero imágenes (RNF-1) y un único lugar para cambiarla | Imagen de fondo: peso y escalado |
| Reemplazo masivo `lime-` → `cyan-` | Cambio uniforme y revisable en un solo commit | Editar pantalla por pantalla |
| Tailwind sin kit de componentes externo | Menos dependencias (C1.1) | Instalar un kit de UI |
| Dejar el portal público con su cabecera clara por ahora | Es la cara hacia el cliente; la decisión de marca se consulta (duda abierta) | Aplicar el oscuro sin preguntar |

## 6. Estrategia de tests y verificación

| Qué | Cómo | RF |
| --- | --- | --- |
| Sin clases lima | `grep -rn "lime-" src` debe devolver vacío (verificación manual hoy) | RF-1.2 |
| La aplicación compila y los tests pasan con el aspecto nuevo | `npm run build` y `npm test` | todos |
| Menú, cajón y resaltado exacto | `app-sidebar.test.tsx`, `router.test.tsx` ("opens the mobile drawer…") | RF-2.1, RF-4.3 |
| Pendiente: test automático que falle si reaparece `lime-` | RF-3.1 | |
| Pendiente: controles de 44 px | revisión de las 5 excepciones; prueba que busque `min-h-[3` | RF-4.1 |
| Pendiente: revisión visual en celular | manual | RF-4.2 |
