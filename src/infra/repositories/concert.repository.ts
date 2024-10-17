import { Injectable } from '@nestjs/common';
import { Concert } from '../../domain/concert/model/entity/concert.entity';
import { IConcertRepository } from '../../domain/concert/model/repository/concert.repository';
import { Repository } from 'typeorm';

@Injectable()
export class ConcertRepository
  extends Repository<Concert>
  implements IConcertRepository
{
  async findAll(): Promise<Concert[]> {
    return await this.find();
  }

  async createConcert(concert: Concert): Promise<Concert> {
    return await this.save(concert);
  }

  async deleteConcert(id: number): Promise<void> {
    await this.delete(id);
  }
}
