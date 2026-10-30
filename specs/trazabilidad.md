## Trazabilidad spec → test

| Spec | Requisitos | Con test | Estado |
| --- | --- | --- | --- |
| 001-sesion-y-navegacion-por-rol | 8 | 8 | ✅ |
| 002-recepcion-del-equipo | 7 | 7 | ✅ |
| 003-listado-y-busqueda-de-ordenes | 8 | 8 | ✅ |
| 004-detalle-de-orden | 11 | 11 | ✅ |
| 005-presupuestos | 6 | 6 | ✅ |
| 006-inventario-y-alertas | 6 | 6 | ✅ |
| 007-portal-del-cliente | 7 | 7 | ✅ |
| 008-administracion | 7 | 7 | ✅ |
| 009-panel-de-control | 6 | 6 | ✅ |
| 010-identidad-visual | 5 | 5 | ✅ |
| 011-sesion-con-cookie-httponly | _propuesta_ | — | exenta hasta que se implemente |

71 de 71 requisitos tienen al menos un test etiquetado.
202 de 202 criterios de aceptación (RF-n.m) tienen su propio test etiquetado.

## Requisito → tests

### 001-sesion-y-navegacion-por-rol

| Requisito | Tests que lo prueban |
| --- | --- |
| RF-1 | `RF-1.1` validates required fields before calling the API _(LoginPage.test.tsx)_<br>`RF-1.2` shows the backend message on bad credentials _(LoginPage.test.tsx)_<br>`RF-1.3` asks to wait when rate limited _(LoginPage.test.tsx)_<br>`RF-1.4` falls back to a generic message for unexpected errors _(LoginPage.test.tsx)_<br>`RF-1.5` shows progress and sends a single request even if the button is pressed again _(LoginPage.test.tsx)_<br>`RF-1.1` accepts valid credentials _(login-schema.test.ts)_<br>`RF-1.1` rejects an empty username _(login-schema.test.ts)_<br>`RF-1.1` rejects a username longer than 80 characters _(login-schema.test.ts)_<br>`RF-1.1` rejects an empty password _(login-schema.test.ts)_ |
| RF-2 | `RF-2.1` opens the dashboard at "/" for the front desk _(router.test.tsx)_<br>`RF-2.1` lands technicians on their orders with a role-filtered menu, and logs out _(router.test.tsx)_ |
| RF-3 | `RF-3.1` hides budgets and inventory from technicians (RN-07) _(navigation.test.ts)_<br>`RF-3.2` shows the full front desk menu to reception and admin _(navigation.test.ts)_<br>`RF-3.3` shows the Administración section to ADMIN only (US-F14) _(navigation.test.ts)_<br>`RF-3.4` gives customers no staff links _(navigation.test.ts)_<br>`RF-3.5` does not highlight a parent item while on a sibling route _(navigation.test.ts)_ |
| RF-4 | `RF-4.3` only accepts in-app return paths _(router.test.tsx)_<br>`RF-4.1` sends anonymous visitors from / to the login _(router.test.tsx)_<br>`RF-4.2` keeps technicians out of front-desk routes _(router.test.tsx)_<br>`RF-4.2` sends technicians away from budgets to their orders (RN-07) _(RoleGuard.test.tsx)_<br>`RF-4.1` sends anonymous visitors to the login _(RoleGuard.test.tsx)_<br>`RF-4.2` sends customers to the portal _(RoleGuard.test.tsx)_ |
| RF-5 | `RF-5.4` takes the user to the login, remembering the page, when the refresh fails _(router.test.tsx)_<br>`RF-5.1` restores the session with a single refresh even under StrictMode double effects _(AuthProvider.test.tsx)_<br>`RF-5.2` ends anonymous when there is no stored session _(AuthProvider.test.tsx)_<br>`RF-5.3` shares one refresh among concurrent 401s and retries all of them _(httpClient.test.ts)_<br>`RF-5.6` queues a request issued while a refresh is running instead of sending the old token _(httpClient.test.ts)_<br>`RF-5.4` reports the expired session once when the refresh fails _(httpClient.test.ts)_<br>`RF-5.5` does not report an expired session for anonymous 401s _(httpClient.test.ts)_<br>`RF-5.3` refreshes once on 401 and retries the request _(httpClient.test.ts)_<br>`RF-5.5` never tries to refresh a failed login _(httpClient.test.ts)_ |
| RF-6 | `RF-6.1` lands technicians on their orders with a role-filtered menu, and logs out _(router.test.tsx)_<br>`RF-6.1` closes the session on the server, clears the stored one and ends anonymous _(AuthProvider.test.tsx)_ |
| RF-7 | `RF-7.1` shows a 404 page with navigation for unknown paths _(router.test.tsx)_<br>`RF-7.1` offers the login on a 404 when nobody is signed in _(router.test.tsx)_<br>`RF-7.2` replaces a crashed page with a fallback instead of a blank screen _(router.test.tsx)_<br>`RF-7.3` asks to reload when a lazy chunk cannot be fetched _(router.test.tsx)_<br>`RF-7.3` recognises chunk load errors only _(router.test.tsx)_<br>`RF-7.4` redirects legacy paths _(router.test.tsx)_<br>`RF-7.1` shows the 404 page, linked to the role landing page, for unknown paths _(router.test.tsx)_ |
| RF-8 | `RF-8.1` opens the mobile drawer and highlights only the exact menu item _(router.test.tsx)_ |

