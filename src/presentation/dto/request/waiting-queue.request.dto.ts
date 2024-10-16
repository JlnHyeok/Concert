import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum WaitingQueueStatus {
  WAITING = 'WAITING',
  PROCESSING = 'PROCESSING',
  EXPIRED = 'EXPIRED',
}

export class IssueWaitingQueueDto {
  @IsNotEmpty()
  @IsNumber()
  userId: string;
}

export class UpdateWaitingQueueDto {
  @IsEnum(WaitingQueueStatus)
  status?: WaitingQueueStatus;

  @IsString()
  createdAt: string;

  @IsOptional()
  @IsString()
  activatedAt?: string | null;

  @IsOptional()
  @IsString()
  expiredAt?: string | null;
}

export class GetWaitingQueueDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;
}
