import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { connectDatabase, db } from './db.js';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  get client() {
    return db;
  }

  async onModuleInit(): Promise<void> {
    await connectDatabase();
  }

  async onModuleDestroy(): Promise<void> {
    await db.close();
  }
}
