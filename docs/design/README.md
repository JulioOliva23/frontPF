# Interfaz oscura de Servicio Técnico

El diseño aprobado está aplicado al frontend React en la rama de trabajo `sergioFront`.

## Diseño y comportamiento

- Degradado de fondo #1A0B2E → #0F241C, superficies oscuras semitransparentes, bordes lavanda y acentos menta.
- Tipografía Plus Jakarta Sans; JetBrains Mono para identificadores.
- Bienvenida y acceso, panel, órdenes, seguimiento público y componentes compartidos con la misma paleta.
- Barra lateral en escritorio y navegación inferior por rol en móvil. El menú móvil gestiona foco, Escape, scroll y contenido de fondo inerte.
- Las órdenes se presentan como tarjetas en móvil y como tabla en escritorio usando los mismos datos y enlaces.
- Se mantienen rutas, API, validaciones, permisos, estados reales y campos permitidos del seguimiento. Los números del mockup no se usan como datos de la aplicación.
- El ticket de ingreso tiene colores específicos para impresión. Se respeta la preferencia de movimiento reducido.

## Archivos visuales

- `mobile-dark-ui-kit-v1.png`: referencia visual original aprobada.
- `mobile-dark-ui-kit-v1.prompt.txt`: prompt original del mockup.
- `../../public/brand/repair-cat.png`: mascota PNG con transparencia, generada mediante imagegen a partir del personaje suministrado.
- `repair-cat.prompt.txt`: prompt de la mascota.
- `applied/`: capturas de la aplicación real durante la revisión; las pantallas usan los datos demo disponibles.

## Comprobación

Verificado con `npm run lint`, `npm test` (206 pruebas en 30 archivos) y `npm run build`. La revisión de navegador comprende acceso, panel, órdenes, inventario, menú y portal en móvil y escritorio. Los análisis automáticos de accesibilidad incluyen comprobaciones pendientes de contraste sobre fondos con degradados/transparencias; no constituyen una certificación WCAG.
