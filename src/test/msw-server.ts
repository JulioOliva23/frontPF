import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { env } from '../shared/config/env';

// Background requests the app shell makes on every staff page (AG-01): the
// live stream of agent proposals and the pending count of the sidebar badge.
// Tests that care override them with server.use(...).
export const backgroundHandlers = [
  http.get(`${env.apiUrl}/agent-actions/stream`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${env.apiUrl}/agent-actions`, () => HttpResponse.json([])),
];

// FE-21: one MSW server for every test; each test declares the handlers it
// needs with server.use(...). Unhandled requests fail the test (setup.ts).
export const server = setupServer(...backgroundHandlers);