### 002-recepcion-del-equipo

| Requisito | Tests que lo prueban |
| --- | --- |
| RF-1 | `RF-1.1` flags an invalid IMEI in real time and never calls the API (RN-02) _(CheckInPage.test.tsx)_<br>`RF-1.2` flags an invalid IMEI in real time and never calls the API (RN-02) _(CheckInPage.test.tsx)_<br>`RF-1.1` formats the IMEI while typing _(CheckInPage.test.tsx)_<br>`RF-1.3` accepts a formatted, Luhn-valid IMEI and normalizes it _(check-in-schema.test.ts)_<br>`RF-1.2` rejects an IMEI whose check digit is wrong before submitting (RN-02) _(check-in-schema.test.ts)_<br>`RF-1.2` rejects a wrong check digit and malformed input _(imei.test.ts)_<br>`RF-1.3` normalizes and formats for display _(imei.test.ts)_ |
| RF-2 | `RF-2.1` shows the earlier repairs of a known IMEI _(CheckInPage.test.tsx)_<br>`RF-2.2` treats an unregistered IMEI as a new device, not as an error _(CheckInPage.test.tsx)_ |
| RF-3 | `RF-3.1` asks for the customer, the model, the problem, the five zones and the lock type _(CheckInPage.test.tsx)_<br>`RF-3.3` rejects battery above 100 and a past promise date _(check-in-schema.test.ts)_<br>`RF-3.4` rejects battery above 100 and a past promise date _(check-in-schema.test.ts)_<br>`RF-3.2` leaves the battery out of the payload when it is not informed, e.g. a phone that does not turn on _(check-in-schema.test.ts)_ |
| RF-4 | `RF-4.1` masks the PIN by default and shows the ticket with the tracking code after creating the order (SUP-05) _(CheckInPage.test.tsx)_<br>`RF-4.4` does not keep the unlock code in the browser nor print it to the console _(CheckInPage.test.tsx)_<br>`RF-4.2` accepts a 4-node pattern and a device without lock _(check-in-schema.test.ts)_<br>`RF-4.3` builds the API payload without empty fields nor an unlock code for NONE _(check-in-schema.test.ts)_ |
| RF-5 | `RF-5.1` masks the PIN by default and shows the ticket with the tracking code after creating the order (SUP-05) _(CheckInPage.test.tsx)_<br>`RF-5.2` cannot show the tracking code again once the ticket is closed _(CheckInPage.test.tsx)_ |
| RF-6 | `RF-6.1` shows the reason and keeps what was typed when the server rejects the intake _(CheckInPage.test.tsx)_<br>`RF-6.2` sends a single request while the first one is still in flight _(CheckInPage.test.tsx)_ |
| RF-7 | `RF-7.1` keeps technicians out of front-desk routes _(router.test.tsx)_ |

### 003-listado-y-busqueda-de-ordenes

