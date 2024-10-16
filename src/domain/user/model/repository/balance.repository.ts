import { Balance } from '../entity/balance.entity';

export const BALANCE_REPOSITORY = 'BALANCE_REPOSITORY';

export interface IBalanceRepository {
  findByUserId(userId: number): Promise<Balance>;
  createBalance(balance: Balance): Promise<Balance>;
  updateBalance(balance: Balance): Promise<Balance>;
}