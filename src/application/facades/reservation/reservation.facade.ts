import { ReservationService } from '../../../domain/reservation/service/reservation.service';
import { WaitingQueueService } from '../../../domain/waiting-queue/services/waiting-queue.service';
import { UserService } from '../../../domain/user/services/user.service';
import { ConcertService } from '../../../domain/concert/service/consert.service';
import dayjs from 'dayjs';
import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BusinessException } from '../../../common/exception/business-exception';
import { COMMON_ERRORS } from '../../../common/constants/error';

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
    token,
    userId,
    concertId,
    performanceDate,
    seatNumber,
  }: {
    token: string;
    userId: number;
    concertId: number;
    performanceDate: Date;
    seatNumber: number;
  }) {
    const tokenInfo = await this.waitingQueueService.checkWaitingQueue(token);

    if (tokenInfo?.status !== 'PROCESSING') {
      throw new BusinessException(
        COMMON_ERRORS.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
      );
    }

    let expired = new Date(tokenInfo.expireAt);
    let parsedExpired = new Date(expired.setHours(expired.getHours() + 9));

    if (parsedExpired.toISOString() < new Date().toISOString()) {
      throw new BusinessException(
        COMMON_ERRORS.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const seats = await this.concertService.getSeats(
      concertId,
      performanceDate,
    );

    const seat = seats.find((s) => s.seatNumber === seatNumber);

    if (seat?.status !== 'AVAILABLE')
      throw new BusinessException(
        COMMON_ERRORS.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );

    seat.status = 'HOLD';
    seat.releaseAt = new Date(new Date().getMinutes() + 5);
    await this.concertService.updateSeat(seat.id, seat);

    return this.reservationService.createReservation(userId, seat.id);
  }

  async createPayment(token: string, userId: number, seatId: number) {
    // await this.checkActivatedToken(token);
    const tokenInfo = await this.waitingQueueService.checkWaitingQueue(token);
    if (tokenInfo.status !== 'PROCESSING') {
      throw new BusinessException(
        COMMON_ERRORS.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
      );
    }

    let expired = new Date(tokenInfo.expireAt);
    let parsedExpired = new Date(expired.setHours(expired.getHours() + 9));

    if (parsedExpired.toISOString() < new Date().toISOString()) {
      throw new BusinessException(
        COMMON_ERRORS.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const seat = await this.concertService.getSeat(seatId);

    const reservations = await this.reservationService.getReservation(userId);

    const reservation = reservations.find((r) => r?.seat?.id === seatId);

    await this.userService.usePoint(userId, seat.price);
    const payment = await this.reservationService.createPayment(
      reservation.id,
      seat.price,
    );

    seat.status = 'RESERVED';
    await this.concertService.updateSeat(seat.id, seat);
    this.waitingQueueService.expireToken(token);

    return payment;
  }

  @Cron('0 */3 * * * *')
  async releaseHoldSeat() {
    const seats = await this.concertService.getAllSeats();
    const holdSeats = seats.filter((seat) => seat.status === 'HOLD');
    const now = new Date();
    for (const seat of holdSeats) {
      if (new Date(seat.releaseAt) <= now) {
        seat.status = 'AVAILABLE';
        await this.concertService.updateSeat(seat.id, seat);
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
