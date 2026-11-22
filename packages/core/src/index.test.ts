import { describe, it, expect } from 'vitest';
import { helloCore } from './index';

describe('core', () => {
  it('exports helloCore', () => {
    expect(helloCore()).toBe('Hello from core');
  });
});