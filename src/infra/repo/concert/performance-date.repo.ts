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
    let performanceDates = [];
    for (let i = 1; i <= 10; i++) {
      for (let j = 0; j <= 6; j++) {
        const performanceDate = new PerformanceDate();
        performanceDate.concertId = i;
        performanceDate.performanceDate = new Date(
          new Date().setDate(new Date().getDate() + j),
        );
        performanceDates.push(performanceDate);
      }

      await this.performanceDateRepository.save(performanceDates);
    }
  }
}
