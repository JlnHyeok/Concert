import { InjectRepository } from '@nestjs/typeorm';
import { PerformanceDate } from '../../../domain/concert/model/entity/performance-date.entity';
import { IPerformanceDateRepository } from '../../../domain/concert/model/repository/performance-date.repository';
import { Repository } from 'typeorm';

export class PerformanceDateRepository implements IPerformanceDateRepository {
  constructor(
    @InjectRepository(PerformanceDate)
    private readonly performanceDateRepository: Repository<PerformanceDate>,
  ) {}
  async findAll(): Promise<PerformanceDate[]> {
    return await this.performanceDateRepository.find();
  }

  async findByConcertId(concertId: number): Promise<PerformanceDate[] | null> {
    return await this.performanceDateRepository.find({
      where: { concertId },
    });
  }

  async createPerformanceDate(
    concertId: number,
    performanceDate: Date,
  ): Promise<PerformanceDate> {
    let createPerformanceDate = {
      concertId,
      performanceDate,
    };

    return await this.performanceDateRepository.save(createPerformanceDate);
  }

  async updatePerformanceDate(
    updatePerformanceDate: PerformanceDate,
  ): Promise<PerformanceDate> {
    return await this.performanceDateRepository.save(updatePerformanceDate);
  }

  async deletePerformanceDateByConcertId(id: number): Promise<void> {
    await this.performanceDateRepository.delete({ concertId: id });
  }

  async seedPerformanceDates(): Promise<void> {
    const performanceDates = [];
    for (let i = 1; i <= 100_000; i++) {
      for (let j = 0; j <= 30; j++) {
        const performanceDate = new PerformanceDate();
        performanceDate.concertId = i;
        performanceDate.performanceDate = new Date(
          new Date().setDate(new Date().getDate() + j),
        );
        performanceDates.push(performanceDate);
      }

      if (performanceDates.length > 3000) {
        await this.performanceDateRepository.save(performanceDates);
        performanceDates.length = 0;
      }
    }
  }
}
