import { ReservationService } from '../../domain/reservation/service/reservation.service';
import { WaitingQueueService } from '../../domain/waiting-queue/services/waiting-queue.service';
import { UserService } from '../../domain/user/services/user.service';
import { ConcertService } from '../../domain/concert/service/consert.service';
import dayjs from 'dayjs';
import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

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
    await this.checkActivatedToken(token);

    const seats = await this.concertService.getSeats(
      concertId,
      performanceDate.toISOString(),
    );

    const seat = seats.find((s) => s.seatNumber === seatNumber);

    if (!seat) throw new BadRequestException('Seat not found');
    if (seat.status !== 'AVAILABLE')
      throw new BadRequestException('Seat is not available');

    seat.status = 'HOLD';
    seat.releaseAt = new Date(new Date().getMinutes() + 5);
    await this.concertService.updateSeat(seat.id, seat);

    return this.reservationService.createReservation(userId, seat.id);
  }

  async createPayment(token: string, userId: number, seatId: number) {
    await this.checkActivatedToken(token);

    const user = await this.userService.findUserById(userId);
    const seat = await this.concertService.getSeat(seatId);

    const reservations = await this.reservationService.getReservation(userId);
    const reservation = reservations.find((r) => r.seat.id === seatId);

    if (!reservation) throw new BadRequestException('Reservation not found');
    this.checkUserPoint(user.balance, seat.price);

    await this.userService.usePoint(user.id, seat.price);
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

    for (const seat of holdSeats) {
      if (dayjs(seat.releaseAt).isBefore(dayjs())) {
        seat.status = 'AVAILABLE';
        await this.concertService.updateSeat(seat.id, seat);
      }
    }
  }

  private async checkActivatedToken(token: string) {
    const tokenInfo = await this.waitingQueueService.checkWaitingQueue(token);
    if (!tokenInfo?.expireAt) throw new BadRequestException('Invalid token');
    if (new Date(tokenInfo.expireAt).getTime() > new Date().getTime()) {
      throw new BadRequestException('Token expired');
    }
  }

  private checkUserPoint(userPoint: number, seatPrice: number) {
    if (userPoint < seatPrice) {
      throw new BadRequestException('Not enough points');
    }
  }
}
