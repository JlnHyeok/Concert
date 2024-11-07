import { PerformanceDate } from '../entity/performance-date.entity';

export const PERFORMANCE_DATE_REPOSITORY = 'PERFORMANCE_DATE_REPOSITORY';

export interface IPerformanceDateRepository {
  findAll(): Promise<PerformanceDate[]>;
  findByConcertId(concertId: number): Promise<PerformanceDate[]>;
  createPerformanceDate(
    concertId: number,
    performanceData: Date,
  ): Promise<PerformanceDate>;
  updatePerformanceDate(
    performanceDate: PerformanceDate,
  ): Promise<PerformanceDate>;
  deletePerformanceDateByConcertId(id: number): Promise<void>;
}
