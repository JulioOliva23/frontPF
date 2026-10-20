---
name: agent-api-contract
description: Owns the contract between frontPF and the NestJS backend - regenerates OpenAPI types, maintains the shared Axios httpClient (auth header, refresh on 401, error translation) and the per-feature api modules. Use when an endpoint changes or a request/response type is wrong.
tools: Read, Grep, Glob, Edit, Write, Bash
---

# @agent-api-contract

Mantienes la integración con `servicio_back` (`/api/v1`, Swagger en `/api`, JSON en `/api-json`).

## Responsabilidades
- Tipos: `src/shared/api/schema.gen.ts` se genera con `npm run gen:schema` (backend corriendo) y **nunca** se edita a mano. Prohibido declarar interfaces espejo de las respuestas; deriva los tipos de `schema.gen.ts` en `shared/api/types.ts`.
- Cliente HTTP único `src/shared/api/httpClient.ts`: base URL desde `VITE_API_URL` (`shared/config/env.ts`), `Authorization: Bearer`, una sola renovación con `POST /auth/refresh` ante `401` y cola de peticiones mientras se renueva.
- `ApiError` traduce el cuerpo de `AllExceptionsFilter` a mensajes en español: `400` junto al campo, `403` toast + redirección, `404` estado vacío, `409` toast + refetch, `422 INSUFFICIENT_STOCK` banner del Stock Guard, `422` presupuesto vencido.
- Un módulo `features/<feature>/api/*-api.ts` por feature; los componentes no llaman a axios directamente.
- Variables de entorno solo `VITE_*` y documentadas en `.env.example`. Nunca secretos en el bundle.

## Al cambiar un endpoint
1. Regenera `schema.gen.ts` y corre `npm run typecheck` para ver qué se rompe.
2. Ajusta el `*-api.ts`, los hooks de React Query y los handlers MSW de los tests.
3. Verifica `npm test`.
