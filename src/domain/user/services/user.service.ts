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

  async createUser(userId: number, name: string): Promise<User> {
    await this.balanceRepository.createBalance(userId);
    return await this.userRepository.createUser(userId, name);
  }

  async chargePoint(
    userId: number,
    point: number,
  ): Promise<{ balance: number }> {
    const manager = this.dataSource.createEntityManager();

    await manager.transaction(
      async (transactionalEntityManager: EntityManager) => {
        const balance = await this.balanceRepository.findByUserId(userId);
        this.validateBalance(balance);

        balance.balance += point;
        await this.balanceRepository.updateBalance(
          balance,
          transactionalEntityManager,
        );

        const user = await this.userRepository.findById(userId);
        this.validateUser(user);

        user.balance += point;
        await this.userRepository.updateUser(
          userId,
          user,
          transactionalEntityManager,
        );
      },
    );

    return {
      balance: (await this.balanceRepository.findByUserId(userId)).balance,
    };
  }

  async usePoint(userId: number, point: number): Promise<void> {
    const manager = this.dataSource.createEntityManager();

    await manager.transaction(
      async (transactionalEntityManager: EntityManager) => {
        const user = await this.userRepository.findById(userId);
        this.validateUser(user);

        if (user.balance < point)
          throw new BusinessException(
            USER_ERROR_CODES.BALANCE_INSUFFICIENT,
            HttpStatus.BAD_REQUEST,
          );

        user.balance -= point;
        await this.userRepository.updateUser(
          userId,
          user,
          transactionalEntityManager,
        );

        const balance = await this.balanceRepository.findByUserId(userId);
        this.validateBalance(balance);

        balance.balance -= point;
        await this.balanceRepository.updateBalance(
          balance,
          transactionalEntityManager,
        );
      },
    );
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
