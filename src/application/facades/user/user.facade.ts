import { Inject } from '@nestjs/common';
import { UserService } from '../../../domain/user/services/user.service';

export class UserFacade {
  constructor(
    @Inject(UserService)
    private readonly userService: UserService,
  ) {}

  async createUser(userId: number, name: string) {
    return await this.userService.createUser(userId, name);
  }

  async chargePoint(userId: number, point: number) {
    return await this.userService.chargePoint(userId, point);
  }

  async checkPoint(userId: number) {
    return await this.userService.getPoint(userId);
  }

  async deleteUser(userId: number) {
    return await this.userService.deleteUser(userId);
  }
}
