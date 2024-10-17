import { Controller, Get, Param, BadRequestException } from '@nestjs/common';
import {
  GetScheduleRequestDto,
  GetSeatsRequestDto,
} from '../dto/request/concert.request.dto';
import {
  GetScheduleResponseDto,
  GetSeatsResponseDto,
} from '../dto/response/concert.response.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConcertService } from '../../domain/concert/service/consert.service';

@ApiTags('concert')
@Controller('concert')
export class ConcertController {
  constructor(private readonly concertService: ConcertService) {}

  @Get('schedule/:concertId')
  @ApiResponse({ status: 200, type: GetScheduleResponseDto, isArray: true })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getSchedule(
    @Param() params: GetScheduleRequestDto,
  ): Promise<GetScheduleResponseDto[]> {
    const { concertId } = params;

    // concertId 유효성 검사 추가
    if (!concertId || isNaN(Number(concertId))) {
      throw new BadRequestException('Invalid concertId');
    }

    return await this.concertService.getAvailableDates(concertId);
  }

  @Get('/seat/:concertId/:performanceDate')
  @ApiResponse({ status: 200, type: GetSeatsResponseDto, isArray: true })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getSeats(
    @Param() params: GetSeatsRequestDto,
  ): Promise<GetSeatsResponseDto[]> {
    const { concertId, performanceDate } = params;

    // concertId 유효성 검사 추가
    if (!concertId || isNaN(Number(concertId))) {
      throw new BadRequestException('Invalid concertId');
    }

    return await this.concertService.getSeats(concertId, performanceDate);
  }
}
