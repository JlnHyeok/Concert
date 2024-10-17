import { Injectable } from '@nestjs/common';
import { Balance } from 'src/domain/user/model/entity/balance.entity';
import { IBalanceRepository } from 'src/domain/user/model/repository/balance.repository';
import { Repository } from 'typeorm';

@Injectable()
export class BalanceRepository
  extends Repository<Balance>
  implements IBalanceRepository
{
  async findByUserId(id: number): Promise<Balance> {
    return await this.findOne({
      where: { userId: id },
    });
  }
  async createBalance(balance: Balance): Promise<Balance> {
    return await this.save(balance);
  }

  async updateBalance(updateBalance: Balance): Promise<Balance> {
    return await this.save(updateBalance);
  }
}
