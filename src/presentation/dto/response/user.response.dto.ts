import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateUserResponseDto {
  @ApiProperty({ description: '유저 ID' })
  @Transform(({ value }) => Number(value))
  id: number;

  @ApiProperty({ description: '유저 이름' })
  name: string;

  @ApiProperty({ description: '포인트' })
  @Transform(({ value }) => Number(value))
  balance: number;
}

export class ChargePointResponseDto {
  @ApiProperty({ description: '포인트' })
  @Transform(({ value }) => Number(value))
  balance: number;
}

export class UsePointResponseDto {
  @ApiProperty({ description: '포인트' })
  @Transform(({ value }) => Number(value))
  balance: number;
}

export class CheckPointResponseDto {
  @ApiProperty({ description: '포인트' })
  @Transform(({ value }) => Number(value))
  balance: number;
}
