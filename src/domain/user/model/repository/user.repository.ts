import { EntityManager } from 'typeorm';
import { User } from '../entity/user.entity';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface IUserRepository {
  findById(id: number): Promise<User>;
  findByUserIdWithLock(id: number, manager: EntityManager): Promise<User>;
  createUser(userId: number, name: string): Promise<User>;
  updateUser(id: number, user: User, manager: EntityManager): Promise<User>;
  deleteUser(id: number): Promise<void>;
}
