# Specs del frontend (Spec-Driven Development)

Documentación escrita **de forma retroactiva** el 2026-10-29 a partir del código y de los tests existentes, más una propuesta nueva; la 012 se escribió junto con la funcionalidad (2026-10-30). Rige la [constitución](../docs/constitution.md). El comportamiento del servidor se define en [backPF](https://github.com/JulioOliva23/backPF/tree/main/specs).

Cada carpeta tiene tres archivos:

| Archivo | Contenido |
| --- | --- |
| `spec.md` | **Qué y por qué**: contexto, usuarios, historias, requisitos `RF-x` en EARS, no funcionales, casos límite, fuera de alcance, criterios de finalización y dudas `[NECESITA ACLARACIÓN]` |
| `plan.md` | **Cómo**: módulos, datos (JSON), algoritmos, contrato de uso, decisiones con su alternativa descartada y estrategia de tests, marcando los RF que cubre cada parte |
| `tasks.md` | Tareas de 20–30 min con `Hecho cuando:`; `[x]` hecha · `[~]` parcial · `[ ]` pendiente |

| Spec | Estado | Hechas | Pendientes |
| --- | --- | --- | --- |
| [001 · Sesión y navegación por rol](001-sesion-y-navegacion-por-rol/spec.md) | ✅ Implementada | 12 | 1 (decisión del cliente) |
| [002 · Recepción del equipo](002-recepcion-del-equipo/spec.md) | ✅ Implementada | 13 | 0 |
| [003 · Listado y búsqueda de órdenes](003-listado-y-busqueda-de-ordenes/spec.md) | ✅ Implementada | 11 | 1 (decisión del cliente) |
| [004 · Detalle de la orden](004-detalle-de-orden/spec.md) | ✅ Implementada | 14 | 1 (decisión del cliente) |
| [005 · Presupuestos](005-presupuestos/spec.md) | ✅ Implementada | 12 | 1 (depende del backend 010) |
| [006 · Inventario y alertas](006-inventario-y-alertas/spec.md) | ✅ Implementada | 12 | 1 (baja de repuestos desde la interfaz) |
| [007 · Portal del cliente](007-portal-del-cliente/spec.md) | ✅ Implementada | 12 | 1 (decisión del cliente) |
| [008 · Administración](008-administracion/spec.md) | ✅ Implementada | 13 | 1 (decisión del cliente) |
| [009 · Panel de control](009-panel-de-control/spec.md) | ✅ Implementada | 8 | 2 (decisión del cliente / backend) |
| [010 · Identidad visual](010-identidad-visual/spec.md) | ✅ Implementada (actualizada al diseño oscuro con mascota) | 8 | 2 (revisión en celular, contraste) |
| [011 · Cookie protegida](011-sesion-con-cookie-httponly/spec.md) | **Propuesta** (nueva) | 1 | 9 |
| [012 · Aprobaciones del agente IA](012-aprobaciones-del-agente-ia/spec.md) | ✅ Implementada (2026-10-30) | 7 | 1 (test del aviso emergente) |
| **Total** | | **123** | **21** |

## Cómo se trabaja con SDD en este repositorio

1. **Spec primero:** el cambio de comportamiento empieza en el `spec.md` (un `RF-x` con criterios EARS).
2. **Test después, código al final:** cada test lleva en su título la etiqueta del requisito que prueba, por ejemplo `it('rejects … [001/RF-5.4]')`.
3. **Verificación automática:** `npm run sdd:check` falla si un requisito o criterio de aceptación de una spec implementada no tiene test, o si un test cita un requisito inexistente. Lo ejecutan el hook pre-commit y el job `sdd` de la CI.
4. **Reglas de diseño como tests:** `src/test/design-rules.test.ts` impide reintroducir los acentos lima o cian, controles menores de 44 px o colores propios en las pantallas.
5. **Tareas con evidencia:** `[x]` en `tasks.md` solo cuando su "Hecho cuando" se cumple y se cita la evidencia.
6. **Informes:** [verificacion.md](verificacion.md) (resultado de las pruebas y veredicto) y [trazabilidad.md](trazabilidad.md) (requisito → tests, generado con `npm run sdd:report`).

**Regla del proyecto:** si el código y una spec discrepan, gana la spec (constitución C2.2).
