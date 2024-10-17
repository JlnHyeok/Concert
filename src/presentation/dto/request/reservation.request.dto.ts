import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber } from 'class-validator';

export class ReservationSeatRequestDto {
  @ApiProperty({ description: '유저 ID' })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ description: '공연 ID' })
  @IsNumber()
  @IsNotEmpty()
  concertId: number;

  @ApiProperty({ description: '공연 날짜' })
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  performanceDate: Date;

  @ApiProperty({ description: '좌석 번호' })
  @IsNumber()
  @IsNotEmpty()
  seatNumber: number;
}

export class PaymentReservationRequestDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  seatId: number;
}
