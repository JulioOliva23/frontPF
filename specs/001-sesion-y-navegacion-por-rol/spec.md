# Spec 001 · Sesión y navegación por rol

**Estado:** Implementada (spec retroactiva, 2026-10-29) · **Reglas:** RN-06, RN-07, RN-14 · **Historias de origen:** US-F00, US-F01 · **Backend:** spec 001 de backPF

## 1. Contexto y objetivo

Cada persona usa el sistema para algo distinto: el técnico solo quiere su cola de trabajo, recepción quiere el mostrador y el cliente solo quiere saber de su equipo. Mostrar a todos todo el menú confunde y expone pantallas que no les corresponden. Además, una sesión que caduca a mitad de una tarea no debe hacer perder el lugar ni mostrar errores crudos.

**Objetivo:** que cada persona inicie sesión, llegue a su pantalla, vea solo lo suyo, y que la sesión se renueve o se cierre con elegancia.

## 2. Usuarios

Administrador, Recepción, Técnico y Cliente. Además, visitantes sin sesión (que solo pueden usar el portal público).

## 3. Historias de usuario

- **HU-1** Como persona con cuenta, quiero iniciar sesión y llegar directo a mi pantalla de trabajo.
- **HU-2** Como técnico, quiero un menú sin presupuestos ni inventario, para no ver lo que no me corresponde.
- **HU-3** Como persona con sesión abierta, quiero recargar la página sin volver a iniciar sesión.
- **HU-4** Como persona cuya sesión caducó, quiero volver al inicio de sesión y, al entrar, regresar a donde estaba.
- **HU-5** Como persona que escribe una dirección inexistente o ve un fallo, quiero una pantalla clara con una salida.

## 4. Requisitos funcionales

**RF-1 · Inicio de sesión** (HU-1)
- RF-1.1 Cuando la persona deja vacío el usuario o la contraseña, o escribe un usuario de más de 80 caracteres, el sistema deberá mostrar el error junto al campo sin contactar al servidor.
- RF-1.2 Si el servidor rechaza las credenciales, entonces el sistema deberá mostrar el mensaje que éste informa.
- RF-1.3 Si el servidor indica demasiados intentos, entonces el sistema deberá pedir esperar un minuto.
- RF-1.4 Si ocurre un error inesperado, entonces el sistema deberá mostrar un mensaje general en lugar de un error técnico.
- RF-1.5 Mientras el inicio de sesión está en curso, el sistema deberá mostrar un indicador y evitar un segundo envío.

**RF-2 · Pantalla de llegada por rol** (HU-1)
- RF-2.1 Cuando un administrador o recepcionista inicia sesión, el sistema deberá llevarlo al panel; a un técnico, a la lista de órdenes; a un cliente, al portal del cliente.

**RF-3 · Menú por rol** (HU-2)
- RF-3.1 Mientras la persona sea técnico, el sistema no deberá mostrarle presupuestos ni inventario.
- RF-3.2 Mientras la persona sea recepción o administrador, el sistema deberá mostrarle el menú completo de operación y gestión.
- RF-3.3 El sistema deberá mostrar la sección de administración solo a administradores.
- RF-3.4 Mientras la persona sea cliente, el sistema no deberá mostrarle enlaces del personal.
- RF-3.5 Cuando se está en una pantalla hija (por ejemplo, el detalle de una orden), el sistema no deberá resaltar una opción de menú que no corresponde.

**RF-4 · Protección de pantallas** (HU-2, HU-4)
- RF-4.1 Si una persona sin sesión intenta abrir una pantalla interna, entonces el sistema deberá llevarla al inicio de sesión recordando la pantalla pedida.
- RF-4.2 Si una persona con sesión intenta abrir una pantalla que su rol no permite, entonces el sistema deberá llevarla a su pantalla de llegada.
- RF-4.3 El sistema deberá volver solo a pantallas internas de la aplicación; nunca a una dirección externa.

