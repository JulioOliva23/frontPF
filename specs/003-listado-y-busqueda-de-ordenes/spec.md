# Spec 003 · Listado y búsqueda de órdenes

**Estado:** Implementada (spec retroactiva, 2026-10-29) · **Reglas:** RN-06 · **Historia de origen:** US-F02 (búsqueda y filtro por técnico: fase 2 del equipo) · **Backend:** spec 005 de backPF

## 1. Contexto y objetivo

Recepción atiende gente de pie: alguien llega diciendo "vengo por el celular de María" o "mi orden es la 123". Hay que **encontrarla en segundos**. Los técnicos, por su parte, solo necesitan su cola, ordenada por estado. Y el panel del local debe poder abrir "las que están presupuestadas" con un solo clic.

**Objetivo:** listar las órdenes en tabla o en tablero, filtrarlas por estado, técnico y texto, y permitir compartir o guardar en favoritos una búsqueda.

## 2. Usuarios

| Rol | Interés |
| --- | --- |
| Recepción y administrador | Todas las órdenes, con todos los filtros |
| Técnico | Solo sus órdenes; sin filtro por técnico ni botón de recepción |

## 3. Historias de usuario

- **HU-1** Como recepcionista, quiero buscar por número, IMEI, nombre o teléfono, para atender rápido al cliente que está en el mostrador.
- **HU-2** Como recepcionista, quiero filtrar por estado y por técnico, para organizar el día.
- **HU-3** Como técnico, quiero ver solo mis órdenes.
- **HU-4** Como administrador, quiero ver el trabajo en un tablero por estado, para ver los cuellos de botella.
- **HU-5** Como recepcionista, quiero abrir una lista ya filtrada desde el panel o desde un enlace.

## 4. Requisitos funcionales

**RF-1 · Vistas** (HU-4)
- RF-1.1 El sistema deberá mostrar las órdenes en una tabla y permitir cambiar a un tablero con una columna por estado.
- RF-1.2 Cada orden deberá mostrar su número, equipo, estado con etiqueta en español y acceso a su detalle.

**RF-2 · Filtro por estado** (HU-2)
- RF-2.1 Cuando la persona elige un estado, el sistema deberá mostrar solo las órdenes en ese estado.
- RF-2.2 El sistema deberá permitir volver a ver todas las órdenes.

**RF-3 · Filtro por técnico** (HU-2)
- RF-3.1 Mientras la persona sea recepción o administrador, el sistema deberá ofrecer la lista de técnicos activos y mostrar solo las órdenes del elegido.
- RF-3.2 El sistema deberá permitir combinar el técnico con el estado.
- RF-3.3 Mientras la persona sea técnico, el sistema no deberá ofrecer el filtro por técnico.

**RF-4 · Búsqueda de texto** (HU-1)
- RF-4.1 Cuando la persona escribe, el sistema deberá esperar a que termine de teclear y enviar una sola búsqueda con el texto completo.
- RF-4.2 Cuando la persona pulsa Enter, el sistema deberá buscar de inmediato.
- RF-4.3 El sistema deberá ignorar espacios sobrantes al inicio y al final.

**RF-5 · Filtros en la dirección** (HU-5)
- RF-5.1 El sistema deberá reflejar el estado, el técnico y el texto en la dirección de la pantalla, y restaurar los filtros al abrir esa dirección.
- RF-5.2 Si la dirección trae un estado desconocido, entonces el sistema deberá ignorarlo.
- RF-5.3 Mientras la persona escribe, el sistema no deberá llenar el historial del navegador con cada tecla.

**RF-6 · Alcance del técnico** (HU-3)
- RF-6.1 Mientras la persona sea técnico, el sistema deberá mostrar únicamente las órdenes asignadas a ella y ocultar el botón de recepción de equipos.

**RF-7 · Estados de la pantalla**
- RF-7.1 Cuando no hay resultados con filtros activos, el sistema deberá explicarlo y ofrecer limpiar todos los filtros.
- RF-7.2 Cuando no existe ninguna orden, el sistema deberá mostrar un estado vacío simple.
- RF-7.3 Mientras se cargan los datos, el sistema deberá mostrar un indicador de carga.
- RF-7.4 Si la carga falla, entonces el sistema deberá mostrar el error con la opción de reintentar.

**RF-8 · Paginación**
- RF-8.1 Cuando hay más resultados que los de una página, el sistema deberá mostrar el rango visible, el total y botones para avanzar y retroceder; cuando todo cabe en una página, no deberá mostrarlos.

## 5. Requisitos no funcionales

- **RNF-1 Rapidez percibida:** una búsqueda no dispara una petición por tecla.
- **RNF-2 Compartible:** una búsqueda se puede copiar como enlace y vuelve a dar el mismo resultado.
- **RNF-3 Móvil:** la lista y los filtros son utilizables desde 320 px de ancho.
- **RNF-4 Control de acceso:** el alcance del técnico lo impone el servidor; la interfaz solo evita ofrecer lo que no corresponde.

## 6. Casos límite

- Búsqueda por un número muy largo: el servidor la trata como texto, sin error.
- Cambiar de filtro mientras otra consulta sigue en curso: prevalece la más reciente.
- Técnico cuyo enlace trae `technicianId` de otro técnico: el servidor lo ignora.
- Página más allá del último resultado tras filtrar: vuelve a la primera.
- Técnico desactivado que sigue teniendo órdenes asignadas: no aparece en la lista de técnicos filtrables.

## 7. Fuera de alcance

Ordenar por columnas, exportar a hoja de cálculo, guardar filtros con nombre, rangos de fechas, acciones masivas sobre varias órdenes.

## 8. Criterios de finalización

- [x] RF-1 a RF-7 tienen tests que pasan.
- [x] RF-8 (paginación) está cubierto desde esta pantalla y no solo desde el componente suelto.
- [x] RF-5.3 tiene un test.

## 9. Dudas abiertas

- **[NECESITA ACLARACIÓN]** ¿Qué columnas debe tener la tabla (fecha compromiso, técnico, teléfono)?
- **[NECESITA ACLARACIÓN]** ¿El tablero debe permitir arrastrar tarjetas para cambiar de estado? Hoy no (las transiciones tienen reglas y precondiciones).
