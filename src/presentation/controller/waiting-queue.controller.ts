import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { CheckWaitingQueueResponseDto } from '../dto/response/waiting-queue.response.dto';
import { WaitingQueueService } from '../../domain/waiting-queue/services/waiting-queue.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('waiting-queue')
@Controller('waiting-queue')
export class WaitingQueueController {
  constructor(private readonly waitingQueueService: WaitingQueueService) {}

  @Get('check')
  @ApiResponse({ status: 200, type: CheckWaitingQueueResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async checkWaitingQueue(
    @Headers('authorization') token: string,
  ): Promise<CheckWaitingQueueResponseDto> {
    token = token.split(' ')[1];
    return await this.waitingQueueService.checkWaitingQueue(token);
  }

  @Post('issue')
  @ApiResponse({ status: 201, description: 'Token issued successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async issueToken(@Res() res: Response) {
    const token = await this.waitingQueueService.generateToken();

    res
      .status(HttpStatus.CREATED)
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Token issued successfully' });
  }
}