**RF-5 · Continuidad de la sesión** (HU-3, HU-4)
- RF-5.1 Cuando la página se recarga con una sesión guardada, el sistema deberá restaurarla con una sola renovación, aun si la aplicación ejecuta sus efectos dos veces.
- RF-5.2 Cuando no hay sesión guardada, el sistema deberá considerar a la persona anónima sin llamar al servidor.
- RF-5.3 Cuando el servidor responde que la sesión caducó, el sistema deberá renovarla una sola vez, aunque varias peticiones fallen a la vez, y repetir las peticiones fallidas.
- RF-5.4 Si la renovación falla, entonces el sistema deberá avisar de la sesión expirada una sola vez y llevar a la persona al inicio de sesión recordando dónde estaba.
- RF-5.5 Si una persona anónima o un intento de inicio de sesión recibe un rechazo, entonces el sistema no deberá intentar renovar ni avisar de sesión expirada.
- RF-5.6 Las peticiones que se emitan mientras se renueva la sesión deberán esperar el resultado en vez de salir con la credencial vencida.

**RF-6 · Cierre de sesión**
- RF-6.1 Cuando la persona pulsa "Cerrar sesión", el sistema deberá cerrar la sesión en el servidor, borrar los datos locales y llevarla al inicio de sesión.

**RF-7 · Direcciones inexistentes y fallos** (HU-5)
- RF-7.1 Cuando se abre una dirección que no existe, el sistema deberá mostrar una pantalla 404 con enlaces a la pantalla de llegada de la persona, o al inicio de sesión si no hay sesión.
- RF-7.2 Si una pantalla falla al dibujarse, entonces el sistema deberá reemplazarla por una pantalla de recuperación en vez de dejar la página en blanco.
- RF-7.3 Si no puede descargarse una parte de la aplicación (por ejemplo, tras una publicación nueva), entonces el sistema deberá pedir recargar la página.
- RF-7.4 Las direcciones antiguas deberán redirigir a las vigentes.

**RF-8 · Navegación móvil**
- RF-8.1 Mientras la pantalla sea angosta, el sistema deberá ofrecer el menú en un cajón que se abra, se cierre al elegir una opción y resalte solo la opción exacta.

## 5. Requisitos no funcionales

- **RNF-1 Seguridad:** el control de acceso de la interfaz es solo visual; el servidor valida cada acción.
- **RNF-2 Privacidad de la sesión:** la credencial de acceso vive solo en memoria; la de renovación solo en el almacenamiento de la pestaña, nunca en uno persistente (hasta la spec 011).
- **RNF-3 Accesibilidad:** controles de al menos 44 px; los errores de formulario se anuncian junto al campo.
- **RNF-4 Idioma:** los mensajes de esta spec están en español.

## 6. Casos límite

- Renovación en curso mientras llegan varias peticiones: todas esperan y se repiten con el nuevo acceso.
- Recarga con la credencial guardada ya vencida: se muestra el inicio de sesión, no un error.
- Pestaña que no permite usar el almacenamiento: la sesión simplemente no sobrevive a una recarga.
- Dirección de retorno externa en el estado del navegador: se ignora.
- Cliente con sesión que abre una pantalla del personal: se le lleva al portal.

## 7. Fuera de alcance

Recuperar contraseña, cambiar contraseña propia, recordar usuario, selector de idioma, tema claro/oscuro configurable por la persona.

## 8. Criterios de finalización

- [x] RF-1 a RF-8 tienen al menos un test que pasa (RF-1.5 y RF-6.1 sin test específico).
- [x] Ninguna pantalla interna se muestra a una persona sin sesión.
- [ ] RF-1.5 y RF-6.1 tienen tests.

## 9. Dudas abiertas

- **[NECESITA ACLARACIÓN]** ¿Se necesita "recuperar contraseña" por la propia persona? (depende de la spec 001 del backend).
- **[NECESITA ACLARACIÓN]** ¿Debe avisarse con antelación cuando la sesión está por caducar, en lugar de cerrarla de golpe?
