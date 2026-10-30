// Minimal Server-Sent Events parser for a fetch() body. EventSource cannot
// send the Authorization header (FE-16 keeps the token in memory), so the
// stream is read by hand: frames are separated by a blank line and carry
// "event:" and "data:" fields (https://html.spec.whatwg.org/#event-stream-interpretation).

export interface SseFrame {
  event: string;
  data: string;
}

export function parseSseChunk(buffer: string): { frames: SseFrame[]; rest: string } {
  const normalized = buffer.replace(/\r\n?/g, '\n');
  const blocks = normalized.split('\n\n');
  const rest = blocks.pop() ?? '';
  const frames = blocks.flatMap((block) => {
    let event = 'message';
    const data: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith(':')) continue;
      const colon = line.indexOf(':');
      const field = colon === -1 ? line : line.slice(0, colon);
      const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '');
      if (field === 'event') event = value;
      if (field === 'data') data.push(value);
    }
    return data.length > 0 ? [{ event, data: data.join('\n') }] : [];
  });
  return { frames, rest };
}

// 1 s, 2 s, 4 s … capped at 30 s, so a sleeping server (Render) is not hammered.
export function reconnectDelay(attempt: number): number {
  return Math.min(30_000, 1_000 * 2 ** Math.max(0, attempt));
}
