import { describe, it, expect } from 'vitest';
import { helloGameFreshSnow } from './index';

describe('game-fresh-snow', () => {
  it('exports helloGameFreshSnow', () => {
    expect(helloGameFreshSnow()).toBe('Hello from game-fresh-snow');
  });
});