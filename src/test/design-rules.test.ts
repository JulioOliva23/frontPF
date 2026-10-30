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
const css = readFileSync(join(process.cwd(), 'src', 'index.css'), 'utf8');
const sources = Object.entries(loaded).map(([path, text]) => ({ path: path.replace('/src/', ''), text }));
const read = (path: string): string => {
  const file = sources.find((candidate) => candidate.path === path);
  if (!file) throw new Error(`${path} is not in the sources`);
  return file.text;
};
const lines = (list: typeof sources) => list.flatMap(({ path, text }) => text.split(/\r?\n/).map((line, index) => ({ file: path, line: index + 1, text: line })));
const where = (hits: Array<{ file: string; line: number }>) => hits.map((hit) => `${hit.file}:${hit.line}`);
const cssBlock = (selector: RegExp) => selector.exec(css)?.[0] ?? '';

describe('Accent colour [010/RF-1]', () => {
  it('uses mint for the main action, the active menu item and field focus, and lavender for keyboard focus and selection [010/RF-1.1]', () => {
    expect(css).toMatch(/--color-mint:\s*#9af2c7/);
    expect(css).toMatch(/--color-lavender:\s*#c4b5fd/);
    expect(cssBlock(/\.primary-action\s*{[^}]*}/)).toMatch(/linear-gradient\([^)]*#9af2c7[^)]*#c4b5fd/);
    expect(read('shared/components/Button.tsx')).toMatch(/primary:\s*'primary-action/);
    expect(read('app/app-sidebar.tsx')).toMatch(/active[\s\S]{0,80}bg-mint\/10 text-mint/);
    expect(read('shared/components/ui/form-field.tsx')).toContain('focus:border-mint');
    expect(css).toMatch(/:focus-visible\s*{[^}]*var\(--color-lavender\)/);
    expect(css).toMatch(/::selection\s*{[^}]*#c4b5fd/);
  });

  it('never uses the old lime or cyan accents anywhere [010/RF-1.2]', () => {
    const hits = lines(sources).filter(({ text }) => /\b(lime|cyan)-\d/.test(text));
    expect(where(hits)).toEqual([]);
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

  it('draws everything on a dark violet background with translucent header and menu [010/RF-2.1]', () => {
    expect(css).toMatch(/--color-canvas:\s*#1[0-9a-f]{5}/);
    expect(css).toMatch(/color-scheme:\s*dark/);
    expect(layout).toMatch(/<header[^>]*className="app-header/);
    expect(layout).toMatch(/<aside[^>]*className="app-sidebar/);
    expect(cssBlock(/\.app-header\s*{[^}]*}/)).toMatch(/border-bottom:[^;]*var\(--color-line\)[\s\S]*backdrop-filter/);
    expect(cssBlock(/\.app-sidebar\s*{[^}]*}/)).toMatch(/border-right:[^;]*var\(--color-line\)/);
  });

  it('presents content in glass cards with one border and radius [010/RF-2.2]', () => {
    expect(cssBlock(/\.glass-card\s*{[^}]*}/)).toMatch(/border:[^;]*var\(--color-line\)[\s\S]*border-radius:\s*24px[\s\S]*backdrop-filter/);
    expect(read('shared/components/Card.tsx')).toMatch(/default:\s*'glass-card/);
  });

  it('shows the mascot with its halo on the sign-in page [010/RF-2.3]', () => {
    const login = read('features/auth/pages/LoginPage.tsx');
    expect(login).toMatch(/mascot-halo[^>]*><Mascot[^>]*decorative=\{false\}/);
    expect(css).toMatch(/\.mascot-halo::before\s*{/);
  });

  it('hides the header, the menu and the bottom bar when printing, on a white page [010/RF-2.4]', () => {
    expect(layout).toMatch(/<header[^>]*print:hidden/);
    expect(layout).toMatch(/<aside[^>]*print:hidden/);
    expect(layout).toMatch(/<nav[^>]*aria-label="Navegación móvil"[^>]*print:hidden/);
    expect(css).toMatch(/@media print\s*{[^@]*body\s*{\s*background:\s*white/);
  });
});

describe('Consistency [010/RF-3]', () => {
  it('lets screens use only the theme tokens: no hard-coded hex colours outside shared components [010/RF-3.1]', () => {
    const screens = sources.filter((file) => !file.path.startsWith('shared/components'));
    const hits = lines(screens).filter(({ text }) => /#[0-9a-fA-F]{6}\b/.test(text));
    expect(where(hits)).toEqual([]);
  });

  it('keeps every button variant in one component [010/RF-3.2]', () => {
    const button = read('shared/components/Button.tsx');
    for (const variant of ['primary', 'secondary', 'danger', 'outline', 'ghost', 'outline-light']) {
      expect(button).toContain(variant);
    }
    expect(button).toContain('rounded-2xl');
  });
});

describe('Size and layout [010/RF-4]', () => {
  it('gives every pressable control at least 44 px of height [010/RF-4.1]', () => {
    const hits = lines(sources).filter(({ text }) => /min-h-\[(?:[0-3]\d)px\]/.test(text));
    expect(where(hits)).toEqual([]);
    expect(css).toMatch(/button,\s*input,\s*select\s*{\s*min-height:\s*44px/);
    expect(read('shared/components/Button.tsx')).toContain('min-h-[44px]');
  });

  it('works down to 320 px wide without horizontal scrolling [010/RF-4.2]', () => {
    expect(css).toMatch(/body\s*{[^}]*min-width:\s*320px/);
    expect(read('app/app-layout.tsx')).toMatch(/<main[^>]*min-w-0/);
  });

  it('swaps the side menu for a drawer and a bottom bar on narrow screens [010/RF-4.3]', () => {
    const layout = read('app/app-layout.tsx');
    expect(layout).toMatch(/aria-label="Abrir menú"[^>]*lg:hidden/);
    expect(layout).toMatch(/<aside[^>]*hidden[^>]*lg:block/);
    expect(layout).toMatch(/<nav[^>]*aria-label="Navegación móvil"[^>]*lg:hidden/);
  });

  it('turns animations off when the person asks for reduced motion [010/RF-4.4]', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*{[^}]*animation-duration:\s*0\.01ms[^}]*transition-duration:\s*0\.01ms/);
  });
});

describe('Legibility [010/RF-5]', () => {
  it('pairs every solid accent background with dark text [010/RF-5.1]', () => {
    // A solid `bg-mint` (not hover:/focus:, not translucent `/10`); decorative dots are exempt.
    const solid = /(?<![:\w-])bg-mint(?![\w/-])/;
    const offenders = lines(sources).filter(({ text }) => solid.test(text) && !/text-mint-deep/.test(text) && !/aria-hidden="true"/.test(text));
    expect(where(offenders)).toEqual([]);
    expect(cssBlock(/\.primary-action\s*{[^}]*}/)).toMatch(/\bcolor:\s*#12231f/);
    expect(css).toMatch(/:root\s*{[^}]*color:\s*var\(--color-ink\)/);
  });
});
