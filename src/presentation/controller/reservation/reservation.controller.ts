import {
  Controller,
  Headers,
  Param,
  Post,
  BadRequestException,
  UseGuards,
  Body,
} from '@nestjs/common';
import { ReservationFacade } from '../../../application/facades/reservation/reservation.facade';
import {
  PaymentReservationRequestDto,
  ReservationSeatRequestDto,
} from '../../dto/request/reservation.request.dto';
import {
  PaymentResponseDto,
  ReservationResponseDto,
} from '../../dto/response/reservation.response.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common';

@ApiTags('reservation')
@Controller('reservation')
export class ReservationController {
  constructor(private readonly reservationFacade: ReservationFacade) {}

  @Post('/seat')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, type: ReservationResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async reservationSeat(
    @Headers('authorization') token: string,
    @Body() body: ReservationSeatRequestDto,
  ): Promise<ReservationResponseDto> {
    const { userId, concertId, performanceDate, seatNumber } = body;
    token = token?.split(' ')[1];
    return await this.reservationFacade.createReservation({
      token,
      userId,
      concertId,
      performanceDate,
      seatNumber,
    });
  }

  @Post('/payment')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, type: PaymentResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async createPayment(
    @Headers('authorization') token: string,
    @Body() body: PaymentReservationRequestDto,
  ): Promise<PaymentResponseDto> {
    const { userId, seatId } = body;
    token = token?.split(' ')[1];
    return await this.reservationFacade.createPayment(token, userId, seatId);
  }
}