| Requisito | Tests que lo prueban |
| --- | --- |
| RF-1 | `RF-1.1` lists orders in a table and filters by status _(WorkOrdersPage.test.tsx)_<br>`RF-1.2` lists orders in a table and filters by status _(WorkOrdersPage.test.tsx)_<br>`RF-1.1` switches to the board with one column per status _(WorkOrdersPage.test.tsx)_ |
| RF-2 | `RF-2.1` lists orders in a table and filters by status _(WorkOrdersPage.test.tsx)_<br>`RF-2.2` goes back to every order with the "Todos" chip _(WorkOrdersPage.test.tsx)_ |
| RF-3 | `RF-3.1` lists the active technicians and filters by the chosen one _(WorkOrdersPage.test.tsx)_<br>`RF-3.2` combines the technician with the status chips _(WorkOrdersPage.test.tsx)_<br>`RF-3.3` is not offered to technicians, who only see their queue (RN-06) _(WorkOrdersPage.test.tsx)_ |
| RF-4 | `RF-4.1` sends a single request with the full text once typing stops _(WorkOrdersPage.test.tsx)_<br>`RF-4.2` commits at once on Enter _(WorkOrdersPage.test.tsx)_<br>`RF-4.3` ignores the spaces around the search text _(WorkOrdersPage.test.tsx)_<br>`RF-4.1` calls once with the last arguments after the delay _(use-debounced-callback.test.ts)_ |
| RF-5 | `RF-5.1` restores the filters from the URL _(WorkOrdersPage.test.tsx)_<br>`RF-5.2` ignores an unknown status in the URL _(WorkOrdersPage.test.tsx)_<br>`RF-5.3` replaces the history entry instead of adding one per keystroke _(WorkOrdersPage.test.tsx)_ |
| RF-6 | `RF-6.1` shows technicians only their orders and hides the intake button (RN-06) _(WorkOrdersPage.test.tsx)_ |
| RF-7 | `RF-7.1` explains the empty search and resets every filter _(WorkOrdersPage.test.tsx)_<br>`RF-7.2` keeps the plain empty state when there are no orders at all _(WorkOrdersPage.test.tsx)_<br>`RF-7.4` shows an error state with retry _(WorkOrdersPage.test.tsx)_<br>`RF-7.3` shows a loading skeleton while the list is on its way _(WorkOrdersPage.test.tsx)_ |
| RF-8 | `RF-8.1` asks the server for the next page when the person presses "Siguiente" _(WorkOrdersPage.test.tsx)_<br>`RF-8.1` computes the range of the last partial page _(Pagination.test.tsx)_<br>`RF-8.1` notifies the requested page on Previous and Next _(Pagination.test.tsx)_<br>`RF-8.1` does not render when the result fits on a single page _(Pagination.test.tsx)_ |

### 004-detalle-de-orden

