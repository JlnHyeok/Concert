import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateConcertResponseDto {
  @ApiProperty({ description: '공연 ID' })
  id: number;

  @ApiProperty({ description: '공연 이름' })
  name: string;

  @ApiProperty({ description: '공연 위치' })
  location: string;
}

export class GetAllConcertsResponseDto {
  @ApiProperty({ description: '공연 ID' })
  id: number;

  @ApiProperty({ description: '공연 이름' })
  name: string;

  @ApiProperty({ description: '공연 위치' })
  location: string;
}

export class CreatePerforamnceDateResponseDto {
  @ApiProperty({ description: '공연 날짜 ID' })
  id: number;

  @ApiProperty({ description: '공연 ID' })
  concertId: number;

  @ApiProperty({ description: '공연 날짜' })
  performanceDate: Date;
}

export class CreateSeatResponseDto {
  @ApiProperty({ description: '좌석 ID' })
  id: number;

  @ApiProperty({ description: '공연 ID' })
  concertId: number;

  @ApiProperty({ description: '좌석 번호' })
  seatNumber: number;

  @ApiProperty({ description: '공연 날짜' })
  performanceDate: Date;

  @ApiProperty({ description: '좌석 상태' })
  status: 'AVAILABLE' | 'RESERVED' | 'HOLD';

  @ApiProperty({ description: '좌석 금액' })
  price: number;
}

export class GetScheduleResponseDto {
  @ApiProperty({ description: '공연 날짜 ID' })
  id: number;

  @ApiProperty({ description: '공연 ID' })
  concertId: number;

  @ApiProperty({ description: '공연 날짜' })
  performanceDate: Date;
}

export class GetSeatsResponseDto {
  @ApiProperty({ description: '좌석 ID' })
  id: number;

  @ApiProperty({ description: '공연 ID' })
  concertId: number;

  @ApiProperty({ description: '좌석 번호' })
  seatNumber: number;

  @ApiProperty({ description: '공연 날짜' })
  performanceDate: Date;

  @ApiProperty({ description: '좌석 상태' })
  status: 'AVAILABLE' | 'RESERVED' | 'HOLD';

  @ApiProperty({ description: '좌석 예약 대기 해제 시간' })
  releaseAt: Date;

  @ApiProperty({ description: '좌석 금액' })
  price: number;
}
