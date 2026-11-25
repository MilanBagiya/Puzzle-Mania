import { afterEach, describe, expect, it, vi } from 'vitest';
import pairs from '../games/feather-pairs.js';

/** Just enough of an element for mount(): innerHTML plus one click listener. */
function fakeRoot(): { root: HTMLElement; tap: (i: number) => void } {
  let onClick: ((e: Event) => void) | null = null;
  const root = {
    innerHTML: '',
    addEventListener: (_t: string, h: (e: Event) => void) => { onClick = h; },
    removeEventListener: () => { onClick = null; },
    contains: () => true,
  } as unknown as HTMLElement;
  const tap = (i: number): void => {
    const el = { getAttribute: () => `flip:${i}`, hasAttribute: () => false };
    onClick?.({ target: { closest: () => el } } as unknown as Event);
  };
  return { root, tap };
}

describe('Feather Pairs', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('flips a wrong pair back after a short pause', () => {
    vi.useFakeTimers();
    const p = pairs.generate('2027-01-18');
    const b = p.cards.findIndex((c) => c !== p.cards[0]);
    const { root, tap } = fakeRoot();
    const game = pairs.mount(root, p, { onSolved: () => {} });
    tap(0); tap(b);
    const faceUp = root.innerHTML;
    vi.advanceTimersByTime(1000);
    expect(root.innerHTML).not.toBe(faceUp);
    game.destroy();
  });

  it('does not redraw the board after it is destroyed mid flip-back', () => {
    vi.useFakeTimers();
    const p = pairs.generate('2027-01-18');
    const b = p.cards.findIndex((c) => c !== p.cards[0]);
    const { root, tap } = fakeRoot();
    const game = pairs.mount(root, p, { onSolved: () => {} });
    tap(0); tap(b);
    game.destroy();
    root.innerHTML = 'next game';
    vi.advanceTimersByTime(1000);
    expect(root.innerHTML).toBe('next game');
  });
});
