import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { CAST, character } from './index.js';

const svg = readFileSync(new URL('./cast.svg', import.meta.url), 'utf8');

describe('the wider cast', () => {
  it('every cast animal has a body and all three moods', () => {
    for (const a of CAST) for (const part of ['body', 'idle', 'happy', 'oops']) {
      expect(svg, `ch-${a}-${part}`).toContain(`<symbol id="ch-${a}-${part}" viewBox="0 0 80 80">`);
    }
  });
  it('uses only gradients it defines itself', () => {
    const used = new Set([...svg.matchAll(/url\(#([\w-]+)\)/g)].map((m) => m[1]));
    for (const id of used) expect(svg, id).toContain(`id="${id}"`);
  });
  it('character() draws a cast animal in a mood', () => {
    const html = character('moose', 'happy', 48);
    expect(html).toContain('href="#ch-moose-body"');
    expect(html).toContain('href="#ch-moose-happy"');
  });
});
