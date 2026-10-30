# Spec 008 · Administración de usuarios y modelos de equipos

**Estado:** Implementada (spec retroactiva, 2026-10-29) · **Reglas:** RN-06, RN-14 · **Historias de origen:** US-F14, US-21 · **Backend:** spec 002 y 003 de backPF

## 1. Contexto y objetivo

El personal cambia y el catálogo de modelos crece. Si solo se puede tocar desde la base de datos, cualquier alta o baja depende de quien sabe programar. El administrador necesita hacerlo solo, con barreras que impidan los errores caros: bloquearse a sí mismo, duplicar un modelo escrito de otra forma o dar un rol equivocado.

**Objetivo:** que el administrador gestione cuentas de personal y el catálogo de marcas y modelos desde la aplicación.

## 2. Usuarios

Solo el **administrador**. Recepción y técnicos no ven esta sección.

## 3. Historias de usuario

- **HU-1** Como administrador, quiero ver todas las cuentas con su rol y estado, y filtrarlas.
- **HU-2** Como administrador, quiero crear cuentas de personal con una contraseña segura.
- **HU-3** Como administrador, quiero cambiar nombre y rol, reiniciar la contraseña y desactivar cuentas, sin poder dañar mi propio acceso.
- **HU-4** Como administrador, quiero ver los modelos agrupados por marca y agregar uno nuevo sin crear duplicados por mayúsculas o espacios.

## 4. Requisitos funcionales

### Usuarios

**RF-1 · Lista y filtros** (HU-1)
- RF-1.1 El sistema deberá listar cada cuenta con su usuario, nombre, rol y estado.
- RF-1.2 El sistema deberá filtrar por texto, rol y estado sin volver a pedir los datos al servidor.
- RF-1.3 Cuando hay muchas cuentas, el sistema deberá paginarlas.

**RF-2 · Alta** (HU-2)
- RF-2.1 El sistema deberá pedir usuario, nombre, rol, contraseña y su confirmación, y validarlos antes de enviar.
- RF-2.2 El sistema deberá convertir el usuario a minúsculas y rechazar el que tenga espacios o símbolos no permitidos.
- RF-2.3 El sistema deberá exigir que las dos contraseñas coincidan y cumplan las reglas de seguridad.
- RF-2.4 El sistema no deberá ofrecer el rol Cliente: esas cuentas se vinculan a un cliente aparte.
- RF-2.5 Cuando el alta es correcta, el sistema deberá avisarlo y actualizar la lista.
- RF-2.6 Si el usuario ya existe, entonces el sistema deberá indicarlo junto al campo.

**RF-3 · Edición y contraseña** (HU-3)
- RF-3.1 El sistema deberá permitir cambiar el nombre y el rol de una cuenta de personal.
- RF-3.2 Mientras el administrador edita su propia cuenta, el sistema deberá bloquear el cambio de rol.
- RF-3.3 El sistema deberá permitir reiniciar la contraseña con las mismas reglas del alta.

**RF-4 · Desactivación** (HU-3)
- RF-4.1 Cuando el administrador desactiva otra cuenta, el sistema deberá pedir confirmación y dejarla inactiva sin borrarla.
- RF-4.2 El sistema nunca deberá ofrecer desactivar la cuenta con la que se inició sesión.
- RF-4.3 Cuando el administrador reactiva una cuenta inactiva, el sistema deberá pedir confirmación y dejarla activa de nuevo con su historial.

### Modelos de equipos

**RF-5 · Catálogo** (HU-4)
- RF-5.1 El sistema deberá mostrar los modelos agrupados por marca, ordenados por marca y modelo (con orden natural para los números).
- RF-5.2 El sistema deberá ocultar los modelos desactivados y mostrarlos solo a pedido.
- RF-5.3 El sistema deberá filtrar el catálogo por marca o modelo sin pedir datos al servidor.

**RF-6 · Alta y baja** (HU-4)
- RF-6.1 El sistema deberá exigir marca (2 a 60 caracteres) y modelo (1 a 80 caracteres).
- RF-6.2 Si la marca y el modelo ya existen (sin distinguir mayúsculas ni espacios, incluso si el modelo está inactivo), entonces el sistema deberá rechazar el alta antes de enviarla.
- RF-6.3 El sistema deberá aceptar el mismo nombre de modelo bajo otra marca.
- RF-6.4 Cuando se agrega un modelo, el sistema deberá conservar la marca para el siguiente y refrescar la lista.
- RF-6.5 Cuando se escribe una marca ya conocida, el sistema deberá reutilizar su escritura existente.
- RF-6.6 Si el servidor informa un duplicado, entonces el sistema deberá mostrarlo en el campo del modelo.
- RF-6.7 Cuando se desactiva un modelo, el sistema deberá confirmarlo con un aviso.

**RF-7 · Acceso**
- RF-7.1 El sistema deberá mostrar la sección de administración solo a administradores; un visitante anónimo deberá ser llevado al inicio de sesión y un modelo desconocido a una pantalla 404.

## 5. Requisitos no funcionales

- **RNF-1 Seguridad:** ninguna contraseña se muestra ni se guarda en el navegador.
- **RNF-2 Prevención de errores:** las acciones destructivas piden confirmación y el administrador no puede dañarse a sí mismo.
- **RNF-3 Rapidez:** los filtros responden al instante porque trabajan sobre lo ya cargado.
- **RNF-4 Idioma:** mensajes en español.

## 6. Casos límite

- Marca escrita "apple", "Apple" y "APPLE ": se tratan como la misma.
- Modelo "iPhone 9" y "iPhone 10": orden natural, no alfabético.
- Dos administradores se desactivan entre sí: el sistema no lo impide (depende de la regla del servidor).
- Contraseñas distintas al confirmar: error en el campo de confirmación.
- Lista de usuarios muy larga: paginada.
- El servidor devuelve 409 por usuario ocupado: se marca el campo.

## 7. Fuera de alcance

Crear cuentas de cliente, borrar definitivamente, importación masiva, roles personalizados, edición de marca de varios modelos a la vez.

## 8. Criterios de finalización

- [x] RF-1 a RF-7 tienen tests que pasan (RF-6.7 solo parcialmente).
- [x] RF-3.1 (cambiar el nombre/rol de otra persona) tiene un test directo.
- [ ] RF-7.1: la sección de administración tiene un test de acceso por rol más allá del router.

## 9. Dudas abiertas

- **[NECESITA ACLARACIÓN]** ¿Debe poder editarse una marca o un modelo ya creado, o solo desactivarse?
- **[NECESITA ACLARACIÓN]** ¿Debe impedirse desactivar al último administrador activo? (depende de la spec 002 del backend).
