import { setupServer } from 'msw/node';

// FE-21: one MSW server for every test; each test declares the handlers it
// needs with server.use(...). Unhandled requests fail the test (setup.ts).
export const server = setupServer();
