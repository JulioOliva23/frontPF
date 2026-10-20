# Servicio Técnico de Celulares · Frontend

SPA del **Sistema de Gestión para Servicio Técnico de Celulares**. Recepción, técnicos y administración gestionan órdenes de trabajo, presupuestos e inventario; el cliente consulta el estado de su equipo desde un portal público.

| Parte | Repositorio | URL desplegada |
| --- | --- | --- |
| Frontend (React) | este repo | _pendiente_ |
| Backend (NestJS) + base de datos | [JulioOliva23/ProyectoFinal](https://github.com/JulioOliva23/ProyectoFinal) | _pendiente_ |

## Equipo

| Integrante | GitHub |
| --- | --- |
| Julio Oliva | [@JulioOliva23](https://github.com/JulioOliva23) |
| Fabricio Pinto Lozada | [@fabriciopintolozada-11](https://github.com/fabriciopintolozada-11) |
| Sergio Miguel Cisneros Salazar | [@sergiomiguelcisnerossalazar](https://github.com/sergiomiguelcisnerossalazar) |

## Stack

React 19 · Vite 8 · TypeScript 6 (`strict`) · Tailwind CSS 4 · React Router 7 · TanStack Query 5 · react-hook-form + zod · Axios · tipos generados con `openapi-typescript` · Vitest + Testing Library + MSW · oxlint.

## Funcionalidades por rol

| Ruta | Pantalla | Roles |
| --- | --- | --- |
| `/auth/login` | Inicio de sesión | Público |
| `/ordenes` | Listado y tablero de órdenes, filtros por estado | Admin, Recepción, Técnico (solo las suyas) |
| `/ordenes/nueva` | Recepción del equipo: IMEI con Luhn, check-in cosmético, código de desbloqueo (PIN, patrón o contraseña) | Admin, Recepción |
| `/ordenes/:id` | Detalle: diagnóstico, asignación de técnico, transiciones de estado, Stock Guard, revelado auditado del código, historial de auditoría | Admin, Recepción, Técnico |
| `/presupuestos` · `/presupuestos/:workOrderId` | Editor de presupuesto versionado, envío y decisión del cliente | Admin, Recepción |
| `/inventario` · `/inventario/alertas` | Catálogo de repuestos, compatibilidad por modelo, ingresos/ajustes de stock, alertas de stock bajo | Admin, Recepción |
| `/portal-cliente` | Seguimiento del equipo por código, sin login | Público y Cliente |

El RBAC de la UI es solo visual: el backend valida cada acción y la UI traduce sus errores (`403`, `409`, `422`) a mensajes en español.

## Arquitectura

```text
src/
├── app/                  # router, layout, sidebar, providers (React Query, auth, toasts)
├── features/
│   ├── auth/             # login, sesión, ProtectedRoute, ruta por defecto por rol
│   ├── work-orders/      # listado, recepción, detalle, transiciones, auditoría
│   ├── budgets/          # editor, envío y decisión
│   ├── inventory/        # repuestos, stock, alertas
│   └── customer-portal/  # seguimiento público
├── shared/
│   ├── api/              # httpClient (Axios + refresh), query-keys, schema.gen.ts
│   ├── components/       # Button, Card, Modal, Badge, Pagination, estados vacío/error/carga…
│   ├── config/env.ts     # lectura de variables VITE_*
│   └── lib/              # imei, money, tracking-code, estados de la OT
└── test/                 # servidor MSW, render con providers, fixtures
```

- Toda petición pasa por `shared/api/httpClient.ts`: agrega `Authorization: Bearer`, renueva el token una sola vez ante `401` y convierte los errores en `ApiError`.
- Los tipos de la API se generan desde el Swagger del backend en `shared/api/schema.gen.ts` (no se editan a mano).
- El estado del servidor vive en React Query; cada mutación invalida sus claves.

## Ejecutar en local

Requisitos: Node.js 24, npm 11 y el [backend](https://github.com/JulioOliva23/ProyectoFinal) corriendo en `http://localhost:3000`.

```bash
cp .env.example .env.local
npm install            # también activa el hook pre-commit (core.hooksPath → .githooks)
npm run dev            # http://localhost:5173
```

En desarrollo Vite redirige `/api` a `http://localhost:3000`, así que `VITE_API_URL` puede quedar vacío.

### Variables de entorno

| Variable | Descripción | Por defecto |
| --- | --- | --- |
| `VITE_API_URL` | URL base de la API (en producción, `https://<backend>/api/v1`) | `/api/v1` |
| `VITE_API_TIMEOUT` | Timeout de las peticiones en ms | `10000` |

Solo van variables públicas `VITE_*`; ningún secreto se incluye en el bundle. Los archivos `.env` reales están en `.gitignore`.

### Despliegue

Desplegado en [Vercel](https://vercel.com) con [`vercel.json`](vercel.json) (build de Vite y reescritura de todas las rutas a `index.html`, necesaria para la SPA).

1. En Vercel: *Add New → Project*, importar este repo (Vercel detecta Vite).
2. En *Environment Variables* agregar `VITE_API_URL=https://<backend>.onrender.com/api/v1` y desplegar. Si la cambias después, hay que redesplegar porque Vite la incrusta en el build.
3. Agregar la URL de Vercel a `CORS_ORIGINS` del backend en Render.

Cada PR obtiene una URL de preview y `main` se despliega a producción cuando la CI pasa.

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | `tsc -b` + build de producción en `dist/` |
| `npm run preview` | Sirve el build localmente |
| `npm run typecheck` | Chequeo estático estricto |
| `npm run lint` | `tsc -b` + oxlint |
| `npm test` | Vitest + Testing Library + MSW |
| `npm run gen:schema` | Regenera `src/shared/api/schema.gen.ts` desde `http://localhost:3000/api-json` |

## Calidad: hooks, CI y subagentes

### Hooks

| Hook | Dónde | Qué hace |
| --- | --- | --- |
| Git `pre-commit` | [`scripts/hooks/hook-pre-commit.sh`](scripts/hooks/hook-pre-commit.sh) (se activa con `npm install`) | Bloquea el commit si hay un `.env` en stage o si fallan lint, typecheck o tests |
| Claude Code `PreToolUse` | [`.claude/settings.json`](.claude/settings.json) → [`claude-guard.sh`](scripts/hooks/claude-guard.sh) | Impide que el agente lea o edite `.env` reales, corra comandos destructivos, `git push --force` o `git commit --no-verify` |
| Claude Code `PostToolUse` | [`.claude/settings.json`](.claude/settings.json) → [`claude-post-edit.sh`](scripts/hooks/claude-post-edit.sh) | Tras cada edición en `src/` corre oxlint sobre el archivo y los tests de Vitest relacionados; si fallan, el agente recibe el error y lo corrige |

### CI/CD

| Workflow | Jobs | Cuándo |
| --- | --- | --- |
| [`ci.yml`](.github/workflows/ci.yml) | `quality`: lint, typecheck, Vitest con cobertura y build de producción | Push a `main` y cada PR |
| [`hooks-and-agents.yml`](.github/workflows/hooks-and-agents.yml) | `git-hooks`: hook pre-commit sobre el diff · `claude-hooks`: prueba los casos permitidos/bloqueados de `claude-guard.sh` · `subagents`: valida el frontmatter de los subagentes | Push a `main` y cada PR |

Cada job publica un reporte en el resumen del run (Actions → run → Summary). **Despliegue continuo:** Vercel despliega cada PR como *preview* y promueve `main` a producción solo cuando los checks de GitHub pasan (*Deployment Checks*).

### Subagentes

Definidos en [`.claude/agents/`](.claude/agents/):

| Agente | Cuándo usarlo |
| --- | --- |
| `@agent-ui-feature` | Páginas, componentes, hooks y formularios de una feature |
| `@agent-api-contract` | Tipos OpenAPI, `httpClient` y módulos `api/` cuando cambia un endpoint |
| `@agent-qa-frontend` | Tests con Vitest/MSW y auditoría de RBAC, precios y código de desbloqueo |

## Flujo de trabajo

Ramas `feat/*`, `fix/*` y `docs/*` desde `main`, integradas con Pull Request revisado por otro integrante y con la CI en verde (`main` protegida). Commits con [Conventional Commits](https://www.conventionalcommits.org/).
