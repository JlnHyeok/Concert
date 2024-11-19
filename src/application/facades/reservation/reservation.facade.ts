import { ReservationService } from '../../../domain/reservation/service/reservation.service';
import { WaitingQueueService } from '../../../domain/waiting-queue/services/waiting-queue.service';
import { UserService } from '../../../domain/user/services/user.service';
import { ConcertService } from '../../../domain/concert/service/consert.service';
import { Injectable, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { Seat } from '../../../domain/concert/model/entity/seat.entity';
import { Reservation } from '../../../domain/reservation/model/entity/reservation.entity';
import { Payment } from '../../../domain/reservation/model/entity/payment.entity';
import { ClientKafka, MessagePattern } from '@nestjs/microservices';
import { EachMessagePayload } from 'kafkajs';
import { timeout } from 'rxjs';
import { PaymentCreatedEventStatus } from 'src/domain/reservation/model/entity/payment.created.event.entity';

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
    private readonly dataSource: DataSource,
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

  async createPayment(token: string, userId: number, seatId: number) {
    let seat: Seat;
    let reservation: Reservation;
    let payment: Payment;

    console.log('createPayment Execute');
    await this.dataSource.transaction(async (manager) => {
      // 1. 좌석 상태 확인
      seat = await this.concertService.checkSeatStatusBySeatId(
        seatId,
        'HOLD',
        manager,
      );

      // 2. 유저 포인트 사용
      await this.userService.usePoint(userId, seat.price, manager);

      // 3. 예약 확인
      reservation =
        await this.reservationService.getReservationByUserIdAndSeatId(
          userId,
          seatId,
          manager,
        );

      // 4. 좌석 상태 변경
      seat.status = 'RESERVED';
      await this.concertService.updateSeat(seat.id, seat, manager);

      // SAVE META DATA
      const metaData = {
        userId: userId,
        token: token,
        price: seat.price,
        reservationId: reservation.id,
        seatId: seat.id,
      };

      // 5. 결제 이벤트 Outbox 생성
      console.log('createPaymentCreatedEvent Execute');
      const paymentCreatedEvent =
        await this.reservationService.createPaymentCreatedEvent(
          metaData,
          manager,
        );

      console.log('emit payment event');

      // 6. 결제 이벤트 발행
      this.kafkaClient
        .emit('payment', {
          key: `payment_reservation_${reservation.id}`,
          value: {
            eventId: paymentCreatedEvent.id,
            metaData,
          },
        })
        .pipe(timeout(5000));
    });

    return payment;
  }

  async InvokePaymentReply(id: number, status: PaymentCreatedEventStatus) {
    await this.reservationService.updatePaymentCreatedEventStatus(id, status);
  }

  async InvokePaymentSucess(props: {
    eventId: number;
    token: string;
    status: PaymentCreatedEventStatus;
  }) {
    const { eventId, token, status } = props;
    await this.reservationService.updatePaymentCreatedEventStatus(
      eventId,
      status,
    );
    this.waitingQueueService.expireToken(token);
  }

  async InvokePaymentFail(props: {
    eventId: number;
    userId: number;
    price: number;
  }) {
    const { eventId, userId, price } = props;
    await this.userService.chargePoint(userId, price);
    await this.reservationService.updatePaymentCreatedEventStatus(
      eventId,
      PaymentCreatedEventStatus.FAIL,
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

  // private async checkActivatedToken(token: string) {
  //   const tokenInfo = await this.waitingQueueService.checkWaitingQueue(token);
  //   if (!tokenInfo?.expireAt) throw new BadRequestException('Invalid token');
  //   if (new Date(tokenInfo.expireAt).getTime() > new Date().getTime()) {
  //     throw new BadRequestException('Token expired');
  //   }
  // }
}
