import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../model/repository/user.repository';
import {
  BALANCE_REPOSITORY,
  IBalanceRepository,
} from '../model/repository/balance.repository';
import { User } from '../model/entity/user.entity';
import { DataSource, EntityManager } from 'typeorm';
import { BusinessException } from '../../../common/exception/business-exception';
import { USER_ERROR_CODES } from '../error/user.error';
import { Balance } from '../model/entity/balance.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    @Inject(BALANCE_REPOSITORY)
    private readonly balanceRepository: IBalanceRepository,

    private readonly dataSource: DataSource, // Inject DataSource for transactions
  ) {}

  async getById(userId: number): Promise<User> {
    return await this.userRepository.findById(userId);
  }
  async getByIdWithLock(userId: number, manager: EntityManager): Promise<User> {
    return await this.userRepository.findByUserIdWithLock(userId, manager);
  }

  async createUser(userId: number, name: string): Promise<User> {
    let user = await this.userRepository.createUser(userId, name);
    await this.balanceRepository.createBalance(userId);
    return user;
  }

  async chargePoint(
    userId: number,
    point: number,
  ): Promise<{ balance: number }> {
    const manager = this.dataSource.createEntityManager();
    let afterBalance: number | null = null;

    await manager.transaction(
      async (transactionalEntityManager: EntityManager) => {
        const user = await this.userRepository.findByUserIdWithLock(
          userId,
          transactionalEntityManager,
        );
        this.validateUser(user);

        const balance = await this.balanceRepository.findByUserIdWithLock(
          userId,
          transactionalEntityManager,
        );
        this.validateBalance(balance);

        balance.balance = Number(balance.balance) + point;
        await this.balanceRepository.updateBalance(
          balance,
          transactionalEntityManager,
        );

        user.balance = balance.balance;
        await this.userRepository.updateUser(
          userId,
          user,
          transactionalEntityManager,
        );
        afterBalance = balance.balance;
      },
    );

    return {
      balance: afterBalance,
    };
  }

  async usePoint(userId: number, point: number): Promise<{ balance: number }> {
    const manager = this.dataSource.createEntityManager();
    let afterBalance: number | null = null;

    await manager.transaction(
      async (transactionalEntityManager: EntityManager) => {
        const user = await this.userRepository.findByUserIdWithLock(
          userId,
          transactionalEntityManager,
        );
        this.validateUser(user);

        if (user.balance < point)
          throw new BusinessException(
            USER_ERROR_CODES.BALANCE_INSUFFICIENT,
            HttpStatus.BAD_REQUEST,
          );

        const balance = await this.balanceRepository.findByUserId(userId);
        this.validateBalance(balance);
        balance.balance -= point;
        await this.balanceRepository.updateBalance(
          balance,
          transactionalEntityManager,
        );

        user.balance -= point;
        await this.userRepository.updateUser(
          userId,
          user,
          transactionalEntityManager,
        );

        afterBalance = balance.balance;
      },
    );

    return {
      balance: afterBalance,
    };
  }

  async getPoint(userId: number): Promise<{ balance: number }> {
    const user = await this.userRepository.findById(userId);
    this.validateUser(user);

    return { balance: user.balance };
  }

  async findUserById(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);
    this.validateUser(user);
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await this.userRepository.deleteUser(id);
  }

  private validateUser(user: User): void {
    if (!user) {
      throw new BusinessException(
        USER_ERROR_CODES.USER_NOT_FOUND,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateBalance(balance: Balance): void {
    if (!balance) {
      throw new BusinessException(
        USER_ERROR_CODES.BALANCE_NOT_FOUND,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
