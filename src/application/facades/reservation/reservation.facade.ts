import { ReservationService } from '../../../domain/reservation/service/reservation.service';
import { WaitingQueueService } from '../../../domain/waiting-queue/services/waiting-queue.service';
import { UserService } from '../../../domain/user/services/user.service';
import { ConcertService } from '../../../domain/concert/service/consert.service';
import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BusinessException } from '../../../common/exception/business-exception';
import { COMMON_ERRORS } from '../../../common/constants/error';
import { DataSource } from 'typeorm';
import { Seat } from 'src/domain/concert/model/entity/seat.entity';

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
    private readonly dataSource: DataSource,
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
    let seat: Seat;

    //#region 1. CHECK TOKEN
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
    //#endregion

    try {
      await this.dataSource.transaction(async (manager) => {
        //#region 2. CHECK SEAT STATUS -> GET DB LOCK
        const seats = await this.concertService.getSeats(
          concertId,
          performanceDate,
          manager,
        );

        seat = seats.find((s) => s.seatNumber === seatNumber);

        if (seat?.status !== 'AVAILABLE') {
          throw new BusinessException(
            COMMON_ERRORS.NOT_FOUND,
            HttpStatus.NOT_FOUND,
          );
        }
        //#endregion

        //#region 3. UPDATE SEAT STATUS -> RELEASE DB LOCK
        seat.status = 'HOLD';

        // 현재 시간에서 5분 후로 설정 코드 작성
        seat.releaseAt = new Date(
          new Date().setMinutes(new Date().getMinutes() + 5),
        );
        await this.concertService.updateSeat(seat.id, seat);
        //#endregion
      });
    } catch (e) {
      if (e instanceof BusinessException) {
        throw e;
      }
    }

    //#region 4. CREATE RESERVATION
    return this.reservationService.createReservation(userId, seat.id);
    //#endregion
  }

  async createPayment(token: string, userId: number, seatId: number) {
    // await this.checkActivatedToken(token);
    //#region 1. CHECK TOKEN
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
    //#endregion

    //#region 2. CHECK SEAT AND RESERVATION
    const seat = await this.concertService.getSeat(seatId);

    if (seat.status !== 'HOLD') {
      throw new BusinessException(
        COMMON_ERRORS.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const reservations = await this.reservationService.getReservation(userId);

    const reservation = reservations.find((r) => r?.seat?.id === seatId);
    if (!reservation) {
      throw new BusinessException(
        COMMON_ERRORS.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    //#endregion

    // 3. 외부 서비스 호출
    await this.userService.usePoint(userId, seat.price);
    const payment = await this.reservationService.createPayment(
      reservation.id,
      seat.price,
    );

    // 4. 결제 성공 시 좌석 예약 상태 변경
    seat.status = 'RESERVED';
    await this.concertService.updateSeat(seat.id, seat);

    // 5. 대기열 토큰 만료
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
