import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaitingQueue } from './model/entity/waiting-queue.entity';
import { WaitingQueueService } from './services/waiting-queue.service';
import { WAITING_QUEUE_REPOSITORY } from './model/repository/waiting-queue.repository';
import { WaitingQueueRepository } from '../../infra/repo/waiting-queue/waiting-queue.repo';
import { RedisModule } from '../../infra/redis/redis.module';
import { QueueTokenService } from './services/queue-token.service';

@Module({
  imports: [RedisModule, TypeOrmModule.forFeature([WaitingQueue])],
  providers: [
    QueueTokenService,
    WaitingQueueService,
    { provide: WAITING_QUEUE_REPOSITORY, useClass: WaitingQueueRepository },
  ],
  exports: [TypeOrmModule, WaitingQueueService],
})
export class WaitingQueueModule {}
