import { InjectRepository } from '@nestjs/typeorm';
import { Balance } from '../../../domain/user/model/entity/balance.entity';
import { IBalanceRepository } from '../../../domain/user/model/repository/balance.repository';
import { EntityManager, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BalanceRepository implements IBalanceRepository {
  constructor(
    @InjectRepository(Balance)
    private readonly balanceRepository: Repository<Balance>,
  ) {}
  async findByUserId(id: number): Promise<Balance> {
    return await this.balanceRepository.findOne({
      where: { userId: id },
    });
  }

  async findByUserIdWithLock(
    userId: number,
    manager: EntityManager,
  ): Promise<Balance> {
    return await manager
      .createQueryBuilder(Balance, 'balance')
      .setLock('pessimistic_write')
      .where('balance.userId = :userId', { userId: userId })
      .getOne();
  }

  async createBalance(userId: number): Promise<Balance> {
    return await this.balanceRepository.save({ userId: userId, balance: 0 });
  }

  async updateBalance(
    updateBalance: Balance,
    manager: EntityManager,
  ): Promise<Balance> {
    return await manager
      .createQueryBuilder()
      .setLock('pessimistic_write')
      .update(Balance)
      .set({ balance: updateBalance.balance })
      .where('userId = :userId', { userId: updateBalance.userId })
      .execute()
      .then(() => updateBalance);
  }
}
