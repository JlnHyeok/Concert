import { EntityManager } from 'typeorm';
import { Balance } from '../entity/balance.entity';

export const BALANCE_REPOSITORY = 'BALANCE_REPOSITORY';

export interface IBalanceRepository {
  findByUserId(userId: number): Promise<Balance>;
  createBalance(userId: number): Promise<Balance>;
  updateBalance(balance: Balance, manager: EntityManager): Promise<Balance>;
}
