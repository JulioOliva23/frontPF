# Tareas 011 · Sesión con cookie protegida (frontend)

Leyenda: `[x]` hecha · `[ ]` pendiente. Spec **propuesta**; las tareas dependen de la [spec 009 del backend](https://github.com/JulioOliva23/backPF/tree/main/specs/009-sesion-con-cookie-httponly).

- [x] **T1 · Enviar cookies en todas las peticiones** — RF-4.1
  Hecho cuando: pasa "sends credentials so the httpOnly refresh cookie can travel" (`withCredentials: true`).
- [ ] **T2 · Esperar la decisión de dominios (backend T2)** — dudas abiertas
  Hecho cuando: se decide si la API se sirve bajo el dominio del frontend o con cookie entre sitios.
- [ ] **T3 · Reescritura en `vercel.json` y `VITE_API_URL` de mismo origen** — RNF-3
  Hecho cuando: en la vista previa de Vercel, `/api/v1/auth/login` responde a través del dominio del frontend.
- [ ] **T4 · Cabecera `X-Requested-With` en refresh y logout** — RF-4.2
  Hecho cuando: un test de `httpClient` comprueba la cabecera en ambas llamadas.
- [ ] **T5 · `auth-service` sin `refreshToken` en el cuerpo** — RF-2.1, RF-3.1
  Hecho cuando: `refresh()` y `logout()` llaman sin cuerpo y los tests del servicio lo comprueban.
- [ ] **T6 · `AuthProvider` sin `sessionStorage`** — RF-1
  Hecho cuando: un test inicia sesión y comprueba que `sessionStorage` no contiene ninguna credencial de renovación.
- [ ] **T7 · Restaurar la sesión al arrancar vía cookie** — RF-2
  Hecho cuando: pasan tests de «restaura con refresh sin cuerpo», «queda anónimo si falla» y «una sola llamada con StrictMode».
- [ ] **T8 · Limpiar la clave heredada** — RF-5.2
  Hecho cuando: un test siembra `servicio_refresh_token` y comprueba que se borra al arrancar.
- [ ] **T9 · Prueba manual en producción** — criterio de finalización
  Hecho cuando: iniciar sesión, recargar y cerrar sesión funciona en el celular y en el escritorio, y el almacenamiento del navegador no contiene la credencial.
- [ ] **T10 · Retirar el esquema anterior** — RF-5
  Hecho cuando: el backend elimina el campo del cuerpo (backend T10) y el frontend ya no lo lee.
