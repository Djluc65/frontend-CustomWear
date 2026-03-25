import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('exporte un composant React', () => {
    expect(App).toBeTruthy();
    expect(typeof App).toBe('function');
  });
});
