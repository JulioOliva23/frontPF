# Spec 010 · Identidad visual y usabilidad básica

**Estado:** Implementada (spec retroactiva, 2026-10-29; actualizada el 2026-10-30 al diseño oscuro con mascota) · **Origen:** rediseño de la rama `sergioFront` (PR #8), que reemplazó al acento cian de `diseño-nuevo` · **Constitución:** C7.1, C7.2, C7.3

## 1. Contexto y objetivo

Un sistema de uso diario en el mostrador de un taller de celulares debe ser **cómodo con dedos grasosos y con prisa**: botones grandes, colores que se lean bien y el mismo aspecto en todas las pantallas. También es la cara del taller ante el cliente que consulta su equipo: debe transmitir **calma y confianza**, no solo "tecnología". Un diseño distinto en cada pantalla da la impresión de un producto a medio hacer.

**Objetivo:** una identidad visual única —fondo oscuro violeta, acento menta con lavanda y la mascota del gato reparador— aplicada de forma coherente en toda la aplicación, con reglas mínimas de legibilidad y de tamaño de los controles.

## 2. Usuarios

Todas las personas que usan la aplicación (personal y clientes).

## 3. Historias de usuario

- **HU-1** Como persona que usa el sistema todo el día, quiero un aspecto uniforme, para reconocer dónde estoy y qué puedo pulsar.
- **HU-2** Como recepcionista que trabaja de pie, quiero botones fáciles de pulsar, para no equivocarme.
- **HU-3** Como cliente que consulta desde el celular, quiero que la página se vea bien en una pantalla pequeña.
- **HU-4** Como dueño, quiero que el sistema transmita un aspecto profesional y tecnológico.

## 4. Requisitos funcionales

**RF-1 · Color de acento**
- RF-1.1 El sistema deberá usar el menta como acento de acciones principales, elemento activo del menú y foco de los campos, y el lavanda para el contorno de foco del teclado y la selección de texto; el botón principal combina ambos en un degradado.
- RF-1.2 El sistema no deberá usar los acentos de versiones anteriores (verde lima y cian) en ninguna pantalla.
- RF-1.3 El sistema deberá reservar rojo, naranja o ámbar y verde esmeralda para errores, avisos y confirmaciones.

**RF-2 · Estructura visual**
- RF-2.1 El sistema deberá mostrar toda la aplicación sobre un fondo oscuro violeta, con la cabecera y el menú lateral translúcidos y separados por una línea sutil, y el elemento activo resaltado en menta.
- RF-2.2 El sistema deberá presentar el contenido en tarjetas de vidrio translúcido con el mismo borde y radio en todas las pantallas.
- RF-2.3 El sistema deberá mostrar en el inicio de sesión la mascota con su halo y la marca, sobre el mismo fondo oscuro.
- RF-2.4 Mientras se imprime, el sistema deberá ocultar la cabecera, el menú y la navegación móvil, y usar fondo blanco con texto oscuro.

**RF-3 · Coherencia**
- RF-3.1 Las pantallas deberán usar solo los colores del tema y de los componentes comunes, sin definir colores hexadecimales propios.
- RF-3.2 Los botones primarios, secundarios, de peligro y de contorno deberán verse igual en todas las pantallas.

**RF-4 · Tamaños y adaptación**
- RF-4.1 Todo control que se pulse (botón, enlace destacado, casilla, selector) deberá medir al menos 44 px de alto.
- RF-4.2 El sistema deberá poder usarse sin desplazamiento horizontal desde 320 px de ancho.
- RF-4.3 Mientras la pantalla sea angosta, el sistema deberá reemplazar el menú lateral por un cajón y una barra de navegación inferior.
- RF-4.4 Si la persona pidió reducir el movimiento en su sistema, entonces el sistema deberá desactivar animaciones y transiciones.

**RF-5 · Legibilidad**
- RF-5.1 El texto sobre fondos de acento sólidos deberá usar un color oscuro de alto contraste; sobre el fondo oscuro, un color claro.
- RF-5.2 Los campos con error deberán distinguirse por más que el color (mensaje de texto junto al campo).

## 5. Requisitos no funcionales

- **RNF-1 Rendimiento:** la única imagen es la mascota; degradados, halos y vidrio se dibujan con estilos.
- **RNF-2 Mantenibilidad:** la paleta vive en un solo lugar (`@theme` de `index.css`), no pantalla por pantalla.
- **RNF-3 Accesibilidad:** el contraste mínimo de texto normal cumple WCAG AA.

## 6. Casos límite

- Impresión del ticket: sin menú, cabecera ni barra inferior; tarjeta blanca con borde gris.
- Portal público: usa el mismo fondo oscuro y las tarjetas de vidrio.
- Pantalla muy angosta: el contenido pasa a una columna y las tablas de órdenes muestran cada celda con su etiqueta.
- Modo de color forzado o alto contraste del sistema: los textos siguen siendo legibles.

## 7. Fuera de alcance

Modo claro/oscuro seleccionable, personalización por cliente, un sistema de diseño documentado aparte.

## 8. Criterios de finalización

- [x] No queda ninguna clase de color lima ni cian en el código (test de reglas de diseño).
- [x] La aplicación compila y los tests pasan con el aspecto nuevo.
- [x] RF-4.1: ningún control mide menos de 44 px.
- [x] RF-1 a RF-5 tienen un test etiquetado en `src/test/design-rules.test.ts` o en el componente correspondiente.
- [ ] Revisión visual en celular real de las pantallas principales.

## 9. Dudas abiertas

- **[NECESITA ACLARACIÓN]** ¿El taller tiene un logotipo propio que acompañe o reemplace a la mascota?
