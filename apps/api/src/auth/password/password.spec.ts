import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { PasswordService } from './password.js';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash a password', async () => {
    const password = 'Correct-Horse-Battery-Staple-123!';

    const hash = await service.hash(password);

    expect(hash).toBeTypeOf('string');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toBe(password);
  });

  it('should generate a different hash for the same password', async () => {
    const password = 'Correct-Horse-Battery-Staple-123!';

    const firstHash = await service.hash(password);
    const secondHash = await service.hash(password);

    expect(firstHash).not.toBe(secondHash);
  });

  it('should verify the correct password', async () => {
    const password = 'Correct-Horse-Battery-Staple-123!';
    const hash = await service.hash(password);

    await expect(service.verify(hash, password)).resolves.toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const hash = await service.hash('Correct-Horse-Battery-Staple-123!');

    await expect(service.verify(hash, 'Wrong-Password-123!')).resolves.toBe(
      false,
    );
  });

  it('should reject a malformed hash', async () => {
    await expect(
      service.verify('not-a-valid-argon2-hash', 'password'),
    ).resolves.toBe(false);
  });
});
