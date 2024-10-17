import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { IUserRepository } from '../model/repository/user.repository';
import { IBalanceRepository } from '../model/repository/balance.repository';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Balance } from '../model/entity/balance.entity';
import { User } from '../model/entity/user.entity';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: IUserRepository;
  let balanceRepository: IBalanceRepository;

  const mockUserRepository = {
    findById: jest.fn(),
    updateUser: jest.fn(),
  };

  const mockBalanceRepository = {
    findByUserId: jest.fn(),
    updateBalance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: 'USER_REPOSITORY', useValue: mockUserRepository },
        { provide: 'BALANCE_REPOSITORY', useValue: mockBalanceRepository },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<IUserRepository>('USER_REPOSITORY');
    balanceRepository = module.get<IBalanceRepository>('BALANCE_REPOSITORY');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('chargePoint', () => {
    it('should throw an error if user does not exist', async () => {
      const userId = 1;
      const pointToCharge = 100;

      jest
        .spyOn(balanceRepository, 'findByUserId')
        .mockResolvedValue({ userId: 1, balance: 0 });
      jest.spyOn(userRepository, 'findById').mockResolvedValue(null); // User does not exist

      await expect(
        userService.chargePoint(userId, pointToCharge),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw an error if balance update fails', async () => {
      const userId = 1;
      const pointToCharge = 100;

      const mockBalance = { balance: 0 } as Balance;
      const mockUser = { balance: 300 } as User;

      jest
        .spyOn(balanceRepository, 'findByUserId')
        .mockResolvedValue(mockBalance);
      jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
      jest
        .spyOn(balanceRepository, 'updateBalance')
        .mockRejectedValue(new Error('Update failed'));

      await expect(
        userService.chargePoint(userId, pointToCharge),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should return updated balance after charging points', async () => {
      const userId = 1;
      const pointToCharge = 100;

      const mockBalance = { balance: 0 } as Balance;
      const mockUser = { balance: 300 } as User;

      jest
        .spyOn(balanceRepository, 'findByUserId')
        .mockResolvedValue(mockBalance);
      jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
      jest
        .spyOn(balanceRepository, 'updateBalance')
        .mockResolvedValue(mockBalance);
      jest.spyOn(userRepository, 'updateUser').mockResolvedValue(mockUser);

      const result = await userService.chargePoint(userId, pointToCharge);
      expect(result).toEqual({ balance: 100 });
    });
  });

  describe('usePoint', () => {
    it('should throw an error if user does not exist', async () => {
      const userId = 1;
      const pointToUse = 50;

      jest.spyOn(userRepository, 'findById').mockResolvedValue(null); // User does not exist

      await expect(userService.usePoint(userId, pointToUse)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw an error if user tries to use more points than available', async () => {
      const userId = 1;
      const pointToUse = 150; // More than available balance

      const mockUser = { balance: 100 } as User;
      jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);

      await expect(userService.usePoint(userId, pointToUse)).rejects.toThrow(
        'Insufficient balance',
      );
    });

    it('should throw an error if balance update fails', async () => {
      const userId = 1;
      const pointToUse = 50;

      const mockUser = { balance: 100 } as User;
      const mockBalance = { balance: 200 } as Balance;

      jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
      jest
        .spyOn(balanceRepository, 'findByUserId')
        .mockResolvedValue(mockBalance);

      jest.spyOn(userRepository, 'updateUser').mockResolvedValue(null); // Update failed

      await expect(userService.usePoint(userId, pointToUse)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getPoint', () => {
    it('should throw an error if user does not exist', async () => {
      const userId = 1;

      jest.spyOn(userRepository, 'findById').mockResolvedValue(null); // User does not exist

      await expect(userService.getPoint(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should return the user's balance", async () => {
      const userId = 1;
      const mockUser = { balance: 300 } as User;

      jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);

      const result = await userService.getPoint(userId);
      expect(result).toEqual({ balance: 300 });
    });
  });

  describe('findUserById', () => {
    it('should throw an error if user does not exist', async () => {
      const userId = 1;

      jest.spyOn(userRepository, 'findById').mockResolvedValue(null); // User does not exist

      await expect(userService.findUserById(userId)).rejects.toThrow(
        NotFoundException,
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
