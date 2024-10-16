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
import { WaitingQueueService } from 'src/domain/waiting-queue/services/waiting-queue.service';

@Controller('waiting-queue')
export class WaitingQueueController {
  constructor(private readonly waitingQueueService: WaitingQueueService) {}

  @Get('check')
  async checkWaitingQueue(@Headers('authorization') token: string) {
    token = token.split(' ')[1];
    return await this.waitingQueueService.checkWaitingQueue(token);
  }

  @Post('issue')
  async issueToken(@Res() res: Response) {
    const token = await this.waitingQueueService.generateToken();

    res
      .status(HttpStatus.CREATED)
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Token issued successfully' });
  }
}
