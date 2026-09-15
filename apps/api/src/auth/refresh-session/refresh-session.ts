import { Injectable } from '@nestjs/common';

import { RedisService } from '../redis/redis.js';

const REFRESH_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

export type RefreshSessionStatus = 'active' | 'rotated' | 'revoked';

export type RefreshSession = {
  userId: string;
  familyId: string;
  status: RefreshSessionStatus;
};

export type RefreshFamilyStatus = 'active' | 'revoked';

@Injectable()
export class RefreshSessionService {
  constructor(private readonly redisService: RedisService) {}

  async create(jti: string, userId: string, familyId: string): Promise<void> {
    const client = this.redisService.getClient();

    await client.set(
      this.key(jti),
      JSON.stringify({
        userId,
        familyId,
        status: 'active',
      } satisfies RefreshSession),
      {
        EX: REFRESH_SESSION_TTL_SECONDS,
      },
    );

    await client.set(this.familyKey(familyId), 'active', {
      NX: true,
      EX: REFRESH_SESSION_TTL_SECONDS,
    });
  }

  async get(jti: string): Promise<RefreshSession | null> {
    const value = await this.redisService.getClient().get(this.key(jti));

    if (!value) {
      return null;
    }

    return JSON.parse(value) as RefreshSession;
  }

  async revoke(jti: string): Promise<boolean> {
    const client = this.redisService.getClient();
    const key = this.key(jti);

    const result = await client.eval(
      `
        local value = redis.call('GET', KEYS[1])

        if not value then
          return 0
        end

        local session = cjson.decode(value)

        if session.status == 'revoked' then
          return 0
        end

        session.status = 'revoked'

        redis.call(
          'SET',
          KEYS[1],
          cjson.encode(session),
          'KEEPTTL'
        )

        return 1
      `,
      {
        keys: [key],
      },
    );

    return result === 1;
  }

  async rotate(
    oldJti: string,
    newJti: string,
    userId: string,
    familyId: string,
  ): Promise<'rotated' | 'reused' | 'missing' | 'revoked'> {
    const oldKey = this.key(oldJti);
    const newKey = this.key(newJti);
    const familyKey = this.familyKey(familyId);

    const result = await this.redisService.getClient().eval(
      `
        local oldValue = redis.call('GET', KEYS[1])

        if not oldValue then
          return 'missing'
        end

        local familyStatus = redis.call('GET', KEYS[3])

        if familyStatus ~= 'active' then
          return 'revoked'
        end

        local oldSession = cjson.decode(oldValue)

        if oldSession.userId ~= ARGV[1] or oldSession.familyId ~= ARGV[2] then
          redis.call('SET', KEYS[3], 'revoked', 'KEEPTTL')
          return 'reused'
        end

        if oldSession.status ~= 'active' then
          redis.call('SET', KEYS[3], 'revoked', 'KEEPTTL')
          return 'reused'
        end

        oldSession.status = 'rotated'

        redis.call(
          'SET',
          KEYS[1],
          cjson.encode(oldSession),
          'KEEPTTL'
        )

        redis.call(
          'SET',
          KEYS[2],
          ARGV[3],
          'EX',
          ARGV[4]
        )

        return 'rotated'
      `,
      {
        keys: [oldKey, newKey, familyKey],
        arguments: [
          userId,
          familyId,
          JSON.stringify({
            userId,
            familyId,
            status: 'active',
          } satisfies RefreshSession),
          String(REFRESH_SESSION_TTL_SECONDS),
        ],
      },
    );

    if (
      result === 'rotated' ||
      result === 'reused' ||
      result === 'missing' ||
      result === 'revoked'
    ) {
      return result;
    }

    throw new Error('Unexpected refresh rotation result');
  }

  async revokeFamily(familyId: string): Promise<boolean> {
    const result = await this.redisService
      .getClient()
      .set(this.familyKey(familyId), 'revoked', {
        XX: true,
        KEEPTTL: true,
      });

    return result === 'OK';
  }

  private key(jti: string): string {
    return `auth:refresh:${jti}`;
  }

  private familyKey(familyId: string): string {
    return `auth:refresh:family:${familyId}`;
  }
}
