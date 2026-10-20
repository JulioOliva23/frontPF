# servicio_front

SPA del **Sistema de Gestión para Servicio Técnico de Celulares** (React 19 + Vite + TypeScript). Reglas y mapa de rutas: [`ai-context/constitution/frontend.md`](../ai-context/constitution/frontend.md).

## Ejecutar

```bash
cp .env.example .env.local      # VITE_API_URL=http://localhost:3000/api/v1
npm install
npm run dev                     # http://localhost:5173 (servicio_back en :3000)
```

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | `tsc -b` + build de producción en `dist/` |
| `npm run typecheck` | Chequeo estático estricto |
| `npm run lint` | `tsc -b` + oxlint |
| `npm test` | Vitest + Testing Library + MSW |
| `npm run gen:schema` | Regenera `src/shared/api/schema.gen.ts` desde `http://localhost:3000/api-json` (backend corriendo) |
