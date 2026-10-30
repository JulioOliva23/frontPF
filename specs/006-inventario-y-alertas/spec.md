# Spec 006 · Inventario de repuestos y alertas de stock

**Estado:** Implementada (spec retroactiva, 2026-10-29) · **Reglas:** RN-07, RN-09, RN-10, RN-11 · **Historias de origen:** US-F11, US-F12, US-F13 · **Backend:** spec 007 de backPF

## 1. Contexto y objetivo

Los repuestos son la parte cara del negocio y la que más se extravía. Recepción registra cuando llegan, el administrador mantiene el catálogo y corrige mermas, y todos necesitan enterarse a tiempo de lo que se está agotando. Los costos, en cambio, no deben verlos quienes no corresponde.

**Objetivo:** consultar el catálogo con filtros útiles, registrar entradas y ajustes, y avisar cuando un repuesto llega a su mínimo, mostrando a cada rol solo lo que le toca.

## 2. Usuarios

| Rol | Qué ve y hace |
| --- | --- |
| Administrador | Catálogo completo con costos; alta, edición, compatibilidad, entradas y ajustes |
| Recepción | Catálogo sin costos ni acciones de administración; entradas de stock; alertas |
| Técnico | **No accede** a esta función |

## 3. Historias de usuario

- **HU-1** Como recepcionista, quiero buscar un repuesto por texto, categoría o modelo, para saber si lo tenemos.
- **HU-2** Como administrador, quiero dar de alta y editar repuestos, y definir con qué modelos son compatibles.
- **HU-3** Como recepcionista, quiero registrar la llegada de repuestos.
- **HU-4** Como administrador, quiero ajustar el stock con un motivo (mermas, errores), sabiendo qué parte está reservada.
- **HU-5** Como recepcionista, quiero ver de inmediato cuántos repuestos están por agotarse, desde el menú.

## 4. Requisitos funcionales

**RF-1 · Catálogo** (HU-1)
- RF-1.1 El sistema deberá listar los repuestos con SKU, nombre, categoría, existencias (disponible, reservado y mínimo; el físico es la suma de los dos primeros) y una señal visual del nivel de stock.
- RF-1.2 Cuando la persona escribe un texto o elige categoría o modelo, el sistema deberá pedir al servidor solo los repuestos que cumplen esos filtros.
- RF-1.3 El sistema deberá mostrar los estados de vacío y de error cuando corresponda.

**RF-2 · Privacidad de costos** (HU-1)
- RF-2.1 Mientras la persona sea de recepción, el sistema deberá ocultar el costo unitario y todas las acciones de administración.
- RF-2.2 Mientras la persona sea administradora, el sistema deberá mostrar el costo unitario y las acciones de alta, edición, compatibilidad, entrada y ajuste.

**RF-3 · Alta y edición** (HU-2)
- RF-3.1 Cuando un administrador crea un repuesto, el sistema deberá normalizar el SKU a mayúsculas antes de enviarlo.
- RF-3.2 Si el SKU ya existe, entonces el sistema deberá explicarlo claramente.
- RF-3.3 Cuando un administrador edita un repuesto, el sistema no deberá permitir ni enviar un cambio de SKU.
- RF-3.4 El sistema deberá permitir al administrador editar los modelos compatibles de un repuesto; para recepción, la compatibilidad deberá ser solo de lectura.

**RF-4 · Entradas y ajustes** (HU-3, HU-4)
- RF-4.1 Cuando se registra una entrada de stock, el sistema deberá actualizar el repuesto y mostrar los errores que devuelva el servidor.
- RF-4.2 Cuando un administrador registra un ajuste negativo mayor al stock disponible, el sistema deberá explicar que las unidades reservadas no pueden darse de baja.

**RF-5 · Alertas de stock bajo** (HU-5)
- RF-5.1 El sistema deberá ofrecer una lista de los repuestos con stock disponible igual o menor al mínimo.
- RF-5.2 Si todos los repuestos están por encima del mínimo, entonces el sistema deberá decirlo.
- RF-5.3 Si la lista falla, entonces el sistema deberá mostrar un error con reintento.

**RF-6 · Contador en el menú** (HU-5)
- RF-6.1 Mientras la persona sea de recepción o administración, el sistema deberá mostrar junto a "Inventario" la cantidad de repuestos con stock bajo, en singular o plural según corresponda.
- RF-6.2 Cuando la cantidad supera 99, el sistema deberá mostrar "99+".
- RF-6.3 Cuando no hay repuestos con stock bajo o la lista no puede cargarse, el sistema no deberá mostrar el contador.
- RF-6.4 Mientras la persona sea técnico, el sistema no deberá consultar las alertas.

## 5. Requisitos no funcionales

- **RNF-1 Confidencialidad:** el costo unitario se muestra solo a administradores.
- **RNF-2 Claridad del stock:** reservado y disponible se distinguen siempre; "disponible" es lo que puede prometerse.
- **RNF-3 Autoridad del servidor:** la interfaz no calcula alertas; usa las que informa el servidor.
- **RNF-4 Acceso:** solo recepción y administración.

## 6. Casos límite

- Repuesto con unidades reservadas: no puede darse de baja ni ajustarse por debajo de lo reservado.
- SKU con minúsculas o espacios: se normaliza antes de enviar.
- Filtros que no devuelven nada: estado vacío con opción de limpiar.
- Contador con una sola pieza baja: "1 repuesto" en singular.
- Servidor de alertas caído: el menú sigue funcionando sin contador.

## 7. Fuera de alcance

Órdenes de compra, lectura de códigos de barras, fotos del repuesto, conteo físico guiado, historial de movimientos (kardex) en pantalla, importar catálogos.

**Dar de baja un repuesto desde la interfaz** queda pendiente: el servidor ya lo permite y existe la operación en la capa de datos del frontend, pero ninguna pantalla ofrece el botón (ver tarea T12).

## 8. Criterios de finalización

- [x] RF-1 a RF-6 tienen tests que pasan.
- [x] RF-1.1 muestra y comprueba disponible, reservado, mínimo y la señal de stock.
- [ ] Un administrador puede dar de baja un repuesto desde la interfaz (hoy no es posible).

## 9. Dudas abiertas

- **[NECESITA ACLARACIÓN]** ¿Se necesita ver el kardex (quién movió cada pieza) en pantalla?
- **[NECESITA ACLARACIÓN]** ¿Los técnicos deben poder consultar si hay un repuesto, sin ver precios?