| Requisito | Tests que lo prueban |
| --- | --- |
| RF-1 | `RF-1.5` explains a %i when loading the order _(WorkOrderDetailPage.test.tsx)_<br>`RF-1.1` shows the order data, progress and audit history to the front desk _(WorkOrderDetailPage.test.tsx)_<br>`RF-1.3` shows the order data, progress and audit history to the front desk _(WorkOrderDetailPage.test.tsx)_<br>`RF-1.2` shows the order data, progress and audit history to the front desk _(WorkOrderDetailPage.test.tsx)_<br>`RF-1.4` shows a cancelled order as interrupted and with no actions _(WorkOrderDetailPage.test.tsx)_ |
| RF-2 | `RF-2.1` renders only the backend-allowed transitions, leaving budget steps to the budget flow _(TransitionActions.test.tsx)_<br>`RF-2.2` renders only the backend-allowed transitions, leaving budget steps to the budget flow _(TransitionActions.test.tsx)_<br>`RF-2.7` renders nothing when the viewer has no transitions _(TransitionActions.test.tsx)_<br>`RF-2.5` runs a transition and reports the new status _(WorkOrderDetailPage.test.tsx)_<br>`RF-2.4` runs a transition and reports the new status _(WorkOrderDetailPage.test.tsx)_<br>`RF-2.3` does not offer to cancel a budgeted order: it is cancelled by rejecting the budget _(WorkOrderDetailPage.test.tsx)_<br>`RF-2.6` blocks the other buttons while a transition is running _(WorkOrderDetailPage.test.tsx)_ |
| RF-3 | `RF-3.1` shows the missing parts when the Stock Guard blocks IN_REPAIR (RN-09) _(TransitionActions.test.tsx)_<br>`RF-3.1` names the parts that block the repair (Stock Guard, RN-09) _(WorkOrderDetailPage.test.tsx)_<br>`RF-3.2` shows the reason when the server refuses an action for another cause _(WorkOrderDetailPage.test.tsx)_ |
| RF-4 | `RF-4.1` warns about concurrent changes instead of showing a raw error (RN-04) _(WorkOrderDetailPage.test.tsx)_ |
| RF-5 | `RF-5.1` cancels an order with a reason and shows other errors inline _(WorkOrderDetailPage.test.tsx)_<br>`RF-5.2` closes the cancel dialog without changing the order _(WorkOrderDetailPage.test.tsx)_ |
| RF-6 | `RF-6.1` reassigns the technician and reports failures (RN-06) _(WorkOrderDetailPage.test.tsx)_<br>`RF-6.2` reassigns the technician and reports failures (RN-06) _(WorkOrderDetailPage.test.tsx)_ |
| RF-7 | `RF-7.1` lets the assigned technician save the diagnosis _(WorkOrderDetailPage.test.tsx)_<br>`RF-7.2` shows diagnosis errors from the backend _(WorkOrderDetailPage.test.tsx)_<br>`RF-7.3` shows the saved diagnosis read-only to someone who cannot diagnose _(WorkOrderDetailPage.test.tsx)_ |
| RF-8 | `RF-8.1` masks the code and reveals it only after confirming the audited call _(UnlockCodeReveal.test.tsx)_<br>`RF-8.2` masks the code and reveals it only after confirming the audited call _(UnlockCodeReveal.test.tsx)_<br>`RF-8.3` hides the code again after ${REVEAL_DURATION_SECONDS} seconds _(UnlockCodeReveal.test.tsx)_<br>`RF-8.4` offers no reveal button to users who may not see the code _(UnlockCodeReveal.test.tsx)_<br>`RF-8.3` hides the code as soon as the tab is no longer visible _(UnlockCodeReveal.test.tsx)_ |
| RF-9 | `RF-9.1` regenerates the tracking code after confirming (SUP-05) _(WorkOrderDetailPage.test.tsx)_ |
| RF-10 | `RF-10.1` shows the order data, progress and audit history to the front desk _(WorkOrderDetailPage.test.tsx)_<br>`RF-10.2` reports when the audit history cannot be loaded _(WorkOrderDetailPage.test.tsx)_ |
| RF-11 | `RF-11.1` offers the front desk the budget screen that fits the state, and the technician none _(WorkOrderDetailPage.test.tsx)_ |

### 005-presupuestos

| Requisito | Tests que lo prueban |
| --- | --- |
| RF-1 | `RF-1.1` splits orders into "to budget" and "waiting for the customer" queues _(BudgetsPage.test.tsx)_<br>`RF-1.2` splits orders into "to budget" and "waiting for the customer" queues _(BudgetsPage.test.tsx)_<br>`RF-1.3` splits orders into "to budget" and "waiting for the customer" queues _(BudgetsPage.test.tsx)_ |
| RF-2 | `RF-2.6` previews totals in integer cents, without floating point drift _(budget-status.test.ts)_<br>`RF-2.1` tells the user when the order no longer accepts budgets and has none _(BudgetEditorPage.test.tsx)_<br>`RF-2.2` builds a draft with labor and a compatible part, and posts it without part prices (RN-10) _(BudgetEditorPage.test.tsx)_<br>`RF-2.3` builds a draft with labor and a compatible part, and posts it without part prices (RN-10) _(BudgetEditorPage.test.tsx)_<br>`RF-2.4` builds a draft with labor and a compatible part, and posts it without part prices (RN-10) _(BudgetEditorPage.test.tsx)_<br>`RF-2.5` flags invalid labor lines, lets the user remove them and shows backend errors _(BudgetEditorPage.test.tsx)_<br>`RF-2.7` flags invalid labor lines, lets the user remove them and shows backend errors _(BudgetEditorPage.test.tsx)_ |
| RF-3 | `RF-3.1` sends a draft to the customer _(BudgetEditorPage.test.tsx)_<br>`RF-3.2` shows why sending failed _(BudgetEditorPage.test.tsx)_ |
| RF-4 | `RF-4.1` records the customer approval with the channel used (RN-05) _(BudgetEditorPage.test.tsx)_<br>`RF-4.2` records the customer approval with the channel used (RN-05) _(BudgetEditorPage.test.tsx)_<br>`RF-4.4` records a rejection with its reason and shows backend errors in the modal _(BudgetEditorPage.test.tsx)_<br>`RF-4.5` closes the decision modal without calling the API _(BudgetEditorPage.test.tsx)_<br>`RF-4.3` asks for a reason of at least three characters before a rejection can be confirmed _(BudgetEditorPage.test.tsx)_ |
| RF-5 | `RF-5.2` treats a SENT budget past its expiry as expired (SUP-04) _(budget-status.test.ts)_<br>`RF-5.1` marks expired and rejected versions (SUP-04) _(BudgetEditorPage.test.tsx)_<br>`RF-5.4` marks expired and rejected versions (SUP-04) _(BudgetEditorPage.test.tsx)_<br>`RF-5.3` tells how many days a sent budget has left before it expires _(BudgetEditorPage.test.tsx)_ |
| RF-6 | `RF-6.2` shows an error state when the order cannot be loaded _(BudgetEditorPage.test.tsx)_<br>`RF-6.1` shows the technician diagnosis and a way back to the order _(BudgetEditorPage.test.tsx)_ |

