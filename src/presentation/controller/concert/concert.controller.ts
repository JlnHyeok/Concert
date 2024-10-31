import {
  Controller,
  Get,
  Param,
  BadRequestException,
  Post,
  Body,
  Delete,
} from '@nestjs/common';
import {
  CreateConcertRequestDto,
  CreatePerforamnceDateRequestDto,
  CreateSeatRequestDto,
  GetScheduleRequestDto,
  GetSeatsRequestDto,
} from '../../dto/request/concert.request.dto';
import {
  CreateConcertResponseDto,
  CreatePerforamnceDateResponseDto,
  CreateSeatResponseDto,
  GetScheduleResponseDto,
  GetSeatsResponseDto,
} from '../../dto/response/concert.response.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConcertFacade } from '../../../application/facades/concert/concert.facade';

@ApiTags('concert')
@Controller('concert')
export class ConcertController {
  constructor(private readonly ConcertFacade: ConcertFacade) {}

  @Post('create')
  @ApiResponse({ status: 201, description: 'Concert created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async createConcert(
    @Body() body: CreateConcertRequestDto,
  ): Promise<CreateConcertResponseDto> {
    const { concertName, location } = body;

    return await this.ConcertFacade.createConcert(concertName, location);
  }

  @Post('schedule/create')
  @ApiResponse({
    status: 201,
    description: 'Performance date created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async createPerformanceDate(
    @Body() body: CreatePerforamnceDateRequestDto,
  ): Promise<CreatePerforamnceDateResponseDto> {
    const { concertId, performanceDate } = body;

    return await this.ConcertFacade.createPerformanceDate(
      concertId,
      performanceDate,
    );
  }

  @Post('seat/create')
  @ApiResponse({ status: 201, description: 'Seat created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async createSeat(
    @Body() body: CreateSeatRequestDto,
  ): Promise<CreateSeatResponseDto> {
    return await this.ConcertFacade.createSeat(body);
  }

  @Get('')
  @ApiResponse({ status: 200, type: GetScheduleResponseDto, isArray: true })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getAllConcerts(): Promise<any> {
    return await this.ConcertFacade.getAllConcerts();
  }

  @Get('schedule/:concertId')
  @ApiResponse({ status: 200, type: GetScheduleResponseDto, isArray: true })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getSchedule(
    @Param() params: GetScheduleRequestDto,
  ): Promise<GetScheduleResponseDto[]> {
    const { concertId } = params;

    return await this.ConcertFacade.getAvailableDates(concertId);
  }

  @Get('seat/:concertId/:performanceDate')
  @ApiResponse({ status: 200, type: GetSeatsResponseDto, isArray: true })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getSeats(
    @Param() params: GetSeatsRequestDto,
  ): Promise<GetSeatsResponseDto[]> {
    const { concertId, performanceDate } = params;

    return await this.ConcertFacade.getSeats(concertId, performanceDate);
  }

  @Delete('delete/:concertId')
  @ApiResponse({ status: 200, description: 'Concert deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async deleteConcert(@Param('concertId') concertId: number): Promise<void> {
    return await this.ConcertFacade.deleteConcert(concertId);
  }
}
