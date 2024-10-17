import { Controller, Get, Param } from '@nestjs/common';
import { ConcertService } from 'src/domain/concert/service/consert.service';
import {
  GetScheduleRequestDto,
  GetSeatsRequestDto,
} from '../dto/request/concert.request.dto';
import dayjs from 'dayjs';
import {
  GetScheduleResponseDto,
  GetSeatsResponseDto,
} from '../dto/response/concert.response.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('concert')
@Controller('concert')
export class ConcertController {
  constructor(private readonly concertService: ConcertService) {}

  @Get('schedule/:concertId')
  @ApiResponse({ status: 201, type: GetScheduleResponseDto, isArray: true })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getSchedule(
    @Param() params: GetScheduleRequestDto,
  ): Promise<GetScheduleResponseDto[]> {
    const { concertId } = params;
    return await this.concertService.getAvailableDates(concertId);
  }

  @Get('/seat/:concertId/:performanceDate')
  @ApiResponse({ status: 201, type: GetSeatsResponseDto, isArray: true })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getSeats(
    @Param() params: GetSeatsRequestDto,
  ): Promise<GetSeatsResponseDto[]> {
    const { concertId, performanceDate } = params;
    return await this.concertService.getSeats(concertId, performanceDate);
  }
}