### 006-inventario-y-alertas

| Requisito | Tests que lo prueban |
| --- | --- |
| RF-1 | `RF-1.2` sends search, category and model filters to the API _(InventoryPage.test.tsx)_<br>`RF-1.3` shows the empty and error states _(InventoryPage.test.tsx)_<br>`RF-1.1` shows SKU, name, category, available / reserved / minimum and the stock signal _(InventoryPage.test.tsx)_ |
| RF-2 | `RF-2.1` lists the catalog for reception without costs nor admin actions (RN-07) _(InventoryPage.test.tsx)_<br>`RF-2.2` creates a part as admin, normalizing the SKU (FE-11) _(InventoryPage.test.tsx)_ |
| RF-3 | `RF-3.1` creates a part as admin, normalizing the SKU (FE-11) _(InventoryPage.test.tsx)_<br>`RF-3.2` explains a duplicated SKU _(InventoryPage.test.tsx)_<br>`RF-3.3` edits a part without sending the SKU _(InventoryPage.test.tsx)_<br>`RF-3.4` edits compatibility as admin and shows it read-only to reception (RN-10) _(InventoryPage.test.tsx)_<br>`RF-3.4` shows the server reason when the compatible models cannot be saved _(InventoryPage.test.tsx)_ |
| RF-4 | `RF-4.1` registers a stock entry and shows backend errors _(InventoryPage.test.tsx)_<br>`RF-4.2` registers a negative adjustment and explains reserved units (RN-09) _(InventoryPage.test.tsx)_ |
| RF-5 | `RF-5.1` lists parts at or below their minimum _(LowStockPage.test.tsx)_<br>`RF-5.2` says when everything is above the minimum _(LowStockPage.test.tsx)_<br>`RF-5.3` shows an error state _(LowStockPage.test.tsx)_ |
| RF-6 | `RF-6.1` shows the number of low-stock parts on the Inventario item _(app-sidebar.test.tsx)_<br>`RF-6.1` uses the singular for one part _(app-sidebar.test.tsx)_<br>`RF-6.2` caps long counts at 99+ _(app-sidebar.test.tsx)_<br>`RF-6.3` renders no badge when nothing is low _(app-sidebar.test.tsx)_<br>`RF-6.3` renders no badge when the alert list cannot be loaded _(app-sidebar.test.tsx)_<br>`RF-6.4` never asks technicians for stock alerts (RN-07) _(app-sidebar.test.tsx)_ |

### 007-portal-del-cliente

