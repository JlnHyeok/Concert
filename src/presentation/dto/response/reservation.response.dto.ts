import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsNumber } from 'class-validator';
import { Seat } from 'src/domain/concert/model/entity/seat.entity';
import { Reservation } from 'src/domain/reservation/model/entity/reservation.entity';
import { User } from 'src/domain/user/model/entity/user.entity';

export class ReservationResponseDto {
  @ApiProperty({ description: '예약 ID' })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ description: '유저 정보' })
  user: User;

  @ApiProperty({ description: '좌석 정보' })
  seat: Seat;

  @ApiProperty({ description: '예약 생성 시간' })
  @IsNotEmpty()
  @IsDate()
  createdAt: Date;
}

export class PaymentResponseDto {
  @ApiProperty({ description: '결제 ID' })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ description: '예약 정보' })
  @IsNumber()
  @IsNotEmpty()
  reservation: Reservation;

  @ApiProperty({ description: '결제 금액' })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({ description: '결제 생성 시간' })
  @IsNumber()
  @IsNotEmpty()
  createdAt: Date;
}
