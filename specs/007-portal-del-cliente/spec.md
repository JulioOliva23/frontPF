# Spec 007 · Portal del cliente

**Estado:** Implementada (spec retroactiva, 2026-10-29) · **Reglas:** RN-03, RN-14 · **Supuesto confirmado:** SUP-05 · **Historia de origen:** US-F10 · **Backend:** spec 008 de backPF

## 1. Contexto y objetivo

Quien deja su celular quiere saber "¿ya está?" sin llamar ni volver. El taller quiere liberar el mostrador de esa pregunta, pero sin exponer datos internos (costos, notas del técnico, el código de desbloqueo) ni permitir curiosear órdenes ajenas.

**Objetivo:** una página pública, simple y de uso móvil, donde el cliente consulta el estado de su equipo con los datos de su ticket, o con su cuenta si la tiene.

## 2. Usuarios

| Persona | Cómo accede |
| --- | --- |
| Cliente sin cuenta | Número de orden y código de seguimiento del ticket |
| Cliente con cuenta | Inicia sesión y ve todas sus órdenes |
| Personal del taller | Puede usar el formulario público para ayudar a un cliente |

## 3. Historias de usuario

- **HU-1** Como cliente, quiero escribir los datos de mi ticket y ver el estado de mi equipo, para no tener que llamar.
- **HU-2** Como cliente, quiero que el sistema me diga claramente si me equivoqué de dato, sin dejarme adivinar.
- **HU-3** Como cliente con cuenta, quiero ver todos mis equipos de una vez.
- **HU-4** Como dueño, quiero que nadie pueda adivinar datos de otros clientes probando códigos.

## 4. Requisitos funcionales

**RF-1 · Consulta con el ticket** (HU-1)
- RF-1.1 El sistema deberá pedir el número de orden y el código de seguimiento y mostrar el estado de esa orden cuando son correctos.
- RF-1.2 El sistema deberá aceptar el número como "OT-000123", "000123" o "123" y el código con o sin guion y en mayúsculas o minúsculas, normalizándolos antes de enviarlos.
- RF-1.3 Cuando la consulta es correcta, el sistema deberá ofrecer "Consultar otra orden".

**RF-2 · Validación previa** (HU-2)
- RF-2.1 Si falta el número o no es un número de orden válido, entonces el sistema deberá indicarlo sin contactar al servidor.
- RF-2.2 Si el código no tiene el formato del ticket (8 caracteres válidos), entonces el sistema deberá indicarlo sin contactar al servidor; en particular, un código de 4 dígitos parecido a un PIN de celular deberá rechazarse.

**RF-3 · Errores** (HU-2, HU-4)
- RF-3.1 Si el servidor responde que no existe esa orden o que el código es incorrecto, entonces el sistema deberá mostrar un único mensaje que no distinga entre ambos casos.
- RF-3.2 Si el servidor indica demasiados intentos, entonces el sistema deberá explicarlo, desactivar el botón durante un minuto y volver a activarlo.
- RF-3.3 Si no se puede contactar al servidor, entonces el sistema deberá mostrar un mensaje de intento posterior.

**RF-4 · Vista del equipo** (HU-1, HU-3)
- RF-4.1 El sistema deberá mostrar número de orden, equipo, estado en español con su avance por etapas, fecha de entrega estimada ("Por confirmar" si no hay), total del presupuesto ("Pendiente" si no hay) y última actualización.
- RF-4.2 Mientras la orden esté cancelada, el sistema deberá mostrar que la reparación fue cancelada e indicar que puede retirar su equipo en el local.
- RF-4.3 El sistema no deberá mostrar costos internos, códigos de desbloqueo, diagnóstico ni notas del técnico.

**RF-5 · Cliente con cuenta** (HU-3)
- RF-5.1 Mientras haya una sesión de cliente, el sistema deberá saludarlo por su nombre y listar todas sus órdenes, incluidas las canceladas.
- RF-5.2 Si el cliente no tiene órdenes, entonces el sistema deberá decirlo y ofrecer cerrar sesión.
- RF-5.3 Cuando el cliente cierra sesión, el sistema deberá volver al formulario público.

**RF-6 · Visitantes y personal**
- RF-6.1 Mientras no haya sesión, el sistema deberá ofrecer un enlace discreto "Ingresar con mi cuenta".
- RF-6.2 Mientras la persona sea personal del taller, el sistema deberá mostrar el formulario público sin enlaces de cuenta.

**RF-7 · Acceso**
- RF-7.1 El sistema deberá permitir esta página sin iniciar sesión.

## 5. Requisitos no funcionales

- **RNF-1 Privacidad:** ningún dato interno viaja ni se muestra; el mensaje de error no revela qué órdenes existen.
- **RNF-2 Móvil primero:** la página es cómoda de usar desde un celular de 320 px de ancho.
- **RNF-3 Rapidez:** el cliente llega al resultado con dos campos y un botón.
- **RNF-4 Idioma:** todo en español sencillo, sin términos técnicos.

## 6. Casos límite

- Código escrito con espacios o minúsculas: se normaliza.
- Pegar el código con el guion en otra posición: se normaliza.
- Número de orden de 11 dígitos: inválido.
- Cliente con cuenta que entra al portal y recarga: la sesión se restaura y ve sus órdenes.
- Orden entregada o cancelada: sigue siendo consultable.
- Servidor dormido (hosting gratuito): la primera consulta puede tardar; se muestra el estado de carga.

## 7. Fuera de alcance

Notificaciones, historial detallado de estados con fechas, chat con el taller, pagar en línea, cambiar la fecha de entrega, QR en el ticket.

## 8. Criterios de finalización

- [x] RF-1 a RF-6 tienen tests que pasan.
- [ ] RF-3.3 (sin conexión) y RF-4.2 (orden cancelada) tienen tests.
- [ ] RF-6.1 tiene un test del enlace "Ingresar con mi cuenta".

## 9. Dudas abiertas

- **[NECESITA ACLARACIÓN]** ¿La página pública debe usar el aspecto oscuro del resto de la aplicación o conservar uno claro y sobrio?
- **[NECESITA ACLARACIÓN]** ¿Debe mostrar el historial de estados con fechas?
