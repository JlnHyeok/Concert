import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './model/entity/user.entity';
import { UserService } from './services/user.service';
import { Balance } from './model/entity/balance.entity';
import { UserRepository } from '../../infra/repo/user/user.repo';
import { USER_REPOSITORY } from './model/repository/user.repository';
import { BALANCE_REPOSITORY } from './model/repository/balance.repository';
import { BalanceRepository } from '../../infra/repo/user/balance.repo';

@Module({
  imports: [TypeOrmModule.forFeature([User, Balance])],
  providers: [
    UserService,
    { provide: USER_REPOSITORY, useClass: UserRepository },
    { provide: BALANCE_REPOSITORY, useClass: BalanceRepository },
  ],
  exports: [TypeOrmModule, UserService],
})
export class UsersModule {}