| Requisito | Tests que lo prueban |
| --- | --- |
| RF-1 | `RF-1.1` sends the normalized number and code and returns the status _(TrackingForm.test.tsx)_<br>`RF-1.2` sends the normalized number and code and returns the status _(TrackingForm.test.tsx)_<br>`RF-1.3` looks up one order anonymously and lets the visitor search again _(CustomerPortalPage.test.tsx)_ |
| RF-2 | `RF-2.2` rejects a 4-digit PIN-like code before calling the API _(TrackingForm.test.tsx)_<br>`RF-2.1` asks for the order number without contacting the server _(TrackingForm.test.tsx)_ |
| RF-3 | `RF-3.1` shows a single message for an unknown order or a wrong code (404) _(TrackingForm.test.tsx)_<br>`RF-3.2` explains the rate limit and disables the button (429) _(TrackingForm.test.tsx)_<br>`RF-3.3` asks to try again later when the server cannot be reached _(TrackingForm.test.tsx)_ |
| RF-4 | `RF-4.1` looks up one order anonymously and lets the visitor search again _(CustomerPortalPage.test.tsx)_<br>`RF-4.2` lists every order of a logged-in customer, including cancelled ones (RN-14) _(CustomerPortalPage.test.tsx)_<br>`RF-4.3` shows only the fields of the customer view, never internal data _(CustomerPortalPage.test.tsx)_ |
| RF-5 | `RF-5.1` lists every order of a logged-in customer, including cancelled ones (RN-14) _(CustomerPortalPage.test.tsx)_<br>`RF-5.2` tells a customer without orders and logs them out _(CustomerPortalPage.test.tsx)_<br>`RF-5.3` closes the session and stays on the public portal page _(CustomerPortalPage.test.tsx)_ |
| RF-6 | `RF-6.1` looks up one order anonymously and lets the visitor search again _(CustomerPortalPage.test.tsx)_<br>`RF-6.2` shows staff the public form without account links _(CustomerPortalPage.test.tsx)_ |
| RF-7 | `RF-7.1` redirects legacy paths _(router.test.tsx)_ |

### 008-administracion

