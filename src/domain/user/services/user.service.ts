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

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    @Inject(BALANCE_REPOSITORY)
    private readonly balanceRepository: IBalanceRepository,
  ) {}

  async chargePoint(
    userId: number,
    point: number,
  ): Promise<{ balance: number }> {
    const balance = await this.balanceRepository.findByUserId(userId);
    if (!balance) throw new NotFoundException('Balance not found');

    balance.balance += point;

    try {
      await this.balanceRepository.updateBalance(balance);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update balance');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.balance += point;
    try {
      await this.userRepository.updateUser(userId, user);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update user');
    }

    return { balance: balance.balance };
  }

  async usePoint(userId: number, point: number): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.balance < point) throw new Error('Insufficient balance');

    user.balance -= point;
    const updatedUser = await this.userRepository.updateUser(userId, user);
    if (!updatedUser)
      throw new InternalServerErrorException('Failed to update user');

    const balance = await this.balanceRepository.findByUserId(userId);
    if (!balance) throw new NotFoundException('Balance not found');

    balance.balance -= point;
    await this.balanceRepository.updateBalance(balance);
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
