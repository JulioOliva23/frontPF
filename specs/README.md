# Specs del frontend (Spec-Driven Development)

Documentación escrita **de forma retroactiva** el 2026-10-29 a partir del código y de los tests existentes, más una propuesta nueva. Rige la [constitución](../docs/constitution.md). El comportamiento del servidor se define en [backPF](https://github.com/JulioOliva23/backPF/tree/main/specs).

Cada carpeta tiene tres archivos:

| Archivo | Contenido |
| --- | --- |
| `spec.md` | **Qué y por qué**: contexto, usuarios, historias, requisitos `RF-x` en EARS, no funcionales, casos límite, fuera de alcance, criterios de finalización y dudas `[NECESITA ACLARACIÓN]` |
| `plan.md` | **Cómo**: módulos, datos (JSON), algoritmos, contrato de uso, decisiones con su alternativa descartada y estrategia de tests, marcando los RF que cubre cada parte |
| `tasks.md` | Tareas de 20–30 min con `Hecho cuando:`; `[x]` hecha · `[~]` parcial · `[ ]` pendiente |

| Spec | Estado | Hechas | Parciales | Pendientes |
| --- | --- | --- | --- | --- |
| [001 · Sesión y navegación por rol](001-sesion-y-navegacion-por-rol/spec.md) | Implementada | 10 | 1 | 2 |
| [002 · Recepción del equipo](002-recepcion-del-equipo/spec.md) | Implementada | 8 | 2 | 3 |
| [003 · Listado y búsqueda de órdenes](003-listado-y-busqueda-de-ordenes/spec.md) | Implementada | 8 | 0 | 4 |
| [004 · Detalle de la orden](004-detalle-de-orden/spec.md) | Implementada | 10 | 1 | 4 |
| [005 · Presupuestos](005-presupuestos/spec.md) | Implementada | 9 | 1 | 3 |
| [006 · Inventario y alertas](006-inventario-y-alertas/spec.md) | Implementada | 9 | 1 | 3 |
| [007 · Portal del cliente](007-portal-del-cliente/spec.md) | Implementada | 8 | 0 | 5 |
| [008 · Administración](008-administracion/spec.md) | Implementada | 10 | 1 | 3 |
| [009 · Panel de control](009-panel-de-control/spec.md) | Implementada | 6 | 1 | 3 |
| [010 · Identidad visual](010-identidad-visual/spec.md) | Implementada en su mayoría | 6 | 0 | 5 |
| [011 · Cookie protegida](011-sesion-con-cookie-httponly/spec.md) | **Propuesta** (nueva) | 1 | 0 | 9 |
| **Total** | | **85** | **8** | **44** |

El resultado de ejecutar los tests contra cada requisito, los hallazgos y el veredicto están en [verificacion.md](verificacion.md).

**Regla del proyecto:** si el código y una spec discrepan, gana la spec (constitución C2.2). Un cambio de comportamiento empieza actualizando su `spec.md`.
