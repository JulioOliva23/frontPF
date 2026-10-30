# Verificación de las specs del frontend

**Fecha:** 2026-10-30 · **Rama:** `feat/sdd-closure` (`diseño-nuevo` + `main` actualizado + specs) · **Constitución:** [docs/constitution.md](../docs/constitution.md)

Este informe sustituye al de la primera versión. Cada requisito tiene ahora un test etiquetado; el detalle de **qué test prueba cada uno** se genera solo en [trazabilidad.md](trazabilidad.md).

## 1. Qué se ejecutó

| Comprobación | Comando | Resultado |
| --- | --- | --- |
| Tipos | `npm run typecheck` | ✅ sin errores |
| Lint | `npm run lint` (`tsc -b` + oxlint) | ✅ sin avisos |
| Tests (Vitest + Testing Library + MSW) | `npx vitest run` | ✅ **31 archivos · 256 tests** (52 más que antes), sin red real |
| Build de producción | `npm run build` | ✅ |
| Trazabilidad spec → test | `npm run sdd:check` | ✅ **71 de 71 requisitos** y **202 de 202 criterios de aceptación** con test etiquetado |

## 2. Cómo se comprueba un requisito

Cada título de test lleva la etiqueta del requisito que prueba, por ejemplo `[001/RF-5.4]`. `scripts/sdd/check-traceability.mjs` (hook pre-commit y job `sdd` de la CI) falla si un requisito (`RF-n`) o un criterio (`RF-n.m`) de una spec implementada no tiene test etiquetado, o si un test cita un requisito que no existe. La spec `011` es una propuesta y está exenta.

**Reglas de diseño como tests.** La spec 010 se comprueba en [`src/test/design-rules.test.ts`](../src/test/design-rules.test.ts), que lee las fuentes: sin color lima, acento cian en botón, menú y foco, cabecera y menú oscuros, modo de impresión, ningún control menor de 44 px, ningún color hexadecimal propio en las pantallas y pares de color con contraste (texto oscuro sobre el cian).

**Límite de la herramienta:** comprueba que *existe* un test etiquetado, no que sea suficiente. Las partes puramente visuales (que se vea bien en un celular real, contraste medido) no se pueden verificar con tests de código.

## 3. Veredicto por spec

| Spec | Veredicto | Evidencia principal |
| --- | --- | --- |
| 001 Sesión y navegación por rol | ✅ Cumplida | renovación única y compartida, cola de peticiones, cierre de sesión en el servidor, protección de pantallas |
| 002 Recepción del equipo | ✅ Cumplida | IMEI asistido, historial, código sin rastro en el navegador ni en consola, ticket que no se puede recuperar, doble envío bloqueado |
| 003 Listado y búsqueda | ✅ Cumplida | filtros en la dirección sin llenar el historial, búsqueda recortada, esqueleto de carga, paginación desde la pantalla |
| 004 Detalle de la orden | ✅ Cumplida | botones según el servidor, cancelar oculto en Presupuestada, botones bloqueados en curso, código oculto al cambiar de pestaña |
| 005 Presupuestos | ✅ Cumplida | motivo mínimo del rechazo, días restantes, colas vacías |
| 006 Inventario y alertas | ✅ Cumplida | tabla con disponible / reservado / mínimo, error de compatibilidad visible |
| 007 Portal del cliente | ✅ Cumplida | sin datos internos aunque el objeto los traiga, red caída, orden cancelada |
| 008 Administración | ✅ Cumplida | editar y reactivar, sección vedada a recepción |
| 009 Panel de control | ✅ Cumplida | marcador y guion, alerta y aviso, saludo y fecha con reloj controlado |
| 010 Identidad visual | ⚠️ Cumplida en código; falta lo que solo se ve | reglas de diseño en verde; **sin revisión en un celular real ni medición de contraste** |
| 011 Cookie protegida | — Propuesta | solo `withCredentials` (RF-4.1) existe |

## 4. Hallazgos de la primera verificación

| ID | Qué ocurría | Estado |
| --- | --- | --- |
| **H1** (media) | La interfaz mostraba tal cual los mensajes en inglés del servidor | ✅ **Resuelto en el origen**: el backend ahora responde todo en español ([backPF `feat/sdd-closure`](https://github.com/JulioOliva23/backPF/tree/feat/sdd-closure)). El frontend sigue mostrando el mensaje del servidor, así que **depende de desplegar ese cambio** |
| **H2** (baja) | 5 controles medían 36 px | ✅ **Corregido**: ahora 44 px; lo impide `design-rules.test` |
| **H3** (baja) | Existía la baja de repuestos en la capa de datos pero ninguna pantalla la usa | ⏳ Pendiente (tarea T12 de la spec 006); no es un incumplimiento, es una función que falta |
| **H4** (baja) | ~25 comportamientos sin test | ✅ **Cubiertos**: 71/71 requisitos y 202/202 criterios con test etiquetado |

Además, al escribir los tests aparecieron dos errores **de las specs**, no del código, que se corrigieron: la tabla de inventario muestra disponible / reservado / **mínimo** (no el físico), y el aviso usa naranja además de ámbar.

### Límites conocidos

- **Visual:** no se revisó en un celular real ni se midió el contraste (WCAG AA). Son las tareas T8 y T9 de la spec 010.
- **Dependencia del backend:** los mensajes en español dependen de que se despliegue la rama `feat/sdd-closure` del backend.
- **Dudas abiertas:** 7 tareas esperan una decisión del cliente (recuperar contraseña, columnas de la tabla, cancelación tras aprobar, aspecto del portal público, editar marca o modelo, indicador de retrasadas, indicador de presupuestos vencidos).

## 5. Reglas de la constitución

| Regla | Comprobación | Resultado |
| --- | --- | --- |
| C2.3 / C4.1 Todo requisito tiene un test | `npm run sdd:check` | ✅ 71/71 y 202/202 |
| C1.1 Stack cerrado | `package.json` | ✅ sin librería de estado global ni kit de UI |
| C3.3 Toda petición por el cliente HTTP | `grep` de `fetch(` y `axios` | ✅ |
| C5.2 Nunca `localStorage` | `grep` y test del check-in | ✅ el código de desbloqueo tampoco queda en ningún almacenamiento |
| C5.3 Sin `console` con datos del equipo | test del check-in (espías de consola) | ✅ |
| C6.2 Español | mensajes propios y del servidor | ✅ (el servidor, tras desplegar su rama) |
| C7.2 Controles de 44 px | `design-rules.test` | ✅ |
| C4.3 Lint, tipos y tests antes de cada commit y en la CI | hook pre-commit y workflows | ✅ (más el job `sdd`) |

## 6. Veredicto

**La spec del frontend está cumplida.** Las diez specs implementadas tienen test etiquetado para sus 71 requisitos y 202 criterios, los 256 tests pasan, y los incumplimientos de la primera verificación están corregidos o resueltos en su origen. Queda por hacer lo que un test no puede verificar —revisión visual en un celular real y contraste medido— y las decisiones del cliente.
