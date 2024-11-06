import {
  Controller,
  Headers,
  Param,
  Post,
  BadRequestException,
} from '@nestjs/common';
import { ReservationFacade } from '../../application/facades/reservation.facade';
import {
  PaymentReservationRequestDto,
  ReservationSeatRequestDto,
} from '../dto/request/reservation.request.dto';
import {
  PaymentResponseDto,
  ReservationResponseDto,
} from '../dto/response/reservation.response.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('reservation')
@Controller('reservation')
export class ReservationController {
  constructor(private readonly reservationFacade: ReservationFacade) {}

  @Post('/seat')
  @ApiResponse({ status: 201, type: ReservationResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async reservationSeat(
    @Headers('authorization') token: string,
    @Param() params: ReservationSeatRequestDto,
  ): Promise<ReservationResponseDto> {
    const { userId, concertId, performanceDate, seatNumber } = params;

    // 유효성 검사 추가
    if (!token) {
      throw new BadRequestException('Missing authorization token');
    }

    if (!userId || !concertId || !performanceDate || !seatNumber) {
      throw new BadRequestException('Missing required parameters');
    }

    return await this.reservationFacade.createReservation({
      token,
      userId,
      concertId,
      performanceDate,
      seatNumber,
    });
  }

  @Post('/payment')
  @ApiResponse({ status: 201, type: PaymentResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async createPayment(
    @Headers('authorization') token: string,
    @Param() params: PaymentReservationRequestDto,
  ): Promise<PaymentResponseDto> {
    const { userId, seatId } = params;

    // 유효성 검사 추가
    if (!token) {
      throw new BadRequestException('Missing authorization token');
    }

    if (!userId || !seatId) {
      throw new BadRequestException('Missing required parameters');
    }

    return await this.reservationFacade.createPayment(token, userId, seatId);
  }
}
