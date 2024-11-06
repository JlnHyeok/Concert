import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber } from 'class-validator';

export class ReservationSeatRequestDto {
  @ApiProperty({ description: '유저 ID' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ description: '공연 ID' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  concertId: number;

  @ApiProperty({ description: '공연 날짜' })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @IsNotEmpty()
  performanceDate: Date;

  @ApiProperty({ description: '좌석 번호' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  seatNumber: number;
}

export class PaymentReservationRequestDto {
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  seatId: number;
}
