import { Injectable } from '@nestjs/common';
import { User } from 'src/domain/user/model/entity/user.entity';
import { IUserRepository } from 'src/domain/user/model/repository/user.repository';
import { Repository, EntityManager } from 'typeorm';

@Injectable()
export class UserRepository
  extends Repository<User>
  implements IUserRepository
{
  async findById(id: number): Promise<User> {
    return await this.findOne({
      where: { id },
    });
  }

  async createUser(user: User): Promise<User> {
    return await this.save(user);
  }

  async updateUser(
    id: number,
    user: User,
    manager: EntityManager,
  ): Promise<User> {
    const oldUser = await this.findById(id);

    if (!oldUser) {
      return null;
    }

    Object.assign(oldUser, user);
    return await manager.save(oldUser); // Use manager for transaction context
  }

  async deleteUser(id: number): Promise<void> {
    await this.delete(id);
  }
}
