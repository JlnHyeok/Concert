import {
  Controller,
  Headers,
  Param,
  Post,
  BadRequestException,
  UseGuards,
  Body,
  Inject,
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
import { BusinessException, JwtAuthGuard } from '../../../common';
import {
  ClientKafka,
  Ctx,
  EventPattern,
  KafkaContext,
  MessagePattern,
  Payload,
} from '@nestjs/microservices';
import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@ApiTags('reservation')
@Controller('reservation')
export class ReservationController implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly reservationFacade: ReservationFacade,
    @Inject('KAFKA_CLIENT')
    private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit(): Promise<void> {
    this.kafkaClient.subscribeToResponseOf('reservation');

    await this.kafkaClient.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.kafkaClient.close();
  }

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
