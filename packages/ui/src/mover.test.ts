import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Mover, type Gait, type TokenSpec } from './mover.js';

// A minimal DOM stub: just what Mover touches (no jsdom dependency needed).
interface Rect { left: number; top: number; width: number; height: number }
class FakeEl {
  tag: string; className = ''; textContent = ''; innerHTML = ''; parentElement: FakeEl | null = null; children: FakeEl[] = [];
  style: Record<string, string> = {}; attrs: Record<string, string> = {}; rect: Rect = { left: 0, top: 0, width: 0, height: 0 };
  animations: { frames: Keyframe[]; opts: KeyframeAnimationOptions | number | undefined }[] = [];
  private cls = new Set<string>();
  constructor(tag: string) { this.tag = tag; }
  classList = { toggle: (c: string, on?: boolean): boolean => { const v = on ?? !this.cls.has(c); if (v) this.cls.add(c); else this.cls.delete(c); return v; }, contains: (c: string): boolean => this.cls.has(c) };
  setAttribute(k: string, v: string): void { this.attrs[k] = v; }
  appendChild(c: FakeEl): FakeEl { c.remove(); c.parentElement = this; this.children.push(c); return c; }
  remove(): void { const p = this.parentElement; if (p) { p.children = p.children.filter((x) => x !== this); this.parentElement = null; } }
  getBoundingClientRect(): Rect { return this.rect; }
  animate(frames: Keyframe[], opts?: KeyframeAnimationOptions | number): { onfinish: null } { this.animations.push({ frames, opts }); return { onfinish: null }; }
  all(): FakeEl[] { return this.children.flatMap((c) => [c, ...c.all()]); }
  byClass(c: string): FakeEl[] { return this.all().filter((e) => e.className === c); }
}
const el = (rect: Partial<Rect> = {}): FakeEl => Object.assign(new FakeEl('div'), { rect: { left: 0, top: 0, width: 0, height: 0, ...rect } });
const asEl = (e: FakeEl | null): HTMLElement => e as unknown as HTMLElement;

