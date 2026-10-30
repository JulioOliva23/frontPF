# Spec 012 · Aprobaciones del agente IA en vivo

**Estado:** Implementada (2026-10-30) · **Reglas:** AG-01, AG-02, AG-04, RN-04, RN-06, RN-09 · **Backend:** spec 011 de backPF (propuestas del agente IA) · **Constitución:** C7.2 (FE-16, el token solo en memoria)

## 1. Contexto y objetivo

El asistente de IA del taller (servidor MCP `taller`) ya no cambia órdenes: deja **propuestas** que una persona distinta debe aprobar. Si esa persona no se entera a tiempo, la propuesta vence a los 15 minutos y el cliente espera. Y si aprueba sin mirar, el control humano no sirve de nada.

**Objetivo:** que el personal vea las propuestas **en el momento** en que llegan, que solo pueda decidir quien está autorizado y que aprobar exija una confirmación deliberada, más fuerte cuando el cambio no se puede deshacer.

## 2. Usuarios

| Rol | Interés |
| --- | --- |
| Administrador | Aprobar o rechazar cualquier propuesta que la máquina de estados le permita |
| Recepción | Aprobar o rechazar según la máquina de estados (no puede iniciar una reparación) |
| Técnico | Decidir solo sobre sus órdenes |

## 3. Historias de usuario

- **HU-1** Como técnico, quiero ver al instante las propuestas sobre mis órdenes, para no dejar que venzan.
- **HU-2** Como recepcionista, quiero que solo se me ofrezca lo que puedo decidir, para no chocar con errores de permisos.
- **HU-3** Como administrador, quiero que aprobar un cambio irreversible me obligue a mirar la orden, para no cancelar ni entregar por error.

## 4. Requisitos funcionales

**RF-1 · Recepción en vivo** (HU-1)
- RF-1.1 Mientras haya una sesión del personal, el sistema deberá escuchar el stream de propuestas y agregar las creadas a la lista sin recargar la página, y quitarlas cuando se decidan.
- RF-1.2 Cuando una propuesta se ejecuta, el sistema deberá refrescar las órdenes y, si el cambio mueve stock (En reparación, Control de calidad), también el inventario.
- RF-1.3 Si un evento llega malformado, o el interceptor de la pantalla lo veta, entonces el sistema deberá ignorarlo sin tocar la lista.
- RF-1.4 Si el stream no está disponible, entonces el sistema deberá indicar que está sin conexión y reintentar con una espera que crece hasta 30 segundos.
- RF-1.5 El sistema deberá interpretar eventos que lleguen partidos en varios fragmentos o con datos en varias líneas.

**RF-2 · Decisión según el rol** (HU-2)
- RF-2.1 El sistema deberá ofrecer "Aprobar" solo a un rol que la máquina de estados acepte para esa transición, y "Rechazar" a cualquier miembro del personal que pueda verla.
- RF-2.2 El sistema no deberá ofrecer decidir a la cuenta que hizo la propuesta (AG-04).
- RF-2.3 El sistema deberá mostrar primero la propuesta más nueva y los minutos que le quedan antes de vencer (AG-02).

**RF-3 · Confirmación humana** (HU-3)
- RF-3.1 Cuando alguien aprueba, el sistema deberá exigir que marque que revisó la orden.
- RF-3.2 Si el destino es Cancelada o Entregada, entonces el sistema deberá exigir además que escriba el número de la orden.
- RF-3.3 Si la ejecución falla (por ejemplo, falta stock), entonces el sistema deberá mostrar el motivo y dejar la propuesta abierta.
- RF-3.4 Mientras no haya propuestas pendientes, el sistema deberá decirlo con un mensaje.

**RF-4 · Navegación** (HU-1)
- RF-4.1 El sistema deberá mostrar "Aprobaciones IA" en el menú de todo el personal, también al técnico.

## 5. Requisitos no funcionales

- **RNF-1 Seguridad:** el stream se lee con `fetch` y el token en memoria (FE-16); no se usa `EventSource`, que obligaría a poner el token en la URL.
- **RNF-2 Defensa en capas:** la interfaz oculta lo que no se puede decidir, pero el backend vuelve a comprobarlo (spec 011 de backPF).
- **RNF-3 Una sola conexión:** un stream por sesión, compartido por la página, el contador del menú y los avisos.

## 6. Casos límite

- Sesión vencida mientras el stream está abierto: se renueva la sesión y se reconecta.
- Dos personas deciden la misma propuesta: la segunda recibe el error del backend y la lista se actualiza con el evento.
- La propuesta vence con el modal abierto: el backend rechaza la aprobación con AG-02.

## 7. Fuera de alcance

Notificaciones fuera de la aplicación (correo, push), historial de propuestas decididas, crear propuestas desde la web.

## 8. Criterios de finalización

- [x] RF-1 a RF-4 tienen al menos un test etiquetado que pasa.
- [x] Prueba manual de punta a punta: propuesta por MCP → aviso y contador en vivo → aprobación con el modal → auditoría con el origen "Agente IA" (2026-10-30).

## 9. Dudas abiertas

- **[NECESITA ACLARACIÓN]** ¿Los avisos emergentes deben sonar o basta con el contador del menú?
