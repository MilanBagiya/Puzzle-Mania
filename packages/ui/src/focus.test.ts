import { describe, expect, it } from 'vitest';
import { nearestInDirection } from './focus.js';

const r = (x: number, y: number): DOMRect => ({ left: x, top: y, width: 10, height: 10, right: x + 10, bottom: y + 10, x, y, toJSON: () => ({}) }) as DOMRect;
// A 3×3 grid of cells 20px apart; the middle cell is (20, 20).
const cells = [0, 20, 40].flatMap((y) => [0, 20, 40].map((x) => ({ rect: r(x, y) })));
const at = (x: number, y: number): number => cells.findIndex((c) => c.rect.left === x && c.rect.top === y);

describe('nearestInDirection', () => {
  it('moves one cell in each direction from the middle', () => {
    expect(nearestInDirection(r(20, 20), cells, 1, 0)).toBe(at(40, 20));
    expect(nearestInDirection(r(20, 20), cells, -1, 0)).toBe(at(0, 20));
    expect(nearestInDirection(r(20, 20), cells, 0, -1)).toBe(at(20, 0));
    expect(nearestInDirection(r(20, 20), cells, 0, 1)).toBe(at(20, 40));
  });
  it('returns -1 at an edge', () => {
    expect(nearestInDirection(r(40, 20), cells, 1, 0)).toBe(-1);
    expect(nearestInDirection(r(20, 0), cells, 0, -1)).toBe(-1);
  });
  it('prefers the same row over a closer diagonal', () => {
    const items = [{ rect: r(15, 12) }, { rect: r(30, 0) }];
    expect(nearestInDirection(r(0, 0), items, 1, 0)).toBe(1);
  });
});