| Requisito | Tests que lo prueban |
| --- | --- |
| RF-1 | `RF-1.1` lists every account with its username, role and status _(UsersPage.test.tsx)_<br>`RF-1.2` filters by text, role and status in the browser _(UsersPage.test.tsx)_<br>`RF-1.3` paginates long lists _(UsersPage.test.tsx)_ |
| RF-2 | `RF-2.1` validates required fields and the password rules before sending _(UsersPage.test.tsx)_<br>`RF-2.3` validates required fields and the password rules before sending _(UsersPage.test.tsx)_<br>`RF-2.5` creates the account, shows a toast and refreshes the list _(UsersPage.test.tsx)_<br>`RF-2.6` marks a taken username on the field (409) _(UsersPage.test.tsx)_<br>`RF-2.2` normalizes the username to lowercase _(admin-schemas.test.ts)_<br>`RF-2.2` rejects usernames with spaces or symbols _(admin-schemas.test.ts)_<br>`RF-2.4` never offers the CUSTOMER role (RN-14) _(admin-schemas.test.ts)_<br>`RF-2.3` requires both passwords to match _(admin-schemas.test.ts)_ |
| RF-3 | `RF-3.2` locks the role when the admin edits their own account _(UsersPage.test.tsx)_<br>`RF-3.3` resets a password with the same rules as creation _(UsersPage.test.tsx)_<br>`RF-3.1` changes the name and the role of another staff member _(UsersPage.test.tsx)_<br>`RF-3.2` lets an edit omit the role _(admin-schemas.test.ts)_ |
| RF-4 | `RF-4.1` deactivates another user after confirming _(UsersPage.test.tsx)_<br>`RF-4.2` never offers to deactivate the signed-in admin _(UsersPage.test.tsx)_<br>`RF-4.3` reactivates an inactive account after confirming _(UsersPage.test.tsx)_ |
| RF-5 | `RF-5.1` groups active models by brand, sorted by brand and model _(DeviceModelsPage.test.tsx)_<br>`RF-5.2` shows deactivated models on demand _(DeviceModelsPage.test.tsx)_<br>`RF-5.3` filters the catalog in the browser by brand or model _(DeviceModelsPage.test.tsx)_<br>`RF-5.1` groups case-insensitively and sorts numbers naturally _(admin-schemas.test.ts)_<br>`RF-5.3` searches brand and model together _(admin-schemas.test.ts)_ |
| RF-6 | `RF-6.7` deactivates a model and shows the feedback _(DeviceModelsPage.test.tsx)_<br>`RF-6.1` requires brand and model _(DeviceModelsPage.test.tsx)_<br>`RF-6.2` rejects a duplicate of the same brand before sending, ignoring case and spaces _(DeviceModelsPage.test.tsx)_<br>`RF-6.3` accepts the same model name under another brand _(DeviceModelsPage.test.tsx)_<br>`RF-6.4` adds a model to its brand, keeps the brand for the next one and refreshes the list _(DeviceModelsPage.test.tsx)_<br>`RF-6.5` reuses the existing spelling of a known brand _(DeviceModelsPage.test.tsx)_<br>`RF-6.6` shows the server duplicate (409) on the model field _(DeviceModelsPage.test.tsx)_<br>`RF-6.2` flags a duplicate even with other case or spaces, also for inactive models _(admin-schemas.test.ts)_ |
| RF-7 | `RF-7.1` sends anonymous visitors from /administracion/* to the login _(router.test.tsx)_<br>`RF-7.1` lets ADMIN into the admin screens _(router.test.tsx)_<br>`RF-7.1` opens the users screen at /administracion _(router.test.tsx)_<br>`RF-7.1` shows a 404 for an unknown admin screen _(router.test.tsx)_<br>`RF-7.1` keeps reception out of the admin section and sends it to its own landing page _(router.test.tsx)_ |

### 009-panel-de-control

| Requisito | Tests que lo prueban |
| --- | --- |
| RF-1 | `RF-1.1` shows the workload counters from the summary and the stock alerts _(DashboardPage.test.tsx)_<br>`RF-1.2` shows a placeholder while loading and a dash when a figure cannot be obtained _(DashboardPage.test.tsx)_<br>`RF-1.3` highlights late orders as an alert and pending budgets and low stock as a warning _(DashboardPage.test.tsx)_<br>`RF-1.3` does not highlight anything when there is nothing to worry about _(DashboardPage.test.tsx)_ |
| RF-2 | `RF-2.1` links to the filtered order list and to the inventory _(DashboardPage.test.tsx)_<br>`RF-2.2` links to the filtered order list and to the inventory _(DashboardPage.test.tsx)_<br>`RF-2.3` links to the filtered order list and to the inventory _(DashboardPage.test.tsx)_<br>`RF-2.4` offers a prominent "Nuevo ingreso" shortcut _(DashboardPage.test.tsx)_ |
| RF-3 | `RF-3.1` lists every status with a link to its queue _(DashboardPage.test.tsx)_ |
| RF-4 | `RF-4.1` offers a retry when the summary fails, keeping the stock counter _(DashboardPage.test.tsx)_ |
| RF-5 | `RF-5.1` greets by first name and shows today in Spanish _(DashboardPage.test.tsx)_ |
| RF-6 | `RF-6.1` opens the dashboard at "/" for the front desk _(router.test.tsx)_ |

### 010-identidad-visual

| Requisito | Tests que lo prueban |
| --- | --- |
| RF-1 | `RF-1` describe('Accent colour', () => { _(design-rules.test.ts)_<br>`RF-1.2` never uses the old lime green anywhere _(design-rules.test.ts)_<br>`RF-1.1` uses cyan for the primary button, the active menu item, text selection and field focus _(design-rules.test.ts)_<br>`RF-1.3` keeps red, orange/amber and green for errors, warnings and confirmations _(design-rules.test.ts)_ |
| RF-2 | `RF-2` describe('Page structure', () => { _(design-rules.test.ts)_<br>`RF-2.1` draws the header and the menu on dark navy, with the active item in cyan _(design-rules.test.ts)_<br>`RF-2.2` puts a faint grid behind the content and defines it as a reusable utility _(design-rules.test.ts)_<br>`RF-2.3` draws the sign-in page dark, with the grid and a cyan glow on top _(design-rules.test.ts)_<br>`RF-2.4` hides the header and the menu when printing _(design-rules.test.ts)_ |
| RF-3 | `RF-3` describe('Consistency', () => { _(design-rules.test.ts)_<br>`RF-3.1` lets screens use only the shared tokens: no hard-coded hex colours outside shared components _(design-rules.test.ts)_<br>`RF-3.2` keeps every button variant in one component _(design-rules.test.ts)_ |
| RF-4 | `RF-4.3` opens the mobile drawer and highlights only the exact menu item _(router.test.tsx)_<br>`RF-4` describe('Size and layout', () => { _(design-rules.test.ts)_<br>`RF-4.1` gives every pressable control at least 44 px of height _(design-rules.test.ts)_<br>`RF-4.2` works down to 320 px wide without horizontal scrolling _(design-rules.test.ts)_ |
| RF-5 | `RF-5.2` distinguishes a field with an error by more than colour: text, role and aria state _(form-field.test.tsx)_<br>`RF-5.2` shows no alert and no invalid state when the field is fine _(form-field.test.tsx)_<br>`RF-5` describe('Legibility', () => { _(design-rules.test.ts)_<br>`RF-5.1` pairs every solid accent background with dark text _(design-rules.test.ts)_ |

