import { Injectable } from '@nestjs/common';
import { Reservation } from 'src/domain/reservation/model/entity/reservation.entity';
import { IReservationRepository } from 'src/domain/reservation/model/repository/reservation.repository';
import { Repository } from 'typeorm';

@Injectable()
export class ReservationRepository
  extends Repository<Reservation>
  implements IReservationRepository
{
  async createReservation(reservation: Reservation): Promise<Reservation> {
    return await this.save(reservation);
  }

  async deleteReservation(id: number): Promise<void> {
    await this.delete(id);
  }
}
