import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsNumber } from 'class-validator';

export class GetScheduleResponseDto {
  @ApiProperty({ description: '공연 날짜 ID' })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ description: '공연 ID' })
  @IsNumber()
  @IsNotEmpty()
  concertId: number;

  @ApiProperty({ description: '공연 날짜' })
  @IsNotEmpty()
  @IsDate()
  performanceDate: Date;
}

export class GetSeatsResponseDto {
  @ApiProperty({ description: '좌석 ID' })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ description: '공연 ID' })
  @IsNumber()
  @IsNotEmpty()
  concertId: number;

  @ApiProperty({ description: '좌석 번호' })
  @IsNotEmpty()
  @IsDate()
  seatNumber: number;

  @ApiProperty({ description: '공연 날짜' })
  @IsNotEmpty()
  @IsDate()
  performanceDate: Date;

  @ApiProperty({ description: '좌석 상태' })
  @IsNotEmpty()
  status: 'AVAILABLE' | 'RESERVED' | 'HOLD';

  @ApiProperty({ description: '좌석 예약 대기 해제 시간' })
  @IsNotEmpty()
  releaseAt: Date;

  @ApiProperty({ description: '좌석 금액' })
  @IsNumber()
  @IsNotEmpty()
  price: number;
}
