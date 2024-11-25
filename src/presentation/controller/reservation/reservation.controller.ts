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
import { PaymentCreatedEventStatus } from 'src/domain/reservation/model/entity/payment.created.event.entity';

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

  @MessagePattern('payment')
  async paymentReply(data: { eventId: number; userId: number; price: number }) {
    const { eventId } = data;
    console.log('paymentReply Execute', data);
    this.reservationFacade.InvokePaymentReply(
      eventId,
      PaymentCreatedEventStatus.PUBLISHED,
    );
  }

  @MessagePattern('payment.success')
  async paymentSuccess(data: {
    eventId: number;
    userId: number;
    token: string;
    price: number;
  }) {
    const { eventId, token } = data;
    console.log('paymentSuccess Execute', 'data : ', data);
    this.reservationFacade.InvokePaymentSucess({
      eventId,
      token,
      status: PaymentCreatedEventStatus.SUCCESS,
    });
    return data;
  }

  @MessagePattern('payment.fail')
  async paymentFail(data: { eventId: number; userId: number; price: number }) {
    const { eventId, userId, price } = data;
    console.log('paymentFail Execute', 'data : ', data);
    this.reservationFacade.InvokePaymentFail({
      eventId: eventId,
      userId: userId,
      price: price,
    });
    return data;
  }
}
