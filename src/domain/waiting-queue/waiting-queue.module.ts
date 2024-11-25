import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaitingQueue } from './model/entity/waiting-queue.entity';
import { WaitingQueueService } from './services/waiting-queue.service';
import { RedisModule } from '../../infra/redis/redis.module';
import { QueueTokenService } from './services/queue-token.service';

@Module({
  imports: [RedisModule, TypeOrmModule.forFeature([WaitingQueue])],
  providers: [QueueTokenService, WaitingQueueService],
  exports: [TypeOrmModule, WaitingQueueService],
})
export class WaitingQueueModule {}
