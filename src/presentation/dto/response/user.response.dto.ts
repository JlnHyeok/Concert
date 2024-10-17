import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class ChargePointResponseDto {
  @ApiProperty({ description: '포인트' })
  @IsNumber()
  @IsNotEmpty()
  balance: number;
}

export class CheckPointResponseDto {
  @ApiProperty({ description: '포인트' })
  @IsNumber()
  @IsNotEmpty()
  balance: number;
}
