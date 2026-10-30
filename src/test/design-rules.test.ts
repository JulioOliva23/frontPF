/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Spec 010 (identidad visual) as executable rules. They read the sources as
// text, not the rendered page: a colour, a size or a print rule that drifts
// fails here. Vite loads the files, so no Node typings are needed.
const loaded = import.meta.glob(['/src/**/*.ts', '/src/**/*.tsx', '!/src/**/*.test.*', '!/src/shared/api/schema.gen.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Vitest runs with `css: false`, which empties every stylesheet, so the CSS is read from disk.
const files = [
  ...Object.entries(loaded).map(([path, text]) => ({ path: path.replace('/src/', ''), text })),
  { path: 'index.css', text: readFileSync(join(process.cwd(), 'src', 'index.css'), 'utf8') },
];
const sources = files.filter((file) => /\.(ts|tsx)$/.test(file.path));
const read = (path: string): string => {
  const file = files.find((candidate) => candidate.path === path);
  if (!file) throw new Error(`${path} is not in the sources`);
  return file.text;
};
const lines = (list: typeof files) => list.flatMap(({ path, text }) => text.split(/\r?\n/).map((line, index) => ({ file: path, line: index + 1, text: line })));
const where = (hits: Array<{ file: string; line: number }>) => hits.map((hit) => `${hit.file}:${hit.line}`);

describe('Accent colour [010/RF-1]', () => {
  it('never uses the old lime green anywhere [010/RF-1.2]', () => {
    const hits = lines(sources).filter(({ text }) => /\blime-/.test(text));
    expect(where(hits)).toEqual([]);
  });

  it('uses cyan for the primary button, the active menu item, text selection and field focus [010/RF-1.1]', () => {
    expect(read('shared/components/Button.tsx')).toMatch(/primary:[\s\S]*?bg-cyan-400/);
    expect(read('app/app-sidebar.tsx')).toContain('bg-cyan-400');
    expect(read('index.css')).toMatch(/::selection\s*{[^}]*#67e8f9/);
    expect(read('shared/components/ui/form-field.tsx')).toContain('focus:border-cyan-600');
  });

  it('keeps red, orange/amber and green for errors, warnings and confirmations [010/RF-1.3]', () => {
    const badge = read('shared/components/Badge.tsx');
    expect(badge).toMatch(/danger:\s*'[^']*red-/);
    expect(badge).toMatch(/warning:\s*'[^']*(orange|amber)-/);
    expect(badge).toMatch(/success:\s*'[^']*emerald-/);
  });
});

describe('Page structure [010/RF-2]', () => {
  const layout = read('app/app-layout.tsx');

  it('draws the header and the menu on dark navy, with the active item in cyan [010/RF-2.1]', () => {
    expect(layout).toMatch(/<header[^>]*bg-slate-950/);
    expect(layout).toMatch(/<aside[^>]*bg-slate-900/);
    expect(read('app/app-sidebar.tsx')).toMatch(/active[\s\S]{0,80}bg-cyan-400/);
  });

  it('puts a faint grid behind the content and defines it as a reusable utility [010/RF-2.2]', () => {
    expect(layout).toMatch(/bg-tech-grid(?!-dark)/);
    expect(read('index.css')).toMatch(/@utility bg-tech-grid\s*{[^}]*linear-gradient/);
  });

  it('draws the sign-in page dark, with the grid and a cyan glow on top [010/RF-2.3]', () => {
    expect(read('features/auth/pages/LoginPage.tsx')).toMatch(/bg-slate-950[^"]*bg-tech-grid-dark/);
    expect(read('index.css')).toMatch(/@utility bg-tech-grid-dark\s*{[^}]*radial-gradient\(circle at 50% 0%, rgb\(34 211 238/);
  });

  it('hides the header and the menu when printing [010/RF-2.4]', () => {
    expect(layout).toMatch(/<header[^>]*print:hidden/);
    expect(layout).toMatch(/<aside[^>]*lg:block print:hidden/);
  });
});

describe('Consistency [010/RF-3]', () => {
  it('lets screens use only the shared tokens: no hard-coded hex colours outside shared components [010/RF-3.1]', () => {
    const screens = sources.filter((file) => !file.path.startsWith('shared/components'));
    const hits = lines(screens).filter(({ text }) => /#[0-9a-fA-F]{6}\b/.test(text));
    expect(where(hits)).toEqual([]);
  });

  it('keeps every button variant in one component [010/RF-3.2]', () => {
    const button = read('shared/components/Button.tsx');
    for (const variant of ['primary', 'secondary', 'danger', 'outline', 'ghost', 'outline-light']) {
      expect(button).toContain(variant);
    }
    expect(button).toContain('rounded-xl');
  });
});

describe('Size and layout [010/RF-4]', () => {
  it('gives every pressable control at least 44 px of height [010/RF-4.1]', () => {
    const hits = lines(sources).filter(({ text }) => /min-h-\[(?:[0-3]\d)px\]/.test(text));
    expect(where(hits)).toEqual([]);
    expect(read('index.css')).toMatch(/button,\s*input,\s*select\s*{\s*min-height:\s*44px/);
    expect(read('shared/components/Button.tsx')).toContain('min-h-[44px]');
  });

  it('works down to 320 px wide without horizontal scrolling [010/RF-4.2]', () => {
    expect(read('index.css')).toMatch(/body\s*{[^}]*min-width:\s*320px/);
    expect(read('app/app-layout.tsx')).toMatch(/<main[^>]*min-w-0/);
  });
});

describe('Legibility [010/RF-5]', () => {
  it('pairs every solid accent background with dark text [010/RF-5.1]', () => {
    // A solid `bg-cyan-400` (not a hover:/focus: variant, not translucent `/10`).
    const solid = /(?<![:\w-])bg-cyan-400(?![\w/-])/;
    const offenders = lines(sources).filter(({ text }) => solid.test(text) && !/text-cyan-950|text-slate-950/.test(text));
    expect(where(offenders)).toEqual([]);
    expect(read('app/app-layout.tsx')).toMatch(/<header[^>]*bg-slate-950[^>]*text-white/);
  });
});
