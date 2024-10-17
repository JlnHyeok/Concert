import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CheckWaitingQueueResponseDto {
  @ApiProperty({ description: '대기열 번호' })
  @IsNumber()
  @IsNotEmpty()
  waitingNumber: number;

  @ApiProperty({ description: '남은 대기열 시간' })
  @IsNumber()
  @IsNotEmpty()
  remainingTime: number;

  @ApiProperty({ description: '대기열 상태' })
  @IsString()
  @IsNotEmpty()
  status: 'WAITING' | 'PROCESSING' | 'EXPIRED';

  @ApiProperty({ description: '만료 시간' })
  @IsString()
  @IsOptional()
  expiredAt?: string;
}
