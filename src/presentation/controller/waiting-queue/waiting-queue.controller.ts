import {
  Controller,
  Get,
  Headers,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { CheckWaitingQueueResponseDto } from '../../dto/response/waiting-queue.response.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guard/jwt-auth.guard';
import { WaitingQueueFacade } from '../../../application/facades/waiting-queue/waiting-queue.facade';

@ApiTags('waiting-queue')
@Controller('waiting-queue')
export class WaitingQueueController {
  constructor(private readonly waitingQueueFacade: WaitingQueueFacade) {}

  @Get('check')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, type: CheckWaitingQueueResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async checkWaitingQueue(
    @Headers('authorization') token: string,
  ): Promise<CheckWaitingQueueResponseDto> {
    token = token?.split(' ')[1];
    return await this.waitingQueueFacade.checkWaitingQueue(token);
  }

  @Post('issue')
  @ApiResponse({ status: 201, description: 'Token issued successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async issueToken(@Res() res: Response) {
    try {
      const token = await this.waitingQueueFacade.issueToken();

      res
        .status(HttpStatus.CREATED)
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Token issued successfully' });
    } catch (error) {
      throw new InternalServerErrorException('Token generation failed');
    }
  }

  // ONLY FOR TESTING
  @Post('delete-all')
  @ApiResponse({ status: 200, description: 'All tokens deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async deleteAll(@Res() res: Response) {
    try {
      await this.waitingQueueFacade.deleteAll();
      res
        .status(HttpStatus.OK)
        .send({ message: 'All tokens deleted successfully' });
    } catch (error) {
      throw new InternalServerErrorException('Token deletion failed');
    }
  }

  // ONLY FOR TESTING
  @Get('size')
  @ApiResponse({ status: 200, description: 'Get size of queue' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getSize(@Res() res: Response) {
    try {
      const size = await this.waitingQueueFacade.getSize();
      res.status(HttpStatus.OK).send({ size });
    } catch (error) {
      throw new InternalServerErrorException('Failed to get size of queue');
    }
  }
}
