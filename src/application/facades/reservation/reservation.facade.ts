import { ReservationService } from '../../../domain/reservation/service/reservation.service';
import { WaitingQueueService } from '../../../domain/waiting-queue/services/waiting-queue.service';
import { UserService } from '../../../domain/user/services/user.service';
import { ConcertService } from '../../../domain/concert/service/consert.service';
import { Injectable, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Seat } from '../../../domain/concert/model/entity/seat.entity';
import { Reservation } from '../../../domain/reservation/model/entity/reservation.entity';
import { Payment } from '../../../domain/reservation/model/entity/payment.entity';
import { ClientKafka } from '@nestjs/microservices';
import { timeout } from 'rxjs';
import {
  IPaymentOutboxMetadata,
  PaymentOutboxStatus,
} from '../../../domain/reservation/model/entity/payment.outbox.entity';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

@Injectable()
export class ReservationFacade {
  constructor(
    @Inject(WaitingQueueService)
    private readonly waitingQueueService: WaitingQueueService,
    @Inject(UserService)
    private readonly userService: UserService,
    @Inject(ConcertService)
    private readonly concertService: ConcertService,
    @Inject(ReservationService)
    private readonly reservationService: ReservationService,
    @Inject('KAFKA_CLIENT')
    private readonly kafkaClient: ClientKafka,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async createReservation({
    userId,
    concertId,
    performanceDate,
    seatNumber,
  }: {
    userId: number;
    concertId: number;
    performanceDate: Date;
    seatNumber: number;
  }) {
    const seat = await this.concertService.checkAndUpdateSeatStatus(
      concertId,
      performanceDate,
      seatNumber,
      'AVAILABLE',
    );

    const reservation = this.reservationService.createReservation(userId, seat);

    return reservation;
    //#endregion
  }

  async createPayment(
    token: string,
    userId: number,
    seatId: number,
  ): Promise<void> {
    let seat: Seat;
    let reservation: Reservation;

    console.log('createPayment Execute');
    await this.entityManager.transaction(async (manager) => {
      // 1. 좌석 상태 확인
      seat = await this.concertService.checkSeatStatusBySeatId(
        seatId,
        'HOLD',
        manager,
      );
      // 2. 좌석 상태 변경
      seat.status = 'RESERVED';
      await this.concertService.updateSeat(seat.id, seat, manager);

      // 3. 예약 확인
      reservation =
        await this.reservationService.getReservationByUserIdAndSeatId(
          userId,
          seatId,
          manager,
        );

      // 4. 유저 포인트 사용
      await this.userService.usePoint(userId, seat.price, manager);

      // SAVE META DATA
      const metadata: IPaymentOutboxMetadata = {
        userId: userId,
        token: token,
        price: seat.price,
        reservationId: reservation.id,
        seatId: seat.id,
      };

      // 5. 결제 이벤트 Outbox Data 저장
      console.log('createPaymentOutbox Execute');
      const paymentOutbox = await this.reservationService.createPaymentOutbox(
        metadata,
        manager,
      );

      console.log('emit payment event');

      // 6. 결제 이벤트 발행
      this.kafkaClient
        .emit('payment', {
          key: `payment_reservation_${reservation.id}`,
          value: {
            eventId: paymentOutbox.id,
            metadata,
          },
        })
        .pipe(timeout(5000));
    });

    return;
  }

  async InvokePaymentReply(id: number, status: PaymentOutboxStatus) {
    await this.reservationService.updatePaymentOutboxStatus(id, status);
  }

  async InvokePaymentSucess(props: {
    eventId: number;
    token: string;
    status: PaymentOutboxStatus;
  }) {
    const { eventId, token, status } = props;
    await this.reservationService.updatePaymentOutboxStatus(eventId, status);
    this.waitingQueueService.expireToken(token);
    // + alarm,,, slack,,,
  }

  // 보상 트랜잭션
  async InvokePaymentFail(props: {
    eventId: number;
    metadata: IPaymentOutboxMetadata;
  }) {
    const { eventId, metadata } = props;
    const { userId, price, seatId } = metadata;

    // 1. 유저 포인트 복구
    await this.userService.chargePoint(userId, price);

    // 2. 좌석 상태 변경
    let seat = await this.concertService.getSeat(seatId);
    seat.status = 'AVAILABLE';
    await this.concertService.updateSeat(seatId, seat);

    // 3. 결제 이벤트 상태 변경
    await this.reservationService.updatePaymentOutboxStatus(
      eventId,
      PaymentOutboxStatus.FAIL,
    );
  }

  @Cron('0 */3 * * * *')
  async releaseHoldSeat() {
    const seats = await this.concertService.getAllSeats();

    if (seats.length === 0) return;

    const holdSeats = seats.filter((seat) => seat.status === 'HOLD');
    const now = new Date();
    for (const seat of holdSeats) {
      if (new Date(seat.releaseAt) <= now) {
        seat.status = 'AVAILABLE';
        await this.concertService.updateSeat(seat.id, seat);
        await this.reservationService.deleteReservationBySeatId(seat.id);
      }
    }
  }

  @Cron('0 */3 * * * *')
  async retryFailedCreatePayment() {
    const failedEvents =
      await this.reservationService.getAllPaymentOutboxsByStatus(
        PaymentOutboxStatus.INIT,
      );

    if (failedEvents.length === 0) return;

    // 이벤트 재전송
    for (const event of failedEvents) {
      // 5분 이상 지난 이벤트만 재전송
      if (event.createdAt.getTime() + 1000 * 60 * 5 <= new Date().getTime()) {
        this.kafkaClient
          .emit('payment', {
            key: `payment_reservation_${event.metadata.reservationId}`,
            value: {
              eventId: event.id,
              metadata: event.metadata,
            },
          })
          .pipe(timeout(5000));
      }
    }
  }
}
