import {
  Inject,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
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

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    @Inject(BALANCE_REPOSITORY)
    private readonly balanceRepository: IBalanceRepository,

    private readonly dataSource: DataSource, // Inject DataSource for transactions
  ) {}

  async chargePoint(
    userId: number,
    point: number,
  ): Promise<{ balance: number }> {
    const manager = this.dataSource.createEntityManager();

    await manager.transaction(
      async (transactionalEntityManager: EntityManager) => {
        const balance = await this.balanceRepository.findByUserId(userId);
        if (!balance) throw new NotFoundException('Balance not found');

        balance.balance += point;
        await this.balanceRepository.updateBalance(
          balance,
          transactionalEntityManager,
        );

        const user = await this.userRepository.findById(userId);
        if (!user) throw new NotFoundException('User not found');

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
        if (!user) throw new NotFoundException('User not found');

        if (user.balance < point) throw new Error('Insufficient balance');

        user.balance -= point;
        await this.userRepository.updateUser(
          userId,
          user,
          transactionalEntityManager,
        );

        const balance = await this.balanceRepository.findByUserId(userId);
        if (!balance) throw new NotFoundException('Balance not found');

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
    if (!user) throw new NotFoundException('User not found');

    return { balance: user.balance };
  }

  async findUserById(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
