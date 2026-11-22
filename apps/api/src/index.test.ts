import { describe, it, expect } from 'vitest';
import { helloApi } from './index';

describe('api', () => {
  it('exports helloApi', () => {
    expect(helloApi()).toBe('Hello from api');
  });
});