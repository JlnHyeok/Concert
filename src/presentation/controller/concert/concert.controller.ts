import { Controller, Get, Param, BadRequestException } from '@nestjs/common';
import {
  GetScheduleRequestDto,
  GetSeatsRequestDto,
} from '../../dto/request/concert.request.dto';
import {
  GetScheduleResponseDto,
  GetSeatsResponseDto,
} from '../../dto/response/concert.response.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConcertFacade } from '../../../application/facades/concert/concert.facade';

@ApiTags('concert')
@Controller('concert')
export class ConcertController {
  constructor(private readonly ConcertFacade: ConcertFacade) {}

  @Get('schedule/:concertId')
  @ApiResponse({ status: 200, type: GetScheduleResponseDto, isArray: true })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getSchedule(
    @Param() params: GetScheduleRequestDto,
  ): Promise<GetScheduleResponseDto[]> {
    const { concertId } = params;

    return await this.ConcertFacade.getAvailableDates(concertId);
  }

  @Get('/seat/:concertId/:performanceDate')
  @ApiResponse({ status: 200, type: GetSeatsResponseDto, isArray: true })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getSeats(
    @Param() params: GetSeatsRequestDto,
  ): Promise<GetSeatsResponseDto[]> {
    const { concertId, performanceDate } = params;

    return await this.ConcertFacade.getSeats(concertId, performanceDate);
  }
}
