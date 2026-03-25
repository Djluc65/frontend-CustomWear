import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('fusionne les classes et résout les conflits Tailwind', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('p-2', false && 'hidden', null, undefined, 'text-sm')).toBe('p-2 text-sm');
  });
});