let reducedMotion = false;
beforeEach(() => {
  vi.useFakeTimers();
  reducedMotion = false;
  vi.stubGlobal('document', { createElement: (t: string) => new FakeEl(t) });
  vi.stubGlobal('getComputedStyle', (e: FakeEl) => ({ position: e.style.position || 'static' }));
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce') && reducedMotion }));
  vi.stubGlobal('window', globalThis);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

/** A 2-cell board: cell 0 at x 0–40, cell 1 at x 40–80 (both 40×40). */
function board(): { box: FakeEl; cells: FakeEl[] } {
  return { box: el({ left: 0, top: 0, width: 80, height: 40 }), cells: [el({ left: 0, top: 0, width: 40, height: 40 }), el({ left: 40, top: 0, width: 40, height: 40 })] };
}
const spec = (cells: FakeEl[], cell: number, extra: Partial<TokenSpec> = {}): TokenSpec => ({ id: 'fox', cell, el: asEl(cells[cell] ?? null) as unknown as Element, html: '<svg>fox</svg>', gait: 'trot', ...extra });
const tokOf = (box: FakeEl): FakeEl => box.byClass('tok')[0]!;

describe('Mover.sync', () => {
  it('does nothing without a container', () => {
    const m = new Mover();
    expect(() => m.sync(null, [])).not.toThrow();
    expect(m.has('fox')).toBe(false);
  });

  it('creates a token centred on its cell and makes a static container relative', () => {
    const { box, cells } = board(), m = new Mover();
    m.sync(asEl(box), [spec(cells, 1)]);
    const tok = tokOf(box);
    expect(box.style.position).toBe('relative');
    expect(tok.attrs['aria-hidden']).toBe('true');
    expect(tok.byClass('tok-inner')[0]!.innerHTML).toBe('<svg>fox</svg>');
    // width = 40 * 0.84 = 33.6; centre x = 60, y = 20; top is nudged up by 10% of the width.
    expect(tok.style.width).toBe('33.6px');
    expect(parseFloat(tok.style.left!)).toBeCloseTo(60 - 16.8);
    expect(parseFloat(tok.style.top!)).toBeCloseTo(20 - 16.8 - 3.36);
    expect(m.has('fox')).toBe(true);
  });

  it('keeps a non-static container position, honours a custom size and skips specs without a cell element', () => {
    const { box, cells } = board(), m = new Mover();
    box.style.position = 'absolute';
    m.sync(asEl(box), [spec(cells, 0, { size: 0.5 }), { ...spec(cells, 1), id: 'ghost', el: null }]);
    expect(box.style.position).toBe('absolute');
    expect(tokOf(box).style.width).toBe('20px');
    expect(m.has('ghost')).toBe(false);
  });

  it('plays an entrance on first appearance, then a puff of snow', () => {
    const { box, cells } = board(), m = new Mover();
    m.sync(asEl(box), [spec(cells, 0)]);
    expect(tokOf(box).animations).toHaveLength(1);
    vi.advanceTimersByTime(300);
    expect(box.byClass('puff')).toHaveLength(6);
  });

  it.each<[Gait, number]>([['trot', 300], ['hop', 480], ['walk', 420], ['leap', 520], ['slide', 380]])('animates a %s move over %ims and faces the direction of travel', (gait, ms) => {
    const { box, cells } = board(), m = new Mover();
    m.sync(asEl(box), [spec(cells, 1, { gait })]);
    const tok = tokOf(box);
    m.sync(asEl(box), [spec(cells, 0, { gait })]); // move left
    const move = tok.animations[1]!;
    expect((move.opts as KeyframeAnimationOptions).duration).toBe(ms);
    expect(move.frames[0]!.transform).toContain('translate(40px, 0px)'); // starts where it was
    expect(move.frames[move.frames.length - 1]!.transform).toContain('translate(0px, 0px)');
    expect(tok.byClass('tok-face')[0]!.style.transform).toBe('scaleX(-1)');
  });

  it('does not animate when the cell is unchanged', () => {
    const { box, cells } = board(), m = new Mover();
    m.sync(asEl(box), [spec(cells, 0)]);
    m.sync(asEl(box), [spec(cells, 0)]);
    expect(tokOf(box).animations).toHaveLength(1); // the entrance only
  });

  it('updates the picture and the selected state, and re-attaches to a redrawn container', () => {
    const { box, cells } = board(), m = new Mover();
    m.sync(asEl(box), [spec(cells, 0)]);
    const tok = tokOf(box);
    m.sync(asEl(box), [spec(cells, 0, { html: '<svg>happy</svg>', selected: true })]);
    expect(tok.byClass('tok-inner')[0]!.innerHTML).toBe('<svg>happy</svg>');
    expect(tok.classList.contains('sel')).toBe(true);
    const box2 = board().box;
    m.sync(asEl(box2), [spec(cells, 0)]);
    expect(tok.parentElement).toBe(box2);
    expect(tok.classList.contains('sel')).toBe(false);
  });

  it('removes tokens that are no longer listed', () => {
    const { box, cells } = board(), m = new Mover();
    m.sync(asEl(box), [spec(cells, 0), { ...spec(cells, 1), id: 'rabbit' }]);
    m.sync(asEl(box), [spec(cells, 0)]);
    expect(m.has('rabbit')).toBe(false);
    expect(box.byClass('tok')).toHaveLength(1);
  });

  it('respects reduced motion: no animations and no puffs', () => {
    reducedMotion = true;
    const { box, cells } = board(), m = new Mover();
    m.sync(asEl(box), [spec(cells, 1)]);
    m.sync(asEl(box), [spec(cells, 0)]);
    vi.runAllTimers();
    expect(tokOf(box).animations).toHaveLength(0);
    expect(box.byClass('puff')).toHaveLength(0);
    expect(tokOf(box).style.left).toBe(`${20 - 16.8}px`); // still placed on the new cell
  });
});

describe('Mover effects', () => {
  it('puff adds n particles in the given colour', () => {
    const { box, cells } = board(), m = new Mover();
    m.sync(asEl(box), [spec(cells, 0)]);
    m.puff(10, 10, 4, '#5DB6E0');
    const puffs = box.byClass('puff').slice(-4);
    expect(puffs).toHaveLength(4);
    for (const p of puffs) expect(p.style.background).toBe('#5DB6E0');
  });

  it('hop animates a known token and ignores unknown ones', () => {
    const { box, cells } = board(), m = new Mover();
    m.sync(asEl(box), [spec(cells, 0)]);
    expect(() => m.hop('nobody')).not.toThrow();
    m.hop('fox');
    expect(tokOf(box).byClass('tok-inner')[0]!.animations).toHaveLength(1);
  });

  it('shake shows a "?" bubble that disappears, even with reduced motion', () => {
    reducedMotion = true;
    const { box, cells } = board(), m = new Mover();
    m.sync(asEl(box), [spec(cells, 0)]);
    m.shake('fox');
    const bubble = tokOf(box).byClass('tok-bubble')[0]!;
    expect(bubble.textContent).toBe('?');
    vi.advanceTimersByTime(1100);
    expect(bubble.parentElement).toBeNull();
    expect(tokOf(box).byClass('tok-inner')[0]!.animations).toHaveLength(0);
  });

  it('dive forgets the token at once (removed straight away with reduced motion)', () => {
    reducedMotion = true;
    const { box, cells } = board(), m = new Mover();
    m.sync(asEl(box), [spec(cells, 0)]);
    m.dive('fox');
    expect(m.has('fox')).toBe(false);
    expect(box.byClass('tok')).toHaveLength(0);
  });

  it('clear removes every token', () => {
    const { box, cells } = board(), m = new Mover();
    m.sync(asEl(box), [spec(cells, 0), { ...spec(cells, 1), id: 'rabbit' }]);
    m.clear();
    expect(m.has('fox') || m.has('rabbit')).toBe(false);
    expect(box.byClass('tok')).toHaveLength(0);
  });
});
