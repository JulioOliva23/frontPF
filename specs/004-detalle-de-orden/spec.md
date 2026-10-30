# Spec 004 · Detalle de la orden de trabajo

**Estado:** Implementada (spec retroactiva, 2026-10-29) · **Reglas:** RN-03, RN-04, RN-05, RN-06, RN-09, RN-12 · **Supuestos:** SUP-05, SUP-09 · **Historias de origen:** US-F04, US-F07, US-F08, US-F09 · **Backend:** spec 004 y 008 de backPF

## 1. Contexto y objetivo

La pantalla de una orden es donde se **trabaja**: el técnico diagnostica y avanza el estado, recepción asigna técnico y registra la cancelación, el administrador revisa la auditoría. Cada rol debe ver solo las acciones que puede ejecutar y entender de inmediato por qué algo no avanza (por ejemplo, un repuesto agotado), sin ver errores técnicos.

**Objetivo:** mostrar toda la información de una orden y ofrecer a cada persona exactamente las acciones que le corresponden, con mensajes claros cuando el servidor las rechaza.

## 2. Usuarios

| Rol | Qué hace aquí |
| --- | --- |
| Técnico asignado | Diagnostica, avanza el estado, revela el código de desbloqueo |
| Recepción | Asigna técnico, repone el código de seguimiento, cancela, entrega, va al flujo de presupuestos |
| Administrador | Todo lo anterior |

## 3. Historias de usuario

- **HU-1** Como técnico, quiero avanzar el estado de mis órdenes con un botón, para reflejar el trabajo real.
- **HU-2** Como técnico, quiero saber de inmediato qué repuestos faltan si no puedo iniciar la reparación.
- **HU-3** Como técnico asignado, quiero ver el código de desbloqueo solo cuando lo necesito, sabiendo que queda registrado.
- **HU-4** Como recepcionista, quiero asignar o cambiar el técnico y reponer el código de seguimiento de un cliente que perdió su ticket.
- **HU-5** Como administrador, quiero ver el historial de cambios de estado, para resolver reclamos.

## 4. Requisitos funcionales

**RF-1 · Información de la orden**
- RF-1.1 El sistema deberá mostrar cliente, equipo (marca, modelo, color), IMEI, batería, técnico, fecha compromiso, problema reportado y estado cosmético por zonas con sus condiciones.
- RF-1.2 Cuando la batería no tiene dato, el sistema deberá mostrar "No enciende / sin dato".
- RF-1.3 El sistema deberá mostrar el avance de la orden a lo largo de los nueve estados, indicando el actual.
- RF-1.4 Mientras la orden esté cancelada, el sistema deberá mostrarla como interrumpida y no ofrecer acciones de avance.
- RF-1.5 Si la orden no existe, no está asignada al técnico o falla la carga, entonces el sistema deberá mostrar un mensaje específico y la opción de reintentar.

**RF-2 · Acciones de estado** (HU-1)
- RF-2.1 El sistema deberá ofrecer solo los botones de las transiciones que el servidor informa como permitidas a la persona.
- RF-2.2 El sistema no deberá ofrecer como botones "Presupuestado" ni "Aprobado": esos pasos ocurren al enviar y al decidir un presupuesto.
- RF-2.3 Mientras la orden esté Presupuestada, el sistema no deberá ofrecer cancelar desde aquí; se cancela rechazando el presupuesto.
- RF-2.4 Cuando la orden está en Control de calidad, el sistema deberá nombrar claramente el retorno a reparación como "Devolver a reparación (no pasó control)".
- RF-2.5 Cuando una transición se aplica, el sistema deberá confirmar con el nuevo estado y actualizar la pantalla.
- RF-2.6 Mientras una transición está en curso, el sistema deberá bloquear los demás botones.
- RF-2.7 Si la persona no tiene acciones disponibles, entonces el sistema no deberá mostrar la sección de acciones.

**RF-3 · Control de repuestos** (HU-2)
- RF-3.1 Si el servidor bloquea el inicio de la reparación por falta de repuestos, entonces el sistema deberá mostrar un aviso que nombre los repuestos faltantes y dejar la orden en su estado.
- RF-3.2 Si el servidor rechaza una acción por otro motivo, entonces el sistema deberá mostrar ese motivo en la pantalla.

**RF-4 · Cambios simultáneos**
- RF-4.1 Si otra persona cambió la orden mientras tanto (conflicto), entonces el sistema deberá avisarlo con un mensaje amable y actualizar la vista con el estado real, sin mostrar un error técnico.

