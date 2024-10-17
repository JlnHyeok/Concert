import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsNumber } from 'class-validator';

export class GetScheduleRequestDto {
  @ApiProperty({ description: '공연 ID' })
  @IsNumber()
  @IsNotEmpty()
  concertId: number;
}

export class GetSeatsRequestDto {
  @ApiProperty({ description: '공연 ID' })
  @IsNumber()
  @IsNotEmpty()
  concertId: number;

  @ApiProperty({ description: '공연 날짜' })
  @IsNotEmpty()
  @IsDate()
  performanceDate: string;
}
