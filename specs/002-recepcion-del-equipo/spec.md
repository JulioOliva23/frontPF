# Spec 002 · Recepción del equipo (pantalla de ingreso)

**Estado:** Implementada (spec retroactiva, 2026-10-29) · **Reglas:** RN-01, RN-02, RN-03, RN-13 · **Supuestos:** SUP-01, SUP-05, SUP-09 · **Historia de origen:** US-F03 · **Backend:** spec 003 y 008 de backPF

## 1. Contexto y objetivo

El mostrador es donde más se pierde tiempo y donde más se discute: un cliente espera mientras se escribe todo, y después alega que "la pantalla no estaba rota". La pantalla de ingreso debe permitir registrar el equipo **rápido, sin errores de tipeo** y dejar constancia de su estado, con un ticket para el cliente.

**Objetivo:** que recepción registre cliente, equipo, estado físico y bloqueo en una sola pantalla, con ayuda inmediata ante errores, y entregue al cliente un ticket con su número y código de seguimiento.

## 2. Usuarios

Recepción y administrador (los únicos que abren órdenes). El técnico no accede a esta pantalla.

## 3. Historias de usuario

- **HU-1** Como recepcionista, quiero que el IMEI se valide mientras lo escribo, para corregir un dígito mal tipeado antes de enviar.
- **HU-2** Como recepcionista, quiero ver las reparaciones anteriores del equipo apenas ingreso su IMEI, para dar contexto al técnico.
- **HU-3** Como recepcionista, quiero registrar el estado físico por zonas con opciones rápidas, para no escribir párrafos.
- **HU-4** Como cliente, quiero que mi código de desbloqueo no quede a la vista de quien pase por el mostrador.
- **HU-5** Como cliente, quiero salir con un ticket que tenga mi número de orden y mi código de seguimiento.

## 4. Requisitos funcionales

**RF-1 · IMEI asistido** (HU-1)
- RF-1.1 Mientras la persona escribe el IMEI, el sistema deberá darle formato legible y señalar de inmediato si es inválido, indicando si falla la longitud o el dígito verificador.
- RF-1.2 Si el IMEI es inválido, entonces el sistema deberá impedir el envío y no deberá contactar al servidor.
- RF-1.3 El sistema deberá aceptar IMEI escritos con espacios o guiones.

**RF-2 · Historial del equipo** (HU-2)
- RF-2.1 Cuando se completa un IMEI válido ya conocido, el sistema deberá mostrar, tras una breve pausa de tecleo, las reparaciones previas del equipo.
- RF-2.2 Si el IMEI es válido pero no está registrado, entonces el sistema no deberá mostrar error: se trata de un equipo nuevo.

**RF-3 · Datos del ingreso** (HU-3)
- RF-3.1 El sistema deberá pedir los datos del cliente, el modelo del equipo (de una lista), el problema reportado, el estado de cada zona (pantalla, tapa trasera, marco, lente de cámara, botones) con las opciones OK, rayado, fisurado, abollado o faltante, y el tipo de bloqueo.
- RF-3.2 El sistema deberá permitir informar el nivel de batería (0 a 100) como dato opcional.
- RF-3.3 Si la fecha compromiso está en el pasado, entonces el sistema deberá rechazarla antes de enviar.
- RF-3.4 Si la batería está fuera de 0 a 100, entonces el sistema deberá rechazarla antes de enviar.

**RF-4 · Código de desbloqueo protegido** (HU-4)
- RF-4.1 Mientras el tipo de bloqueo sea PIN o contraseña, el sistema deberá mostrar el código enmascarado por defecto, con opción de revelarlo mientras se escribe.
- RF-4.2 Mientras el tipo de bloqueo sea patrón, el sistema deberá ofrecer una cuadrícula de 3×3 para dibujarlo, aceptando un patrón de al menos cuatro puntos.
- RF-4.3 Mientras el tipo de bloqueo sea "sin bloqueo", el sistema deberá ocultar el campo del código y no enviarlo.
- RF-4.4 El sistema no deberá guardar el código en el navegador ni escribirlo en la consola.

**RF-5 · Ticket** (HU-5)
- RF-5.1 Cuando la orden se crea, el sistema deberá mostrar el número de orden y el código de seguimiento, con aviso de que **es la única vez que se muestra**, y permitir imprimirlos.
- RF-5.2 El sistema no deberá poder volver a mostrar el código de seguimiento después de cerrar el ticket.

**RF-6 · Errores del servidor**
- RF-6.1 Si el servidor rechaza el ingreso, entonces el sistema deberá mostrar el motivo sin perder lo escrito.
- RF-6.2 Mientras se envía el ingreso, el sistema deberá evitar un segundo envío.

**RF-7 · Acceso**
- RF-7.1 El sistema deberá permitir esta pantalla solo a administración y recepción.

## 5. Requisitos no funcionales

- **RNF-1 Rapidez de uso:** registrar un equipo estándar no debe requerir más de una pantalla ni abrir ventanas intermedias.
- **RNF-2 Confidencialidad:** el código de desbloqueo se mantiene enmascarado por defecto y no se persiste en el navegador.
- **RNF-3 Impresión:** el ticket se imprime sin el menú ni elementos de navegación.
- **RNF-4 Idioma:** todos los textos y errores están en español.

## 6. Casos límite

- IMEI de 14 o 16 dígitos, o con letras: se marca inválido.
- Equipo que no enciende: batería vacía y bloqueo desconocido (se permite "sin bloqueo" o dejar la batería sin dato).
- Patrón de menos de cuatro puntos: se rechaza.
- IMEI ya registrado con otro modelo: el servidor lo rechaza y se muestra el motivo.
- Servidor lento: el botón queda desactivado y el formulario conserva lo escrito.
- El cliente cierra el ticket sin imprimir: el código no puede recuperarse; recepción debe generar uno nuevo (spec 004).

## 7. Fuera de alcance

Fotos del equipo, firma del cliente, lectura del IMEI con la cámara, guardado de borradores, ingreso por lote.

## 8. Criterios de finalización

- [x] RF-1, RF-3 a RF-5 tienen tests que pasan.
- [ ] RF-2 (historial) tiene un test.
- [ ] RF-6 y RF-7 tienen tests específicos.

## 9. Dudas abiertas

- **[NECESITA ACLARACIÓN]** ¿Los equipos sin IMEI legible deben poder ingresar con otro identificador? Hoy no (SUP-01).
- **[NECESITA ACLARACIÓN]** ¿El ticket debe incluir un código QR para consultar el estado?
- **[NECESITA ACLARACIÓN]** ¿El cliente debe firmar la hoja de estado cosmético?