**RF-5 · Cancelación**
- RF-5.1 Cuando la persona elige cancelar, el sistema deberá pedir un motivo de al menos 3 y como máximo 500 caracteres antes de confirmar.
- RF-5.2 Cuando la persona cierra el cuadro sin confirmar, el sistema no deberá modificar la orden.

**RF-6 · Asignación de técnico** (HU-4)
- RF-6.1 Mientras la persona sea de recepción o administración, el sistema deberá permitirle asignar o cambiar el técnico entre los técnicos activos.
- RF-6.2 Si el servidor rechaza la asignación (por ejemplo, porque la reparación ya empezó), entonces el sistema deberá mostrar el motivo.

**RF-7 · Diagnóstico** (HU-1)
- RF-7.1 Mientras la orden esté En diagnóstico, el sistema deberá permitir al técnico asignado o a un administrador registrar el diagnóstico preliminar.
- RF-7.2 Si el servidor rechaza el diagnóstico, entonces el sistema deberá mostrar el motivo.
- RF-7.3 Cuando la persona no puede diagnosticar, el sistema deberá mostrar el diagnóstico guardado en solo lectura, si existe.

**RF-8 · Código de desbloqueo** (HU-3)
- RF-8.1 Cuando la orden tiene un código de desbloqueo, el sistema deberá mostrarlo enmascarado.
- RF-8.2 Cuando la persona autorizada pulsa "Revelar" y confirma el aviso de que la acción queda registrada, el sistema deberá mostrar el código.
- RF-8.3 Cuando pasan 30 segundos, o cuando la pestaña deja de estar visible, o cuando se sale de la pantalla, el sistema deberá volver a ocultar el código y descartarlo.
- RF-8.4 Si la persona no está autorizada (recepción o un técnico no asignado), entonces el sistema no deberá ofrecer el botón de revelar.

**RF-9 · Código de seguimiento** (HU-4)
- RF-9.1 Mientras la persona sea de recepción o administración, el sistema deberá permitirle reponer el código de seguimiento, previa confirmación, y mostrar el nuevo código una sola vez.

**RF-10 · Historial de cambios** (HU-5)
- RF-10.1 El sistema deberá mostrar el historial de cambios de estado en orden cronológico, con quién, cuándo y el motivo si lo hay.
- RF-10.2 Si el historial no puede cargarse, entonces el sistema deberá informarlo sin ocultar el resto de la orden.

**RF-11 · Flujo de presupuestos**
- RF-11.1 Mientras la orden esté En diagnóstico o Presupuestada, el sistema deberá ofrecer a recepción y administración el acceso al armado del presupuesto o al registro de la respuesta del cliente.

## 5. Requisitos no funcionales

- **RNF-1 Seguridad:** el código de desbloqueo no se guarda en el navegador y desaparece de la pantalla a los 30 segundos.
- **RNF-2 Autoridad del servidor:** la interfaz solo ofrece acciones; el servidor decide si proceden.
- **RNF-3 Claridad:** ningún error se muestra como texto técnico; los conflictos se explican en lenguaje llano.
- **RNF-4 Móvil:** la pantalla es utilizable desde 320 px de ancho.

## 6. Casos límite

- Orden asignada a otro técnico: mensaje "Esta orden no está asignada a ti".
- Dos personas avanzan la misma orden: una gana, la otra ve el aviso (RF-4.1).
- Reparación sin repuestos en el presupuesto: no hay nada que reservar y avanza.
- Motivo de cancelación de dos caracteres: el botón de confirmar permanece desactivado.
- Código de seguimiento repuesto con el diálogo abierto en dos pestañas: solo el último sirve.
- Orden entregada: no ofrece acciones.

## 7. Fuera de alcance

Subir fotos, chat con el cliente, imprimir la orden de trabajo, editar los datos del ingreso, deshacer una transición.

## 8. Criterios de finalización

- [x] RF-1 a RF-10 tienen tests que pasan.
- [ ] RF-11 tiene un test de los enlaces según el estado.
- [ ] RF-2.3 y RF-2.6 tienen tests específicos.

## 9. Dudas abiertas

- **[NECESITA ACLARACIÓN]** ¿La pantalla debe mostrar el presupuesto vigente a recepción dentro de la orden?
- **[NECESITA ACLARACIÓN]** ¿Debe poder cancelarse una orden aprobada o en reparación? Hoy no (SUP-08 del backend).
- **[NECESITA ACLARACIÓN]** ¿El código de desbloqueo debe poder revelarse más de una vez por sesión sin volver a confirmar?
