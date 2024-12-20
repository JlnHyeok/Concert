import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsNumber } from 'class-validator';
import { Seat } from '../../../domain/concert/model/entity/seat.entity';
import { Reservation } from '../../../domain/reservation/model/entity/reservation.entity';
import { User } from '../../../domain/user/model/entity/user.entity';

export class ReservationResponseDto {
  @ApiProperty({ description: '예약 ID' })
  id: number;

  @ApiProperty({ description: '유저 정보' })
  user: User;

  @ApiProperty({ description: '좌석 정보' })
  seat: Seat;

  @ApiProperty({ description: '예약 생성 시간' })
  createdAt: Date;
}

export class PaymentResponseDto {
  @ApiProperty({ description: '결제 ID' })
  id: number;

  @ApiProperty({ description: '예약 정보' })
  reservation: Reservation;

  @ApiProperty({ description: '결제 금액' })
  price: number;

  @ApiProperty({ description: '결제 생성 시간' })
  createdAt: Date;
}
