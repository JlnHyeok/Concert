import {
  Controller,
  Headers,
  Post,
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
import { JwtAuthGuard } from '../../../common';
import { ClientKafka, MessagePattern } from '@nestjs/microservices';
import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PaymentOutboxStatus } from '../../../domain/reservation/model/entity/payment.outbox.entity';
import { PaymentOutboxRequestCommonDto } from '../../../presentation/dto/request/payment.outbox.request.dto';

@ApiTags('reservation')
@Controller('reservation')
export class ReservationController implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly reservationFacade: ReservationFacade,
    @Inject('KAFKA_CLIENT')
    private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit(): Promise<void> {
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
  ): Promise<void> {
    const { userId, seatId } = body;
    token = token?.split(' ')[1];
    return await this.reservationFacade.createPayment(token, userId, seatId);
  }

  @MessagePattern('payment')
  async paymentReply(data: PaymentOutboxRequestCommonDto) {
    const { eventId } = data;
    console.log('payment received Execute', data);
    this.reservationFacade.InvokePaymentReply(
      eventId,
      PaymentOutboxStatus.PUBLISHED,
    );
  }

  @MessagePattern('payment.success')
  async paymentSuccess(data: PaymentOutboxRequestCommonDto) {
    const { eventId, metadata } = data;
    console.log('paymentSuccess Execute', 'data : ', data);
    this.reservationFacade.InvokePaymentSucess({
      eventId,
      token: metadata.token,
      status: PaymentOutboxStatus.SUCCESS,
    });
    return data;
  }

  @MessagePattern('payment.fail')
  async paymentFail(data: PaymentOutboxRequestCommonDto) {
    const { eventId, metadata } = data;
    console.log('paymentFail Execute', 'data : ', data);
    this.reservationFacade.InvokePaymentFail({
      eventId: eventId,
      metadata,
    });
    return data;
  }
}
