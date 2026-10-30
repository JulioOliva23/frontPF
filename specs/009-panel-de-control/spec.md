# Spec 009 · Panel de control

**Estado:** Implementada (spec retroactiva, 2026-10-29) · **Reglas:** RN-11 · **Historia de origen:** fase 2 del equipo (sin historia en el backlog) · **Backend:** spec 005 y 007 de backPF

## 1. Contexto y objetivo

Al abrir el sistema por la mañana, recepción y administración se preguntan lo mismo: "¿cuánto trabajo hay?, ¿qué está atrasado?, ¿qué espera al cliente?, ¿qué repuestos se están acabando?". Hoy habría que recorrer cuatro pantallas para saberlo.

**Objetivo:** una pantalla de inicio con cuatro indicadores y accesos directos a las listas que requieren acción.

## 2. Usuarios

Recepción y administrador. Los técnicos aterrizan en su lista de órdenes y los clientes en el portal; no ven este panel.

## 3. Historias de usuario

- **HU-1** Como recepcionista, quiero ver cuántas órdenes siguen en el local y cuántas están atrasadas.
- **HU-2** Como recepcionista, quiero ver cuántos presupuestos esperan respuesta del cliente y abrir la lista de esas órdenes.
- **HU-3** Como recepcionista, quiero ver cuántos repuestos están en el mínimo y abrir su lista.
- **HU-4** Como administrador, quiero ver cuántas órdenes hay en cada estado y entrar a cada cola.

## 4. Requisitos funcionales

**RF-1 · Indicadores** (HU-1, HU-2, HU-3)
- RF-1.1 El sistema deberá mostrar cuatro indicadores: órdenes activas, órdenes retrasadas, presupuestos por aprobar y repuestos con stock bajo.
- RF-1.2 Mientras los datos cargan, el sistema deberá mostrar un marcador de carga en cada indicador; si no pueden obtenerse, un guion.
- RF-1.3 Cuando hay órdenes retrasadas, el sistema deberá resaltar ese indicador como alerta; cuando hay presupuestos por aprobar o stock bajo, deberá resaltarlos como aviso.

**RF-2 · Accesos directos** (HU-2, HU-3, HU-4)
- RF-2.1 Cuando la persona pulsa "OTs activas", el sistema deberá llevarla a la lista de órdenes.
- RF-2.2 Cuando pulsa "Presupuestos por aprobar", el sistema deberá llevarla a la lista de órdenes ya filtrada por el estado Presupuestado.
- RF-2.3 Cuando pulsa "Stock bajo", el sistema deberá llevarla a la lista de alertas de inventario.
- RF-2.4 El sistema deberá ofrecer un acceso destacado a "Nuevo ingreso".

**RF-3 · Cola por estado** (HU-4)
- RF-3.1 El sistema deberá listar los nueve estados con la cantidad de órdenes de cada uno y un enlace a la lista filtrada por ese estado.

**RF-4 · Fallos**
- RF-4.1 Si el resumen no puede cargarse, entonces el sistema deberá mostrar un error con opción de reintentar, conservando el contador de stock bajo.

**RF-5 · Contexto**
- RF-5.1 El sistema deberá saludar a la persona por su nombre y mostrar la fecha de hoy en español.

**RF-6 · Acceso**
- RF-6.1 El sistema deberá mostrar este panel solo a administración y recepción; a otros roles los deberá llevar a su pantalla de llegada.

## 5. Requisitos no funcionales

- **RNF-1 Coherencia:** las cifras salen del servidor; la interfaz no las recalcula.
- **RNF-2 Rapidez:** el panel se muestra aunque una de las dos consultas falle.
- **RNF-3 Navegación:** cada cifra importante lleva a la lista que la explica.

## 6. Casos límite

- Cero órdenes: todos los indicadores muestran 0, sin alertas.
- Servidor despertando (hosting gratuito): marcador de carga prolongado, luego los valores.
- Resumen falla pero las alertas de stock cargan: se ve el contador de stock bajo y el error del resumen.
- Estado sin órdenes: aparece con 0 y su enlace.

## 7. Fuera de alcance

Gráficos históricos, filtrar el panel por técnico o fechas, indicadores financieros, actualización en vivo.

## 8. Criterios de finalización

- [x] RF-1 a RF-4 tienen tests que pasan.
- [x] RF-5 y RF-6 tienen tests (el acceso se prueba desde el router).
- [x] RF-1.3 (resaltado de alertas) tiene un test.

## 9. Dudas abiertas

- **[NECESITA ACLARACIÓN]** ¿Debe agregarse un indicador de "presupuestos vencidos"? (relacionado con la spec 010 del backend).
- **[NECESITA ACLARACIÓN]** ¿El indicador de retrasadas debe abrir la lista de esas órdenes? Hoy no tiene enlace.
