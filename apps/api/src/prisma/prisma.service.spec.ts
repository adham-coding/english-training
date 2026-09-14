import { describe, expect, it, vi } from 'vitest';

import { connectDatabase, db } from './db.js';
import { PrismaService } from './prisma.service.js';

vi.mock('./db.js', () => ({
  db: {
    close: vi.fn(),
  },
  connectDatabase: vi.fn(),
}));

describe('PrismaService', () => {
  it('should expose the database client', () => {
    const service = new PrismaService();

    expect(service.client).toBe(db);
  });

  it('should connect to the database on module init', async () => {
    const service = new PrismaService();

    await service.onModuleInit();

    expect(connectDatabase).toHaveBeenCalledTimes(1);
  });

  it('should close the database on module destroy', async () => {
    const service = new PrismaService();

    await service.onModuleDestroy();

    expect(db.close).toHaveBeenCalledTimes(1);
  });
});
