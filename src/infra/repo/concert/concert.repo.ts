import { IConcertRepository } from '../../../domain/concert/model/repository/concert.repository';
import { Concert } from '../../../domain/concert/model/entity/concert.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class ConcertRepository implements IConcertRepository {
  constructor(
    @InjectRepository(Concert)
    private readonly concertRepository: Repository<Concert>,
  ) {}
  async findAll(): Promise<Concert[]> {
    return await this.concertRepository.find();
  }

  async createConcert(concert: Concert): Promise<Concert> {
    return await this.concertRepository.save(concert);
  }

  async deleteConcert(id: number): Promise<void> {
    await this.concertRepository.delete(id);
  }
}
