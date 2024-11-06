import { EntityManager } from 'typeorm';
import { User } from '../entity/user.entity';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface IUserRepository {
  findById(id: number): Promise<User>;
  createUser(user: User): Promise<User>;
  updateUser(id: number, user: User, manager: EntityManager): Promise<User>;
  deleteUser(id: number): Promise<void>;
}
