import { Injectable } from '@nestjs/common';
import { Reservation } from 'src/domain/reservation/model/entity/reservation.entity';
import { IReservationRepository } from 'src/domain/reservation/model/repository/reservation.repository';
import { Repository } from 'typeorm';

@Injectable()
export class ReservationRepository
  extends Repository<Reservation>
  implements IReservationRepository
{
  async findById(id: number): Promise<Reservation> {
    return await this.findOne({
      where: { id },
    });
  }
  async findByUserId(userId: number): Promise<Reservation[]> {
    return await this.find({
      where: { id: userId },
    });
  }
  async createReservation(
    userId: number,
    seatId: number,
    createdAt: Date,
  ): Promise<Reservation> {
    return await this.save({ userId, seatId, createdAt });
  }

  async deleteReservation(id: number): Promise<void> {
    await this.delete(id);
  }
}
