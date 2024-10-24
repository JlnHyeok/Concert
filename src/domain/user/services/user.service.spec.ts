import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { IUserRepository } from '../model/repository/user.repository';
import { IBalanceRepository } from '../model/repository/balance.repository';
import { User } from '../model/entity/user.entity';
import { DataSource } from 'typeorm';
import { USER_ERROR_CODES } from '../error/user.error';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: IUserRepository;
  let balanceRepository: IBalanceRepository;
  let dataSource: DataSource;

  const mockUserRepository = {
    findById: jest.fn(),
    updateUser: jest.fn(),
  };

  const mockBalanceRepository = {
    findByUserId: jest.fn(),
    updateBalance: jest.fn(),
  };

  const mockDataSource = {
    createEntityManager: jest.fn().mockReturnValue({
      transaction: jest.fn().mockImplementation(async (callback) => {
        // Mocking the transactional behavior
        const transactionalEntityManager = {
          // Implement methods you want to mock
          updateBalance: jest.fn(),
          updateUser: jest.fn(),
        };
        await callback(transactionalEntityManager);
      }),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: 'USER_REPOSITORY', useValue: mockUserRepository },
        { provide: 'BALANCE_REPOSITORY', useValue: mockBalanceRepository },
        { provide: DataSource, useValue: mockDataSource }, // Mocking DataSource
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<IUserRepository>('USER_REPOSITORY');
    balanceRepository = module.get<IBalanceRepository>('BALANCE_REPOSITORY');
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findUserById', () => {
    it('should throw an error if user does not exist', async () => {
      const userId = 1;

      jest.spyOn(userRepository, 'findById').mockResolvedValue(null); // User does not exist

      await expect(userService.findUserById(userId)).rejects.toThrow(
        USER_ERROR_CODES.USER_NOT_FOUND.message,
      );
    });

    it('should return the user if exists', async () => {
      const userId = 1;
      const mockUser = { id: 1, name: 'John', balance: 100 } as User;

      jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);

      const result = await userService.findUserById(userId);
      expect(result).toEqual(mockUser);
    });
  });
});
