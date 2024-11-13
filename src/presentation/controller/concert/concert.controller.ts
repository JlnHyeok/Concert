import { Controller, Param, Post, Body, Delete, Inject } from '@nestjs/common';
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
  GetAllConcertsResponseDto,
  GetScheduleResponseDto,
  GetSeatsResponseDto,
} from '../../dto/response/concert.response.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConcertFacade } from '../../../application/facades/concert/concert.facade';
import { Get } from '@nestjs/common';
import Redis from 'ioredis';

@ApiTags('concert')
@Controller('concert')
export class ConcertController {
  constructor(
    private readonly ConcertFacade: ConcertFacade,
    @Inject(Redis)
    private readonly redisClient: Redis,
  ) {}

  @Post('seeds')
  @ApiResponse({ status: 200, description: 'Concerts seeded successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async seedConcerts(): Promise<void> {
    return await this.ConcertFacade.seedConcerts();
  }

  @Post('schedule/seeds')
  @ApiResponse({
    status: 200,
    description: 'Performance dates seeded successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async seedPerformanceDates(): Promise<void> {
    return await this.ConcertFacade.seedPerformanceDates();
  }

  @Post('seat/seeds')
  @ApiResponse({ status: 200, description: 'Seats seeded successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async seedSeats(): Promise<void> {
    return await this.ConcertFacade.seedSeats();
  }

  @Post('create')
  @ApiResponse({ status: 201, description: 'Concert created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async createConcert(
    @Body() body: CreateConcertRequestDto,
  ): Promise<CreateConcertResponseDto> {
    const { concertName, location } = body;
    const cacheKey = 'concerts';
    await this.redisClient.del(cacheKey);

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
    const cacheKey = `concert/schedule/${concertId}`;
    await this.redisClient.del(cacheKey);

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

  @Get()
  @ApiResponse({ status: 200, type: GetScheduleResponseDto, isArray: true })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getAllConcerts(): Promise<GetAllConcertsResponseDto[]> {
    const cacheKey = 'concerts';
    let responseData = JSON.parse(await this.redisClient.get(cacheKey));

    if (!responseData) {
      responseData = await this.ConcertFacade.getAllConcerts();

      await this.redisClient.setex(
        cacheKey,
        3 * 60000,
        JSON.stringify(responseData),
      );
    }

    return responseData as GetAllConcertsResponseDto[];
  }

  @Get('schedule/:concertId')
  @ApiResponse({ status: 200, type: GetScheduleResponseDto, isArray: true })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async getSchedule(
    @Param() params: GetScheduleRequestDto,
  ): Promise<GetScheduleResponseDto[]> {
    const { concertId } = params;
    const cacheKey = `concert/schedule/${concertId}`;
    let responseData = JSON.parse(await this.redisClient.get(cacheKey));

    if (!responseData) {
      responseData = await this.ConcertFacade.getAvailableDates(concertId);

      await this.redisClient.setex(
        cacheKey,
        3 * 60000,
        JSON.stringify(responseData),
      );
    }

    return responseData as GetScheduleResponseDto[];
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
