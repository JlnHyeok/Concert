import { Injectable } from '@nestjs/common';
import { Balance } from '../../domain/user/model/entity/balance.entity';
import { IBalanceRepository } from '../../domain/user/model/repository/balance.repository';
import { DataSource, Repository, EntityManager } from 'typeorm';

@Injectable()
export class BalanceRepository
  extends Repository<Balance>
  implements IBalanceRepository
{
  constructor(private readonly dataSource: DataSource) {
    super(Balance, dataSource.createEntityManager());
  }

  async findByUserId(id: number): Promise<Balance> {
    return await this.findOne({
      where: { userId: id },
    });
  }

  async createBalance(balance: Balance): Promise<Balance> {
    return await this.save(balance);
  }

  async updateBalance(
    updateBalance: Balance,
    manager: EntityManager,
  ): Promise<Balance> {
    return await manager.save(updateBalance); // Use manager for transaction context
  }
}
