import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class ChargePointRequestDto {
  @ApiProperty({ description: '유저 ID' })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ description: '포인트' })
  @IsNumber()
  @IsNotEmpty()
  point: number;
}

export class CheckPointRequestDto {
  @ApiProperty({ description: '유저 ID' })
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
