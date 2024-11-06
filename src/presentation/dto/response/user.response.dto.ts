import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateUserResponseDto {
  @ApiProperty({ description: '유저 ID' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ description: '유저 이름' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '포인트' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  balance: number;
}

export class ChargePointResponseDto {
  @ApiProperty({ description: '포인트' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  balance: number;
}

export class UsePointResponseDto {
  @ApiProperty({ description: '포인트' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  balance: number;
}

export class CheckPointResponseDto {
  @ApiProperty({ description: '포인트' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  balance: number;
}
