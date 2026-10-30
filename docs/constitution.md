# Constitución del frontend · Servicio Técnico de Celulares

Principios **innegociables**. Son cortos a propósito y cada uno dice cómo se comprueba. Si un cambio los contradice, se cambia el cambio, no la constitución; modificarla exige un Pull Request propio aprobado por otro integrante.

Las specs que gobierna están en [`specs/`](../specs/). El comportamiento del servidor se define en el repositorio [backPF](https://github.com/JulioOliva23/backPF), que manda en cualquier discrepancia sobre reglas de negocio.

## 1. Simplicidad del stack

- **C1.1** El stack es cerrado: React 19, Vite, TypeScript `strict`, Tailwind CSS, React Router, TanStack Query, react-hook-form con zod y Axios. No se agrega una librería de estado global (Redux, Zustand…), ni un kit de componentes externo, ni otro cliente HTTP.
- **C1.2** Un único gestor de paquetes (npm) con `package-lock.json` versionado.
- **C1.3** Una dependencia nueva solo entra si el `plan.md` de una spec la justifica y nombra la alternativa descartada.
- *Se comprueba:* `package.json` contra los `plan.md`; la CI instala con `npm ci`.

## 2. La spec manda sobre el código

- **C2.1** Todo comportamiento visible tiene un requisito `RF-x` en `specs/<NNN-nombre>/spec.md`.
- **C2.2** Un cambio de comportamiento actualiza primero la spec (o en el mismo Pull Request). Si el código y la spec discrepan, **gana la spec**.
- **C2.3** Cada requisito se traza: `plan.md` dice qué parte lo cubre, `tasks.md` qué tarea lo implementó y `specs/verificacion.md` qué test lo comprueba.
- **C2.4** Las dudas se declaran como `[NECESITA ACLARACIÓN]`, nunca se resuelven en silencio dentro del código.
- *Se comprueba:* revisión del Pull Request; `specs/verificacion.md` sin requisitos "sin cubrir" al cerrar una spec.

## 3. Lógica separada de la interfaz

- **C3.1** Las reglas puras (IMEI, dinero, códigos, estados) viven en funciones sin React: `shared/lib/` y los `lib/` y `schemas/` de cada feature.
- **C3.2** Los componentes de presentación no calculan reglas de negocio ni llaman a la red; los datos llegan por *hooks* de la feature (TanStack Query).
- **C3.3** Toda petición pasa por el cliente HTTP compartido; ninguna pantalla usa `fetch` o Axios por su cuenta.
- **C3.4** El control de acceso de la interfaz es **solo visual**: el backend valida cada acción y la interfaz traduce sus errores a mensajes en español.
- **C3.5** Los tipos de la API se generan desde el Swagger del backend y no se editan a mano.
- *Se comprueba:* `grep` de `fetch`/`axios` fuera del cliente compartido; revisión de que los componentes no contienen cálculos de dominio.

## 4. Política de tests

- **C4.1** Cada requisito `RF-x` tiene al menos un test (Vitest + Testing Library + MSW) que lo cubre, con caso positivo y negativo cuando hay una condición de error.
- **C4.2** Los tests no usan la red real: el servidor se simula con MSW. Se consulta la interfaz por rol y texto accesible, no por clases CSS.
- **C4.3** `lint`, `typecheck` y `test` pasan antes de cada commit (hook pre-commit) y en la CI antes de cualquier despliegue.
- **C4.4** Un defecto corregido empieza por un test que falla.
- *Se comprueba:* la CI en verde; el hook pre-commit; `specs/verificacion.md`.

## 5. Persistencia de datos

- **C5.1** El frontend **no es dueño de datos de negocio**: el servidor es la única fuente de verdad. El estado del servidor vive en la caché de TanStack Query y se invalida tras cada mutación.
- **C5.2** El token de acceso vive solo en memoria. El de renovación se guarda en `sessionStorage` (muere con la pestaña) hasta que exista la cookie `httpOnly` de la spec 011; **nunca** en `localStorage`.
- **C5.3** El código de desbloqueo de un equipo no se guarda en el navegador, no se escribe en consola y se muestra enmascarado por defecto.
- **C5.4** El dinero jamás se calcula con decimales flotantes: se previsualiza en centavos enteros y el servidor es quien fija el total.
- **C5.5** Solo variables públicas `VITE_*`; ningún secreto en el *bundle*. Los `.env` reales no se versionan.
- *Se comprueba:* `grep` de `localStorage`; test del cliente HTTP; hook pre-commit que rechaza `.env`.

## 6. Idioma del código y de los mensajes

- **C6.1** Código, identificadores, nombres de tests y commits (Conventional Commits) van en **inglés**.
- **C6.2** Todo texto que ve una persona usuaria va en **español**, incluidos los mensajes de error del servidor ya traducidos por la interfaz.
- **C6.3** Los estados se almacenan en inglés (`IN_REPAIR`) y su etiqueta en español vive en un único lugar.
- *Se comprueba:* revisión del Pull Request.

## 7. Interfaz usable y accesible

- **C7.1** Toda pantalla con datos remotos tiene estados de **carga, vacío y error** (con reintento).
- **C7.2** Los controles táctiles miden al menos 44 px y la interfaz funciona desde 320 px de ancho.
- **C7.3** Los formularios validan antes de enviar y muestran el error junto al campo.
- *Se comprueba:* tests de estados vacío/error por pantalla; revisión visual en el Pull Request.
