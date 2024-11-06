import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Concert } from './model/entity/concert.entity';
import { Seat } from './model/entity/seat.entity';
import { ConcertService } from './service/consert.service';
import { CONCERT_REPOSITORY } from './model/repository/concert.repository';
import { ConcertRepository } from '../../infra/repo/concert/concert.repo';
import { PERFORMANCE_DATE_REPOSITORY } from './model/repository/performance-date.repository';
import { PerformanceDateRepository } from '../../infra/repo/concert/performance-date.repo';
import { SEAT_REPOSITORY } from './model/repository/seat.repository';
import { SeatRepository } from '../../infra/repo/concert/seat.repo';
import { PerformanceDate } from './model/entity/performance-date.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Concert, PerformanceDate, Seat])],
  providers: [
    ConcertService,
    {
      provide: CONCERT_REPOSITORY,
      useClass: ConcertRepository,
    },
    {
      provide: PERFORMANCE_DATE_REPOSITORY,
      useClass: PerformanceDateRepository,
    },
    {
      provide: SEAT_REPOSITORY,
      useClass: SeatRepository,
    },
  ],
  exports: [TypeOrmModule, ConcertService],
})
export class ConcertModule {}
