import { InjectRepository } from '@nestjs/typeorm';
import { PerformanceDate } from '../../../domain/concert/model/entity/performance-date.entity';
import { IPerformanceDateRepository } from '../../../domain/concert/model/repository/performance-date.repository';
import { Repository, EntityManager } from 'typeorm';

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
    performanceDate: PerformanceDate,
  ): Promise<PerformanceDate> {
    return await this.performanceDateRepository.save(performanceDate);
  }

  async updatePerformanceDate(
    updatePerformanceDate: PerformanceDate,
  ): Promise<PerformanceDate> {
    return await this.performanceDateRepository.save(updatePerformanceDate);
  }

  async deletePerformanceDate(id: number): Promise<void> {
    await this.performanceDateRepository.delete(id);
  }
}