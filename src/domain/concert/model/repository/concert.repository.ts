import { Concert } from '../entity/concert.entity';

export const CONCERT_REPOSITORY = 'CONCERT_REPOSITORY';

export interface IConcertRepository {
  findAll(): Promise<Concert[]>;
  createConcert(concert: Concert): Promise<Concert>;
  deleteConcert(id: number): Promise<void>;
}
