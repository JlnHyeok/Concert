import { Module } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { DomainModule } from '../../domain/domain.module';
import { ReservationFacade } from './reservation/reservation.facade';
import { ConcertFacade } from './concert/concert.facade';
import { UserFacade } from './user/user.facade';
import { WaitingQueueFacade } from './waiting-queue/waiting-queue.facade';
import { ReservationEventListener } from '../../common/events/reservation/listener/reservation-event-listener';

@Module({
  imports: [DomainModule],
  providers: [
    ReservationFacade,
    ConcertFacade,
    UserFacade,
    WaitingQueueFacade,
    ReservationEventListener,
  ],
  controllers: [],
  exports: [ReservationFacade, ConcertFacade, UserFacade, WaitingQueueFacade],
})
export class FacadeModule {}
