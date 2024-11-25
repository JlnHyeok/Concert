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

  async seedConcerts(): Promise<void> {
    const concerts = [];

    for (let i = 1; i <= 10; i++) {
      const concert = new Concert();
      concert.name = `Concert ${i}`;
      concert.location = `Location ${i % 10}`;
      concerts.push(concert);

      await this.concertRepository.save(concerts);
    }
  }

  async createConcert(name: string, location: string): Promise<Concert> {
    const concert = {
      name,
      location,
    };
    return await this.concertRepository.save(concert);
  }

  async deleteConcert(id: number): Promise<void> {
    await this.concertRepository.delete(id);
  }
}
