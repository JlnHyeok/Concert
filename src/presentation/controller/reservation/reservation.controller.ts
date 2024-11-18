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
    this.kafkaClient.subscribeToResponseOf('payment');

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

    // Kafka 이벤트를 보내고 응답을 기다린 후 결과를 반환
    // 하위 서비스에서 발생한 예외들을 HttpException 에서 RpcException 으로 변환 후 여기서 처리
    try {
      const response = await lastValueFrom(
        this.kafkaClient.send('reservation', {
          key: `${userId}:${concertId}:${performanceDate.toISOString()}:${seatNumber}`,
          value: {
            userId,
            concertId,
            performanceDate,
            seatNumber,
          },
        }),
      );

      // 응답을 성공적으로 받았다면 반환
      return response; // 예약 성공 시 응답을 그대로 반환
    } catch (error) {
      throw new BusinessException(error);
    }
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

  @MessagePattern('reservation')
  async handleReservationSeat(
    @Payload() message: ReservationSeatRequestDto,
    @Ctx() context: KafkaContext,
  ) {
    const { userId, concertId, performanceDate, seatNumber } = message;

    return await this.reservationFacade.createReservation({
      userId,
      concertId,
      performanceDate,
      seatNumber,
    });
  }
}
