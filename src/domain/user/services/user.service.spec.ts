import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { IUserRepository } from '../model/repository/user.repository';
import { IBalanceRepository } from '../model/repository/balance.repository';
import { User } from '../model/entity/user.entity';
import { USER_ERROR_CODES } from '../error/user.error';
import { EntityManager } from 'typeorm';
import { Balance } from '../model/entity/balance.entity';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: IUserRepository;
  let balanceRepository: IBalanceRepository;
  let entityManager: EntityManager;

  const mockUserRepository = {
    findById: jest.fn(),
    updateUser: jest.fn(),
  };

  const mockBalanceRepository = {
    findByUserId: jest.fn(),
    updateBalance: jest.fn(),
  };

  const mockEntityManager = {
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
        { provide: EntityManager, useValue: mockEntityManager }, // Mocking DataSource
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<IUserRepository>('USER_REPOSITORY');
    balanceRepository = module.get<IBalanceRepository>('BALANCE_REPOSITORY');
    entityManager = module.get<EntityManager>(EntityManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('UserService', () => {
    let userService: UserService;
    let userRepository: IUserRepository;
    let balanceRepository: IBalanceRepository;
    let entityManager: EntityManager;

    const mockUserRepository = {
      findById: jest.fn(),
      findByUserIdWithLock: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    };

    const mockBalanceRepository = {
      findByUserId: jest.fn(),
      findByUserIdWithLock: jest.fn(),
      createBalance: jest.fn(),
      updateBalance: jest.fn(),
    };

    const mockEntityManager = {
      transaction: jest.fn().mockImplementation(async (callback) => {
        const transactionalEntityManager = {};
        await callback(transactionalEntityManager);
      }),
    };

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UserService,
          { provide: 'USER_REPOSITORY', useValue: mockUserRepository },
          { provide: 'BALANCE_REPOSITORY', useValue: mockBalanceRepository },
          { provide: EntityManager, useValue: mockEntityManager },
        ],
      }).compile();

      userService = module.get<UserService>(UserService);
      userRepository = module.get<IUserRepository>('USER_REPOSITORY');
      balanceRepository = module.get<IBalanceRepository>('BALANCE_REPOSITORY');
      entityManager = module.get<EntityManager>(EntityManager);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('findUserById', () => {
      it('should return user if found', async () => {
        const mockUser = { id: 1, name: 'John', balance: 100 } as User;
        jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);

        const result = await userService.findUserById(1);

        expect(result).toEqual(mockUser);
        expect(userRepository.findById).toHaveBeenCalledWith(1);
      });

      it('should throw an error if user not found', async () => {
        jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

        await expect(userService.findUserById(1)).rejects.toThrow(
          USER_ERROR_CODES.USER_NOT_FOUND.message,
        );
      });
    });

    describe('chargePoint', () => {
      it('should successfully charge points', async () => {
        const mockUser = { id: 1, name: 'John', balance: 100 } as User;
        const mockBalance = { userId: 1, balance: 100 } as Balance;

        jest
          .spyOn(userRepository, 'findByUserIdWithLock')
          .mockResolvedValue(mockUser);
        jest
          .spyOn(balanceRepository, 'findByUserIdWithLock')
          .mockResolvedValue(mockBalance);

        await userService.chargePoint(1, 50);

        expect(mockEntityManager.transaction).toHaveBeenCalled();
        expect(balanceRepository.updateBalance).toHaveBeenCalledWith(
          { ...mockBalance, balance: 150 },
          expect.any(Object),
        );
      });

      it('should throw an error if user not found', async () => {
        jest
          .spyOn(userRepository, 'findByUserIdWithLock')
          .mockResolvedValue(null);

        await expect(userService.chargePoint(1, 50)).rejects.toThrow(
          USER_ERROR_CODES.USER_NOT_FOUND.message,
        );
      });

      it('should throw an error if balance not found', async () => {
        const mockUser = { id: 1, name: 'John', balance: 100 } as User;

        jest
          .spyOn(userRepository, 'findByUserIdWithLock')
          .mockResolvedValue(mockUser);
        jest
          .spyOn(balanceRepository, 'findByUserIdWithLock')
          .mockResolvedValue(null);

        await expect(userService.chargePoint(1, 50)).rejects.toThrow(
          USER_ERROR_CODES.BALANCE_NOT_FOUND.message,
        );
      });
    });

    describe('usePoint', () => {
      it('should successfully use points', async () => {
        const mockUser = { id: 1, name: 'John', balance: 100 } as User;
        const mockBalance = { userId: 1, balance: 100 } as Balance;

        jest
          .spyOn(userRepository, 'findByUserIdWithLock')
          .mockResolvedValue(mockUser);
        jest
          .spyOn(balanceRepository, 'findByUserIdWithLock')
          .mockResolvedValue(mockBalance);
        jest
          .spyOn(balanceRepository, 'findByUserId')
          .mockResolvedValue(mockBalance);

        await userService.usePoint(1, 50);

        expect(mockEntityManager.transaction).toHaveBeenCalled();
        expect(balanceRepository.updateBalance).toHaveBeenCalledWith(
          { ...mockBalance, balance: 50 },
          expect.any(Object),
        );
      });

      it('should throw an error if user not found', async () => {
        jest
          .spyOn(userRepository, 'findByUserIdWithLock')
          .mockResolvedValue(null);

        await expect(userService.usePoint(1, 50)).rejects.toThrow(
          USER_ERROR_CODES.USER_NOT_FOUND.message,
        );
      });

      it('should throw an error if insufficient balance', async () => {
        const mockUser = { id: 1, name: 'John', balance: 30 } as User;

        jest
          .spyOn(userRepository, 'findByUserIdWithLock')
          .mockResolvedValue(mockUser);

        await expect(userService.usePoint(1, 50)).rejects.toThrow(
          USER_ERROR_CODES.BALANCE_INSUFFICIENT.message,
        );
      });
    });

    describe('getPoint', () => {
      it('should return balance if user exists', async () => {
        const mockUser = { id: 1, name: 'John', balance: 100 } as User;

        jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);

        const result = await userService.getPoint(1);

        expect(result).toEqual({ balance: 100 });
      });

      it('should throw an error if user not found', async () => {
        jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

        await expect(userService.getPoint(1)).rejects.toThrow(
          USER_ERROR_CODES.USER_NOT_FOUND.message,
        );
      });
    });

    describe('createUser', () => {
      it('should successfully create user and balance', async () => {
        const mockUser = { id: 1, name: 'John', balance: 0 } as User;
        const mockBalance = { userId: 1, balance: 0 } as Balance;

        jest.spyOn(userRepository, 'createUser').mockResolvedValue(mockUser);
        jest
          .spyOn(balanceRepository, 'createBalance')
          .mockResolvedValue(mockBalance);

        const result = await userService.createUser(1, 'John');

        expect(result).toEqual(mockUser);
        expect(userRepository.createUser).toHaveBeenCalledWith(1, 'John');
        expect(balanceRepository.createBalance).toHaveBeenCalledWith(1);
      });
    });
  });
});
