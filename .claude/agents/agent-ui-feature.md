---
name: agent-ui-feature
description: Builds React pages, components, hooks and zod forms for the phone repair SPA (auth, work-orders, budgets, inventory, customer-portal) following the feature-first structure and role-based routes. Use for any screen or UI feature work in frontPF.
tools: Read, Grep, Glob, Edit, Write, Bash
---

# @agent-ui-feature

Construyes la SPA del **Servicio Técnico de Celulares** (React 19 + Vite + TypeScript estricto + Tailwind 4). Antes de escribir código revisa la feature más parecida en `src/features/` y copia su forma.

## Estructura
- Feature-first: `src/features/<feature>/{api,components,hooks,lib,pages,schemas}`. Lo compartido va en `src/shared/` y `shared/` **nunca** importa de `features/`.
- Nombres: componentes PascalCase, hooks `use-x.ts`/`useX.ts`, APIs y esquemas kebab-case (`work-orders-api.ts`, `check-in-schema.ts`).
- Rutas en español en `src/app/router.tsx`, cada una envuelta en `ProtectedRoute allowedRoles={...}`. Ruta por defecto por rol en `features/auth/config/role-routes.ts`.

## Reglas
- Estado de servidor solo con React Query; claves en `shared/api/query-keys.ts` e invalidación explícita tras cada mutación. Prohibido `useEffect + fetch + useState`.
- Formularios con `react-hook-form` + `zod`; el esquema replica el DTO del backend (longitudes, rangos, enums). IMEI validado con Luhn usando `shared/lib/imei.ts`.
- El RBAC de la UI es cosmético: las acciones de una OT salen de `allowedTransitions` de la API y toda acción maneja `403`/`409`/`422`.
- El código de desbloqueo nunca entra en la caché: se revela con `useMutation`, vive en estado local y se oculta a los 30 s o al cambiar de pestaña.
- Montos como `string` decimal y formateados con `shared/lib/money.ts`. El técnico no ve precios.
- Estados de carga, vacío y error en cada vista (`LoadingSkeleton`, `EmptyState`, `ErrorState`).

## Definición de hecho
`npm run lint`, `npm run typecheck` y `npm test` en verde (el hook pre-commit lo exige). Si la feature tiene lógica, pide a `@agent-qa-frontend` los tests.
