import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateConcertRequestDto {
  @ApiProperty({ description: '공연 이름' })
  @IsNotEmpty()
  concertName: string;

  @ApiProperty({ description: '공연 위치' })
  @IsNotEmpty()
  @IsString()
  location: string;
}

export class CreatePerforamnceDateRequestDto {
  @ApiProperty({ description: '공연 ID' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  concertId: number;

  @ApiProperty({ description: '공연 날짜' })
  @Transform(({ value }) => new Date(value))
  @IsNotEmpty()
  @IsDate()
  performanceDate: Date;
}

export class CreateSeatRequestDto {
  @ApiProperty({ description: '공연 ID' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  concertId: number;

  @ApiProperty({ description: '공연 날짜' })
  @Transform(({ value }) => new Date(value))
  @IsNotEmpty()
  @IsDate()
  performanceDate: Date;

  @ApiProperty({ description: '좌석 번호' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  seatNumber: number;

  @ApiProperty({ description: '좌석 가격' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  price: number;
}

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
  @Transform(({ value }) => new Date(value))
  @IsNotEmpty()
  @IsDate()
  performanceDate: Date;
}
