// A lazy route whose chunk no longer exists (new deploy while the tab was
// open) or could not be downloaded. Reloading fetches the current build.
const CHUNK_LOAD_ERROR = /dynamically imported module|importing a module script failed|error loading dynamically imported module|failed to fetch/i;

export function isChunkLoadError(error: unknown): boolean {
  return error instanceof Error && CHUNK_LOAD_ERROR.test(error.message);
}
