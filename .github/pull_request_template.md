## Qué cambia y por qué

<!-- Una o dos frases. Enlaza la spec: specs/NNN-nombre/spec.md -->

## Checklist SDD (docs/constitution.md)

- [ ] El comportamiento nuevo o modificado está en un `spec.md` (requisito `RF-x` en EARS) **antes** del código (C2.1, C2.2).
- [ ] Cada requisito tocado tiene un test con su etiqueta en el título, por ejemplo `[001/RF-2.2]` (C4.1, C4.5).
- [ ] `npm run sdd:check` pasa (lo ejecuta también la CI y el pre-commit).
- [ ] Las tareas hechas están marcadas `[x]` en `tasks.md` con su evidencia; las dudas siguen como `[NECESITA ACLARACIÓN]` (C2.4).
- [ ] Lint, tipos y tests pasan (`npm run lint`, `npm run typecheck`, `npm test`) y las reglas de diseño (`src/test/design-rules.test.ts`) siguen en verde.
- [ ] Todo texto que ve una persona está en español (C6.2) y los controles que se pulsan miden al menos 44 px (C7.2).
- [ ] Si cambia un contrato con el backend, se regeneró `schema.gen.ts` con `npm run gen:schema` y la spec del backend lo refleja.
