import { Injectable } from '@nestjs/common';
import { PerformanceDate } from 'src/domain/concert/model/entity/performance-date.entity';
import { IPerformanceDateRepository } from 'src/domain/concert/model/repository/performance-date.repository';
import { Repository } from 'typeorm';

@Injectable()
export class PerformanceDateRepository
  extends Repository<PerformanceDate>
  implements IPerformanceDateRepository
{
  async findAll(): Promise<PerformanceDate[]> {
    return await this.find();
  }

  async findByConcertId(concertId: number): Promise<PerformanceDate[] | null> {
    return await this.find({
      where: { concert_id: concertId },
    });
  }

  async createPerformanceDate(
    performanceDate: PerformanceDate,
  ): Promise<PerformanceDate> {
    return await this.save(performanceDate);
  }

  async updatePerformanceDate(
    updatePerformanceDate: PerformanceDate,
  ): Promise<PerformanceDate> {
    return await this.save(updatePerformanceDate);
  }

  async deletePerformanceDate(id: number): Promise<void> {
    await this.delete(id);
  }
}
