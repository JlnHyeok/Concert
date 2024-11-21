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

    for (let i = 1; i <= 100_000; i++) {
      const concert = new Concert();
      concert.name = `Concert ${i}`;
      concert.location = `Location ${i % 100}`;
      concerts.push(concert);

      if (concerts.length === 1000) {
        await this.concertRepository.save(concerts);
        concerts.length = 0;
      }
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
