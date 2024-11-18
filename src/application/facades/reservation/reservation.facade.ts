import { ReservationService } from '../../../domain/reservation/service/reservation.service';
import { WaitingQueueService } from '../../../domain/waiting-queue/services/waiting-queue.service';
import { UserService } from '../../../domain/user/services/user.service';
import { ConcertService } from '../../../domain/concert/service/consert.service';
import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BusinessException } from '../../../common/exception/business-exception';
import { COMMON_ERRORS } from '../../../common/constants/error';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RESERVATION_EVENT } from '../../../common/events/reservation/reservation-event';
import { ToRpcException } from 'src/common/exception/rpc-exception.filter';

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
    //#region 2. CHECK SEAT AND RESERVATION
    const seat = await this.concertService.checkSeatStatusBySeatId(
      seatId,
      'HOLD',
    );

    const reservation =
      await this.reservationService.getReservationByUserIdAndSeatId(
        userId,
        seatId,
      );
    //#endregion

    // // 3. 외부 서비스 호출
    // try {
    //   this.eventEmitter.emit(RESERVATION_EVENT.PAYMENT_EXTERNAL_INVOKE, {
    //     userId,
    //     token,
    //     price: seat.price,
    //   });
    // } catch (e) {
    //   throw new BusinessException(COMMON_ERRORS.EXTERNAL_PAYMENT_SERVICE_ERROR);
    // }

    seat.status = 'RESERVED';
    await this.concertService.updateSeat(seat.id, seat);

    // 4. DB UPDATE
    const payment = await this.reservationService.createPayment(
      reservation.id,
      seat.price,
    );

    // // PAYMENT COMPLETED EVENT
    // this.eventEmitter.emit(RESERVATION_EVENT.PAYMENT_COMPLETED, {
    //   reservation: reservation,
    //   price: seat.price,
    // });

    // 5. 대기열 토큰 만료
    this.waitingQueueService.expireToken(token);

    return payment;
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
