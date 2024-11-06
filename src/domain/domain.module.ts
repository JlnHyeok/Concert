import { Module } from '@nestjs/common';
import { ConcertModule } from './concert/concert.module';
import { UsersModule } from './user/user.module';
import { ReservationModule } from './reservation/reservation.module';
import { WaitingQueueModule } from './waiting-queue/waiting-queue.module';

@Module({
  imports: [UsersModule, ConcertModule, ReservationModule, WaitingQueueModule],
  controllers: [],
  providers: [],
  exports: [ConcertModule, UsersModule, ReservationModule, WaitingQueueModule],
})
export class DomainModule {}
