import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { RegisterDto } from './register.js';

describe('RegisterDto', () => {
  it('should accept a valid registration payload', async () => {
    const dto = Object.assign(new RegisterDto(), {
      email: 'user@example.com',
      password: 'Correct-Horse-Battery-Staple-123!',
      firstName: 'Adham',
      lastName: 'Example',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('should reject an invalid email', async () => {
    const dto = Object.assign(new RegisterDto(), {
      email: 'invalid-email',
      password: 'Correct-Horse-Battery-Staple-123!',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'email')).toBe(true);
  });

  it('should reject a password shorter than 12 characters', async () => {
    const dto = Object.assign(new RegisterDto(), {
      email: 'user@example.com',
      password: 'short',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'password')).toBe(true);
  });

  it('should reject an overly long password', async () => {
    const dto = Object.assign(new RegisterDto(), {
      email: 'user@example.com',
      password: 'a'.repeat(129),
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'password')).toBe(true);
  });

  it('should accept omitted optional names', async () => {
    const dto = Object.assign(new RegisterDto(), {
      email: 'user@example.com',
      password: 'Correct-Horse-Battery-Staple-123!',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
