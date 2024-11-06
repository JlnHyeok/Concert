import { Module } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { DomainModule } from '../../domain/domain.module';
import { ReservationFacade } from './reservation/reservation.facade';
import { ConcertFacade } from './concert/concert.facade';
import { UserFacade } from './user/user.facade';
import { WaitingQueueFacade } from './waiting-queue/waiting-queue.facade';
import { ConcertController } from '../../presentation/controller/concert/concert.controller';
import { ReservationController } from '../../presentation/controller/reservation/reservation.controller';
import { WaitingQueueController } from '../../presentation/controller/waiting-queue/waiting-queue.controller';
import { UserController } from '../../presentation/controller/user/user.controller';

@Module({
  imports: [DomainModule],
  providers: [
    AuthService,
    ReservationFacade,
    ConcertFacade,
    UserFacade,
    WaitingQueueFacade,
  ],
  controllers: [
    ConcertController,
    UserController,
    ReservationController,
    WaitingQueueController,
  ],
  exports: [ReservationFacade, ConcertFacade, UserFacade, WaitingQueueFacade],
})
export class FacadeModule {}
