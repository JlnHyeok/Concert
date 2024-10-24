import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber } from 'class-validator';

export class GetScheduleRequestDto {
  @ApiProperty({ description: '공연 ID' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  concertId: number;
}

export class GetSeatsRequestDto {
  @ApiProperty({ description: '공연 ID' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  concertId: number;

  @ApiProperty({ description: '공연 날짜' })
  @Transform(({ value }) => Number(value))
  @IsNotEmpty()
  @IsDate()
  performanceDate: string;
}
