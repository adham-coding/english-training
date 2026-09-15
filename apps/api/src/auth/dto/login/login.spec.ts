import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { LoginDto } from './login.js';

describe('LoginDto', () => {
  it('should accept a valid login payload', async () => {
    const dto = Object.assign(new LoginDto(), {
      email: 'user@example.com',
      password: 'Correct-Horse-Battery-Staple-123!',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('should reject an invalid email', async () => {
    const dto = Object.assign(new LoginDto(), {
      email: 'invalid-email',
      password: 'password',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'email')).toBe(true);
  });

  it('should reject an empty password', async () => {
    const dto = Object.assign(new LoginDto(), {
      email: 'user@example.com',
      password: '',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'password')).toBe(true);
  });

  it('should reject an overly long password', async () => {
    const dto = Object.assign(new LoginDto(), {
      email: 'user@example.com',
      password: 'a'.repeat(129),
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'password')).toBe(true);
  });
});
