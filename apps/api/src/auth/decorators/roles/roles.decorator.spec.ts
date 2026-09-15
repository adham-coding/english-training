import { describe, expect, it } from 'vitest';

import { ROLES_KEY, Roles } from './roles.decorator.js';

describe('Roles', () => {
  it('should define role metadata', () => {
    const decorator = Roles('ADMIN');

    expect(decorator).toBeTypeOf('function');
  });

  it('should expose the expected metadata key', () => {
    expect(ROLES_KEY).toBe('roles');
  });
});
