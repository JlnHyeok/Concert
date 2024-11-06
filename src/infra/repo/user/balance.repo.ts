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

  async createBalance(userId: number): Promise<Balance> {
    return await this.balanceRepository.save({ id: userId, balance: 0 });
  }

  async updateBalance(
    updateBalance: Balance,
    manager: EntityManager,
  ): Promise<Balance> {
    return await manager.save(updateBalance); // Use manager for transaction context
  }
}
