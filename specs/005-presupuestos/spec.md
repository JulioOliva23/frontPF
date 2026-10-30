# Spec 005 · Presupuestos (armado, envío y decisión del cliente)

**Estado:** Implementada (spec retroactiva, 2026-10-29) · **Reglas:** RN-05, RN-07, RN-08, RN-10, RN-15 · **Supuesto:** SUP-04 · **Historias de origen:** US-F05, US-F06, US-F15 · **Backend:** spec 006 de backPF

## 1. Contexto y objetivo

El presupuesto es el contrato verbal con el cliente: qué se va a hacer y cuánto cuesta. Recepción lo arma con el diagnóstico del técnico delante, lo comunica al cliente y **anota su respuesta y por qué medio la dio**. Si algo sale mal (precio cambiado, repuesto distinto) debe poder emitir otra versión sin perder la anterior.

**Objetivo:** que recepción arme presupuestos correctos, los envíe, registre la aprobación o el rechazo del cliente y vea claramente cuáles versiones están vigentes, vencidas o reemplazadas.

## 2. Usuarios

Recepción y administrador. **Los técnicos no acceden** a esta función ni la ven en su menú.

## 3. Historias de usuario

- **HU-1** Como recepcionista, quiero ver qué órdenes necesitan presupuesto y cuáles esperan respuesta, para saber qué hacer primero.
- **HU-2** Como recepcionista, quiero armar un presupuesto con mano de obra y repuestos compatibles, y ver el total antes de guardarlo.
- **HU-3** Como recepcionista, quiero registrar la respuesta del cliente con el medio que usó, para dejar constancia.
- **HU-4** Como recepcionista, quiero ver cuánto falta para que venza un presupuesto, para insistir a tiempo.

## 4. Requisitos funcionales

**RF-1 · Colas de trabajo** (HU-1)
- RF-1.1 El sistema deberá mostrar dos listas: "Por presupuestar" (órdenes En diagnóstico) y "Esperando respuesta del cliente" (órdenes Presupuestadas), cada una con su cantidad.
- RF-1.2 Cada elemento deberá mostrar número de orden, equipo, cliente y estado, y llevar al editor de esa orden.
- RF-1.3 Cuando una lista está vacía, el sistema deberá mostrar "Nada pendiente".

**RF-2 · Armado** (HU-2)
- RF-2.1 Mientras la orden esté En diagnóstico o Presupuestada, el sistema deberá ofrecer crear una nueva versión; en cualquier otro estado deberá avisar que la orden ya no admite nuevos presupuestos.
- RF-2.2 El sistema deberá permitir líneas de mano de obra (descripción, cantidad de 1 a 50 y precio con hasta dos decimales) y ofrecer descripciones frecuentes.
- RF-2.3 El sistema deberá permitir líneas de repuesto elegidas solo entre los **compatibles con el modelo del equipo**, con cantidad de 1 a 50.
- RF-2.4 El sistema no deberá permitir editar ni enviar el precio de un repuesto: lo fija el catálogo.
- RF-2.5 El sistema deberá exigir entre 1 y 50 líneas.
- RF-2.6 Mientras la persona arma el presupuesto, el sistema deberá mostrar una vista previa del total sin errores de redondeo.
- RF-2.7 El sistema deberá señalar junto a cada línea los datos inválidos, permitir quitar líneas y mostrar los errores que devuelva el servidor.

**RF-3 · Envío** (HU-3)
- RF-3.1 Cuando recepción envía un borrador, el sistema deberá confirmarlo y mostrar la versión como enviada, con su fecha de vencimiento.
- RF-3.2 Si el envío falla, entonces el sistema deberá mostrar el motivo.

**RF-4 · Decisión del cliente** (HU-3)
- RF-4.1 Mientras la orden esté Presupuestada, el sistema deberá permitir registrar la aprobación o el rechazo de una versión enviada.
- RF-4.2 El sistema deberá exigir elegir el medio de respuesta: en persona, teléfono, WhatsApp o correo.
- RF-4.3 Para un rechazo, el sistema deberá exigir además un motivo de al menos 3 caracteres.
- RF-4.4 Si el servidor rechaza la decisión (por ejemplo, por vencimiento), entonces el sistema deberá mostrar el motivo dentro del cuadro de decisión.
- RF-4.5 Cuando la persona cierra el cuadro sin confirmar, el sistema no deberá llamar al servidor.

**RF-5 · Versiones y vencimiento** (HU-4)
- RF-5.1 El sistema deberá listar todas las versiones de la orden con su estado en español: borrador, enviado, aprobado, rechazado, expirado, reemplazado.
- RF-5.2 Cuando un presupuesto enviado ya pasó su fecha de vencimiento, el sistema deberá mostrarlo como expirado aunque el servidor todavía lo tenga como enviado.
- RF-5.3 Mientras un presupuesto enviado no ha vencido, el sistema deberá mostrar cuántos días le quedan.
- RF-5.4 El sistema deberá mostrar la versión vencida o rechazada con marca visible.

**RF-6 · Contexto**
- RF-6.1 El sistema deberá mostrar el diagnóstico del técnico y un enlace de vuelta a la orden.
- RF-6.2 Si la orden no puede cargarse, entonces el sistema deberá mostrar un error con opción de reintentar.

## 5. Requisitos no funcionales

- **RNF-1 Exactitud monetaria:** la vista previa trabaja en centavos enteros; el total oficial es el que devuelve el servidor.
- **RNF-2 Confidencialidad:** el costo unitario de los repuestos no aparece.
- **RNF-3 Constancia:** toda decisión queda con su medio y, si es rechazo, su motivo.
- **RNF-4 Acceso:** solo recepción y administración; los técnicos son redirigidos.

## 6. Casos límite

- Precio con más de dos decimales o letras: línea inválida.
- Repuesto incompatible elegido por un enlace manipulado: el servidor lo rechaza y se muestra el motivo.
- Dos versiones enviadas: la anterior figura como reemplazada.
- Presupuesto que venció pocos minutos antes de decidir: la decisión se rechaza y se pide emitir una nueva versión.
- Orden ya cancelada o aprobada: sin botón de nueva versión.

## 7. Fuera de alcance

Descuentos, impuestos, impresión del presupuesto, firma del cliente, envío automático por WhatsApp o correo, comparar versiones.

## 8. Criterios de finalización

- [x] RF-1 a RF-6 tienen tests que pasan.
- [x] RF-1.1 a RF-1.3 están cubiertos (reparto en dos colas, enlace a la orden y "Nada pendiente").
- [x] RF-2.6 y RF-5.3 tienen tests de la vista previa y de los días restantes.

## 9. Dudas abiertas

- **[NECESITA ACLARACIÓN]** ¿Se necesita imprimir el presupuesto para dárselo al cliente?
- **[NECESITA ACLARACIÓN]** ¿Qué debe ocurrir en pantalla con una orden Presupuestada cuyo presupuesto venció? (relacionado con la spec 010 del backend).
