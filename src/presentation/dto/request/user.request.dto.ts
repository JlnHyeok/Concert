import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateUserRequestDto {
  @ApiProperty({ description: '유저 ID' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ description: '유저 이름' })
  @IsNotEmpty()
  name: string;
}

export class ChargePointRequestDto {
  @ApiProperty({ description: '유저 ID' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ description: '포인트' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1, { message: '충전 포인트는 0보다 커야 합니다.' })
  @IsNotEmpty()
  point: number;
}

export class UsePointRequestDto {
  @ApiProperty({ description: '유저 ID' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ description: '포인트' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1, { message: '사용 포인트는 0보다 커야 합니다.' })
  @IsNotEmpty()
  point: number;
}

export class CheckPointRequestDto {
  @ApiProperty({ description: '유저 ID' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
