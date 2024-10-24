import { Test, TestingModule } from '@nestjs/testing';
import { ReservationService } from './reservation.service';
import {
  IReservationRepository,
  RESERVATION_REPOSITORY,
} from '../model/repository/reservation.repository';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
} from '../model/repository/payment.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Payment } from '../model/entity/payment.entity';
import { Reservation } from '../model/entity/reservation.entity';
import { DataSource } from 'typeorm';
import { RESERVATION_ERROR_CODES } from '../error/reservation.error';

describe('ReservationService', () => {
  let service: ReservationService;
  let reservationRepository: IReservationRepository;
  let paymentRepository: IPaymentRepository;

  const mockReservationRepository = {
    findByIdWithLock: jest.fn(),
    findByUserIdWithLock: jest.fn(),
    createReservation: jest.fn(),
  };

  const mockPaymentRepository = {
    createPaymentWithLock: jest.fn(),
    createPayment: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn((callback) =>
      callback({
        findOne: jest.fn(),
        find: jest.fn(),
        save: jest.fn(),
      }),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        {
          provide: RESERVATION_REPOSITORY,
          useValue: mockReservationRepository,
        },
        {
          provide: PAYMENT_REPOSITORY,
          useValue: mockPaymentRepository,
        },

        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
    reservationRepository = module.get<IReservationRepository>(
      RESERVATION_REPOSITORY,
    );
    paymentRepository = module.get<IPaymentRepository>(PAYMENT_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should throw BusinessException if reservation not found', async () => {
      const reservationId = 1;
      const price = 100;

      jest
        .spyOn(reservationRepository, 'findByIdWithLock')
        .mockResolvedValue(null);

      await expect(service.createPayment(reservationId, price)).rejects.toThrow(
        RESERVATION_ERROR_CODES.RESERVATION_NOT_FOUND.message,
      );
    });

    it('should throw BusinessException if price is less than zero', async () => {
      const reservationId = 1; // 유효한 예약 ID

      // Mock이 예약을 반환하도록 설정
      mockReservationRepository.findByIdWithLock.mockResolvedValueOnce({
        id: reservationId,
        userId: 1,
        seatId: 1,
        createdAt: new Date(),
      });

      const price = -100; // 0 이하의 가격

      await expect(service.createPayment(reservationId, price)).rejects.toThrow(
        RESERVATION_ERROR_CODES.PRICE_INVALID.message,
      );
    });
  });

  describe('getReservation', () => {
    it('should throw BusinessException if no reservations found for user', async () => {
      const userId = 1;

      jest
        .spyOn(reservationRepository, 'findByUserIdWithLock')
        .mockResolvedValue([]);

      await expect(service.getReservation(userId)).rejects.toThrow(
        RESERVATION_ERROR_CODES.RESERVATION_NOT_FOUND.message,
      );
    });

    it('should return reservations successfully', async () => {
      const userId = 1;
      const mockReservations = [
        {
          id: 1,
          userId,
          seatId: 1,
          createdAt: new Date(),
          user: null,
          seat: null,
        },
      ];

      jest
        .spyOn(reservationRepository, 'findByUserIdWithLock')
        .mockResolvedValue(mockReservations);

      const result = await service.getReservation(userId);
      expect(result).toEqual(mockReservations);
      expect(reservationRepository.findByUserIdWithLock).toHaveBeenCalledWith(
        expect.anything(),
        userId,
      );
    });
  });
});
