import { PerformanceDate } from '../entity/performance-date.entity';

export const PERFORMANCE_DATE_REPOSITORY = 'PERFORMANCE_DATE_REPOSITORY';

export interface IPerformanceDateRepository {
  findAll(): Promise<PerformanceDate[]>;
  findByConcertId(concertId: number): Promise<PerformanceDate[]>;
  createPerformanceDate(
    performanceDate: PerformanceDate,
  ): Promise<PerformanceDate>;
  updatePerformanceDate(
    performanceDate: PerformanceDate,
  ): Promise<PerformanceDate>;
  deletePerformanceDate(id: number): Promise<void>;
}
