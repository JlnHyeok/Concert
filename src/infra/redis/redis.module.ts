// src/infra/redis/redis.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: Redis,
      useFactory: async (configService: ConfigService) => {
        const redis = new Redis({
          host: configService.get('REDIS_HOST', 'Concert_redis'),
          port: configService.get('REDIS_PORT', 6379),
        });
        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: [Redis],
})
export class RedisModule {}
