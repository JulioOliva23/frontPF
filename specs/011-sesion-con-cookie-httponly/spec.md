# Spec 011 · Sesión con cookie protegida (lado del frontend)

**Estado:** Propuesta · parcialmente iniciada (la interfaz ya envía credenciales con cada petición) · **Supuesto:** SUP-07 · **Pareja en el backend:** spec 009 de backPF · **Depende de:** respuesta a las dudas abiertas de esa spec

## 1. Contexto y objetivo

Hoy la interfaz guarda la credencial de renovación en el almacenamiento de la pestaña. Cualquier script que lograra ejecutarse en la página podría leerla y llevarse la sesión. Una vez que el servidor la entregue en una cookie que los scripts no pueden leer, la interfaz debe **dejar de guardarla** y limitarse a pedir la renovación.

**Objetivo:** que la aplicación mantenga la sesión sin que ninguna credencial de renovación pase por código de la página ni quede en el almacenamiento del navegador.

## 2. Usuarios

Todas las personas con cuenta. El cambio debe ser invisible para ellas.

## 3. Historias de usuario

- **HU-1** Como persona con sesión, quiero seguir logueada al recargar la página, sin que mi sesión quede al alcance de scripts ajenos.
- **HU-2** Como persona que cierra sesión, quiero que no quede ningún rastro de ella en el navegador.

## 4. Requisitos funcionales

**RF-1 · Sin almacenamiento de la credencial de renovación**
- RF-1.1 El sistema no deberá guardar la credencial de renovación en ningún almacenamiento del navegador ni en memoria de la página.
- RF-1.2 Cuando la persona inicia sesión, el sistema deberá conservar únicamente la credencial de acceso, en memoria.

**RF-2 · Restauración**
- RF-2.1 Cuando la página se carga, el sistema deberá intentar restaurar la sesión pidiendo una renovación al servidor, que usará la cookie, sin enviar ninguna credencial en el cuerpo.
- RF-2.2 Si la renovación falla (no hay cookie o es inválida), entonces el sistema deberá considerar a la persona anónima sin mostrar errores técnicos.
- RF-2.3 El sistema deberá seguir haciendo una sola renovación aunque la aplicación ejecute sus efectos dos veces o varias peticiones fallen a la vez.

**RF-3 · Cierre de sesión**
- RF-3.1 Cuando la persona cierra sesión, el sistema deberá pedir al servidor que la termine y borre su cookie, y descartar la credencial de acceso en memoria.

**RF-4 · Envío de credenciales**
- RF-4.1 El sistema deberá enviar las cookies con las peticiones al servidor. *(Ya implementado.)*
- RF-4.2 El sistema deberá acompañar las operaciones que usan la cookie con la señal que el servidor exija para rechazar peticiones hechas desde otros sitios.

**RF-5 · Transición**
- RF-5.1 Mientras el servidor siga aceptando la credencial en el cuerpo, el sistema deberá poder iniciar sesión con ambos esquemas sin que la persona note la diferencia.
- RF-5.2 Cuando se retire el esquema anterior, el sistema deberá eliminar cualquier credencial que hubiera quedado guardada de versiones anteriores.

## 5. Requisitos no funcionales

- **RNF-1 Seguridad:** tras el cambio, una búsqueda en el almacenamiento del navegador no revela ninguna credencial de renovación.
- **RNF-2 Experiencia:** recargar la página sigue restaurando la sesión; no se pide iniciar sesión más seguido.
- **RNF-3 Compatibilidad:** debe funcionar en los navegadores móviles principales, incluidos los que bloquean cookies de terceros.

## 6. Casos límite

- Navegador que bloquea cookies de terceros (interfaz y servidor en dominios distintos): la sesión no se restauraría; la solución depende de la decisión de la spec 009 del backend.
- Persona con la versión anterior abierta durante el despliegue: su credencial guardada se descarta al cargar la versión nueva (RF-5.2).
- Pestañas múltiples: la renovación concurrente se resuelve como en la spec 001.
- El usuario bloquea todas las cookies del sitio: no puede mantener sesión tras recargar; inicia sesión de nuevo.

## 7. Fuera de alcance

"Recordarme en este dispositivo", cambiar la duración de la sesión, listar sesiones activas.

## 8. Criterios de finalización

- [ ] En producción, iniciar sesión, recargar y seguir autenticado funciona sin almacenamiento de la credencial de renovación.
- [ ] Un test comprueba que, tras iniciar sesión, el almacenamiento del navegador no contiene ninguna credencial de renovación.
- [ ] Un test comprueba que la restauración de sesión pide la renovación sin cuerpo.
- [x] Las peticiones salen con credenciales (RF-4.1, test "sends credentials so the httpOnly refresh cookie can travel").

## 9. Dudas abiertas

- **[NECESITA ACLARACIÓN]** (1) Misma duda 1 de la spec 009 del backend: dominios distintos frente a un dominio compartido por proxy.
- **[NECESITA ACLARACIÓN]** (2) ¿Cuándo se retira el esquema anterior (RF-5.2)? Debe coordinarse con el despliegue del backend.
