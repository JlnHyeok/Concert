import { Test, TestingModule } from '@nestjs/testing';
import { ConcertService } from '../../../domain/concert/service/consert.service';
import { ReservationService } from '../../../domain/reservation/service/reservation.service';
import { UserService } from '../../../domain/user/services/user.service';
import { WaitingQueueService } from '../../../domain/waiting-queue/services/waiting-queue.service';
import { ReservationFacade } from './reservation.facade';
import { COMMON_ERRORS } from '../../../common/constants/error';
import { IUserRepository } from '../../../domain/user/model/repository/user.repository';
import { IReservationRepository } from '../../../domain/reservation/model/repository/reservation.repository';
import { BusinessException } from '../../../common/exception/business-exception';
import { USER_ERROR_CODES } from '../../../domain/user/error/user.error';
import { CONCERT_ERROR_CODES } from '../../../domain/concert/error/concert.error';
import { RESERVATION_ERROR_CODES } from '../../../domain/reservation/error/reservation.error';

describe('ReservationFacade', () => {
  let reservationFacade: ReservationFacade;
  let reservationService: ReservationService;
  let userService: UserService;
  let concertService: ConcertService;
  let waitingQueueService: WaitingQueueService;
  let userRepository: IUserRepository;
  let reservationRepository: IReservationRepository;

  const mockUserRepository = {
    findById: jest.fn(),
    updateUser: jest.fn(),
  };
  const mockReservationRepository = {
    findByIdWithLock: jest.fn(),
    findByUserIdWithLock: jest.fn(),
    createReservation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationFacade,
        {
          provide: 'RESERVATION_REPOSITORY',
          useValue: mockReservationRepository,
        },
        { provide: 'USER_REPOSITORY', useValue: mockUserRepository },
        {
          provide: ReservationService,
          useValue: {
            createReservation: jest.fn(),
            getReservation: jest.fn(),
            createPayment: jest.fn(),
          },
        },
        {
          provide: WaitingQueueService,
          useValue: {
            checkWaitingQueue: jest.fn(),
            expireToken: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findUserById: jest.fn(),
            usePoint: jest.fn(),
          },
        },
        {
          provide: ConcertService,
          useValue: {
            getSeats: jest.fn(),
            getSeat: jest.fn(),
            updateSeat: jest.fn(),
          },
        },
      ],
    }).compile();

    reservationFacade = module.get<ReservationFacade>(ReservationFacade);
    reservationService = module.get<ReservationService>(ReservationService);
    userService = module.get<UserService>(UserService);
    concertService = module.get<ConcertService>(ConcertService);
    waitingQueueService = module.get<WaitingQueueService>(WaitingQueueService);
    userRepository = module.get<IUserRepository>('USER_REPOSITORY');
    reservationRepository = module.get<IReservationRepository>(
      'RESERVATION_REPOSITORY',
    );
  });

  describe('createReservation', () => {
    it('should throw BusinessException if seat is not found', async () => {
      jest.spyOn(waitingQueueService, 'checkWaitingQueue').mockResolvedValue({
        status: 'PROCESSING' as 'PROCESSING',
        expireAt: new Date(),
        waitingNumber: 0,
        remainingTime: 0,
      });
      jest.spyOn(concertService, 'getSeats').mockResolvedValue([]);
      jest
        .spyOn(concertService, 'getSeats')
        .mockRejectedValue(
          new BusinessException(CONCERT_ERROR_CODES.SEATS_NOT_FOUND),
        );

      await expect(
        reservationFacade.createReservation({
          token: 'valid-token',
          userId: 1,
          concertId: 1,
          performanceDate: new Date(),
          seatNumber: 1,
        }),
      ).rejects.toThrow(CONCERT_ERROR_CODES.SEATS_NOT_FOUND.message);
    });

    it('should throw BusinessException if seat is not available', async () => {
      jest.spyOn(waitingQueueService, 'checkWaitingQueue').mockResolvedValue({
        status: 'PROCESSING' as 'PROCESSING',
        expireAt: new Date(),
        waitingNumber: 0,
        remainingTime: 0,
      });
      jest.spyOn(concertService, 'getSeats').mockResolvedValue([
        {
          seatNumber: 1,
          status: 'RESERVED',
          id: 1,
          price: 100,
          concertId: 1,
          performanceDate: new Date(),
          releaseAt: new Date(),
          concert: null,
        },
      ]);

      await expect(
        reservationFacade.createReservation({
          token: 'valid-token',
          userId: 1,
          concertId: 1,
          performanceDate: new Date(),
          seatNumber: 1,
        }),
      ).rejects.toThrow(COMMON_ERRORS.NOT_FOUND.message);
    });
  });

  describe('createPayment', () => {
    it('should throw BusinessException if reservation is not found', async () => {
      jest.spyOn(waitingQueueService, 'checkWaitingQueue').mockResolvedValue({
        status: 'PROCESSING' as 'PROCESSING',
        expireAt: new Date(),
        waitingNumber: 0,
        remainingTime: 0,
      });
      jest
        .spyOn(reservationRepository, 'findByUserIdWithLock')
        .mockResolvedValue([]);
      jest
        .spyOn(reservationService, 'getReservation')
        .mockRejectedValue(
          new BusinessException(RESERVATION_ERROR_CODES.RESERVATION_NOT_FOUND),
        );
      jest.spyOn(concertService, 'getSeat').mockResolvedValue({
        id: 1,
        price: 100,
        status: 'HOLD' as 'HOLD',
        concertId: 1,
        performanceDate: new Date(),
        releaseAt: new Date(),
        concert: null,
        seatNumber: 1,
      });

      await expect(
        reservationFacade.createPayment('valid-token', 1, 1),
      ).rejects.toThrow(RESERVATION_ERROR_CODES.RESERVATION_NOT_FOUND.message);
    });

    it('should throw BadRequestException if user balance is insufficient', async () => {
      const mockUser = { id: 1, balance: 50, name: 'test', reservations: [] };
      const mockSeat = {
        id: 1,
        price: 100,
        status: 'HOLD' as 'HOLD',
        concertId: 1,
        performanceDate: new Date(),
        releaseAt: new Date(),
        concert: null,
        seatNumber: 1,
      };
      jest.spyOn(waitingQueueService, 'checkWaitingQueue').mockResolvedValue({
        status: 'PROCESSING' as 'PROCESSING',
        expireAt: new Date(),
        waitingNumber: 0,
        remainingTime: 0,
      });
      jest.spyOn(userService, 'findUserById').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(concertService, 'getSeat').mockResolvedValue(mockSeat);
      jest.spyOn(reservationService, 'getReservation').mockResolvedValue([
        {
          id: 1,
          seat: mockSeat,
          user: mockUser,
          createdAt: new Date(),
        },
      ]);
      jest
        .spyOn(userService, 'usePoint')
        .mockRejectedValue(
          new BusinessException(USER_ERROR_CODES.BALANCE_INSUFFICIENT),
        );

      await expect(
        reservationFacade.createPayment('valid-token', 1, 1),
      ).rejects.toThrow(USER_ERROR_CODES.BALANCE_INSUFFICIENT.message);
      expect(userService.usePoint).toHaveBeenCalledWith(1, 100);
    });
  });
});
