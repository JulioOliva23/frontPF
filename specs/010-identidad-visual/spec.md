# Spec 010 · Identidad visual y usabilidad básica

**Estado:** Implementada en su mayoría (spec retroactiva, 2026-10-29) · **Origen:** rediseño tecnológico de la rama `diseño-nuevo` · **Constitución:** C7.1, C7.2, C7.3

## 1. Contexto y objetivo

Un sistema de uso diario en el mostrador de un taller de celulares debe verse **moderno y técnico** (es un negocio de electrónica) y, sobre todo, ser **cómodo con dedos grasosos y con prisa**: botones grandes, colores que se lean bien y el mismo aspecto en todas las pantallas. Un diseño distinto en cada pantalla da la impresión de un producto a medio hacer.

**Objetivo:** una identidad visual única —acento cian sobre azul oscuro— aplicada de forma coherente en toda la aplicación, con reglas mínimas de legibilidad y de tamaño de los controles.

## 2. Usuarios

Todas las personas que usan la aplicación (personal y clientes).

## 3. Historias de usuario

- **HU-1** Como persona que usa el sistema todo el día, quiero un aspecto uniforme, para reconocer dónde estoy y qué puedo pulsar.
- **HU-2** Como recepcionista que trabaja de pie, quiero botones fáciles de pulsar, para no equivocarme.
- **HU-3** Como cliente que consulta desde el celular, quiero que la página se vea bien en una pantalla pequeña.
- **HU-4** Como dueño, quiero que el sistema transmita un aspecto profesional y tecnológico.

## 4. Requisitos funcionales

**RF-1 · Color de acento**
- RF-1.1 El sistema deberá usar el cian como único color de acento en acciones principales, elementos activos, enlaces destacados, selección de texto y foco de los campos.
- RF-1.2 El sistema no deberá usar el verde lima de la versión anterior en ninguna pantalla.
- RF-1.3 El sistema deberá reservar rojo, ámbar y verde para errores, avisos y confirmaciones.

**RF-2 · Estructura visual**
- RF-2.1 El sistema deberá mostrar la cabecera y el menú lateral sobre fondo azul oscuro, con el elemento activo resaltado en cian.
- RF-2.2 El sistema deberá mostrar el área de contenido sobre un fondo claro con una cuadrícula muy tenue.
- RF-2.3 El sistema deberá mostrar el inicio de sesión sobre fondo oscuro con la misma cuadrícula y un resplandor cian superior.
- RF-2.4 Mientras se imprime, el sistema deberá ocultar la cabecera y el menú.

**RF-3 · Coherencia**
- RF-3.1 Las pantallas nuevas deberán adoptar el mismo acento y componentes que las existentes sin definir colores propios.
- RF-3.2 Los botones primarios, secundarios, de peligro y de contorno deberán verse igual en todas las pantallas.

**RF-4 · Tamaños y adaptación**
- RF-4.1 Todo control que se pulse (botón, enlace destacado, casilla, selector) deberá medir al menos 44 px de alto.
- RF-4.2 El sistema deberá poder usarse sin desplazamiento horizontal desde 320 px de ancho.
- RF-4.3 Mientras la pantalla sea angosta, el sistema deberá reemplazar el menú lateral por un cajón.

**RF-5 · Legibilidad**
- RF-5.1 El texto sobre fondos de acento deberá usar un color oscuro de alto contraste; sobre fondos oscuros, un color claro.
- RF-5.2 Los campos con error deberán distinguirse por más que el color (mensaje de texto junto al campo).

## 5. Requisitos no funcionales

- **RNF-1 Rendimiento:** el aspecto no agrega imágenes pesadas; la cuadrícula se dibuja con estilos.
- **RNF-2 Mantenibilidad:** el acento se cambia en un solo lugar de estilos, no pantalla por pantalla.
- **RNF-3 Accesibilidad:** el contraste mínimo de texto normal cumple WCAG AA.

## 6. Casos límite

- Impresión del ticket: sin menú ni cabecera, con borde sólido.
- Portal público: usa una cabecera clara propia (decisión pendiente, ver dudas).
- Pantalla muy angosta: el contenido pasa a una columna.
- Modo de color forzado o alto contraste del sistema: los textos siguen siendo legibles.

## 7. Fuera de alcance

Modo claro/oscuro seleccionable, personalización por cliente, animaciones, un sistema de diseño documentado con *tokens*.

## 8. Criterios de finalización

- [x] No queda ninguna clase de color lima en el código (`grep` vacío).
- [x] La aplicación compila y los 204 tests pasan con el nuevo aspecto.
- [ ] RF-4.1: los 5 controles que miden 36 px llegan a 44 px.
- [ ] RF-3.1: existe una verificación automática que impida reintroducir el color lima.
- [ ] Revisión visual en celular real de las pantallas principales.

## 9. Dudas abiertas

- **[NECESITA ACLARACIÓN]** ¿El portal público del cliente debe adoptar la cabecera oscura o mantenerse claro?
- **[NECESITA ACLARACIÓN]** ¿Hay un logotipo o paleta corporativa del taller que sustituya al cian?
