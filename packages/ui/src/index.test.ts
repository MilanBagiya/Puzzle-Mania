import { describe, it, expect } from 'vitest';
import { helloUi } from './index';

describe('ui', () => {
  it('exports helloUi', () => {
    expect(helloUi()).toBe('Hello from ui');
  });
});