import { InjectRepository } from '@nestjs/typeorm';
import { IUserRepository } from '../../../domain/user/model/repository/user.repository';
import { User } from '../../../domain/user/model/entity/user.entity';
import { EntityManager, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: number, manager?: EntityManager): Promise<User> {
    const entityManager = manager
      ? manager.getRepository(User)
      : this.userRepository;

    return await entityManager.findOne({
      where: { id },
      relations: ['reservations'],
    });
  }

  async findByUserIdWithLock(
    userId: number,
    manager: EntityManager,
  ): Promise<User> {
    return await manager
      .createQueryBuilder(User, 'user')
      .setLock('pessimistic_write')
      .where('user.id = :id', { id: userId })
      .getOne();
  }

  async createUser(userId: number, name: string): Promise<User> {
    const user = {
      id: userId,
      name,
      balance: 0,
    };
    return await this.userRepository.save(user);
  }

  async updateUser(
    id: number,
    user: User,
    manager: EntityManager,
  ): Promise<User> {
    const oldUser = await this.userRepository.findOne({ where: { id } });

    if (!oldUser) {
      return null;
    }

    Object.assign(oldUser, user);
    return await manager.save(oldUser); // Use manager for transaction context
  }

  async deleteUser(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
