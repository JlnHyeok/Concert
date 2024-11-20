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
import { DataSource } from 'typeorm';
import { RESERVATION_ERROR_CODES } from '../error/reservation.error';
import {
  IPaymentOutboxRepository,
  PAYMENT_OUTBOX_REPOSITORY,
} from '../model/repository/payment.outbox.repository';
import {
  IPaymentOutboxMetadata,
  PaymentOutboxStatus,
} from '../model/entity/payment.outbox.entity';

describe('ReservationService', () => {
  let service: ReservationService;
  let reservationRepository: IReservationRepository;
  let paymentRepository: IPaymentRepository;
  let paymentOutboxRepository: IPaymentOutboxRepository;

  const mockReservationRepository = {
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findByIdWithLock: jest.fn(),
    findByUserIdWithLock: jest.fn(),
    createReservation: jest.fn(),
    deleteReservation: jest.fn(),
    findBySeatId: jest.fn(),
    findByUserIdAndSeatId: jest.fn(),
    deleteBySeatId: jest.fn(),
  };

  const mockPaymentRepository = {
    createPaymentWithLock: jest.fn(),
    createPayment: jest.fn(),
  };

  const mockPaymentOutboxRepository = {
    createPaymentOutbox: jest.fn(),
    updatePaymentOutbox: jest.fn(),
    getAllPaymentOutboxByStatus: jest.fn(),
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
        {
          provide: PAYMENT_OUTBOX_REPOSITORY,
          useValue: mockPaymentOutboxRepository,
        },

        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
    reservationRepository = module.get<IReservationRepository>(
      RESERVATION_REPOSITORY,
    );
    paymentRepository = module.get<IPaymentRepository>(PAYMENT_REPOSITORY);
    paymentOutboxRepository = module.get<IPaymentOutboxRepository>(
      PAYMENT_OUTBOX_REPOSITORY,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ReservationService - Additional Tests', () => {
    describe('getReservationByUserIdAndSeatId', () => {
      it('should return reservation if found', async () => {
        const userId = 1;
        const seatId = 101;
        const mockReservation = {
          id: 1,
          userId,
          seatId,
          createdAt: new Date(),
          user: undefined,
          seat: undefined,
        };

        jest
          .spyOn(reservationRepository, 'findByUserIdAndSeatId')
          .mockResolvedValue(mockReservation);

        const result = await service.getReservationByUserIdAndSeatId(
          userId,
          seatId,
        );
        expect(result).toEqual(mockReservation);
        expect(
          reservationRepository.findByUserIdAndSeatId,
        ).toHaveBeenCalledWith(userId, seatId, undefined);
      });

      it('should throw BusinessException if reservation not found', async () => {
        const userId = 1;
        const seatId = 101;

        jest
          .spyOn(reservationRepository, 'findByUserIdAndSeatId')
          .mockResolvedValue(null);

        await expect(
          service.getReservationByUserIdAndSeatId(userId, seatId),
        ).rejects.toThrow(
          RESERVATION_ERROR_CODES.RESERVATION_NOT_FOUND.message,
        );
      });
    });

    describe('createReservation', () => {
      it('should create a reservation if seat is not reserved', async () => {
        const userId = 1;
        const seat = { id: 101, price: 100 };
        const mockReservation = {
          id: 1,
          userId,
          seatId: seat.id,
          createdAt: new Date(),
          user: undefined,
          seat: undefined,
        };

        jest.spyOn(reservationRepository, 'findBySeatId').mockResolvedValue([]);
        jest
          .spyOn(reservationRepository, 'createReservation')
          .mockResolvedValue(mockReservation);

        const result = await service.createReservation(userId, seat);
        expect(result).toEqual(mockReservation);
        expect(reservationRepository.findBySeatId).toHaveBeenCalledWith(
          seat.id,
        );
        expect(reservationRepository.createReservation).toHaveBeenCalledWith(
          userId,
          seat.id,
          expect.any(Date),
        );
      });

      it('should throw BusinessException if seat is already reserved', async () => {
        const userId = 1;
        const seat = { id: 101, price: 100 };
        const existingReservations = [
          {
            id: 1,
            userId: 2,
            seatId: 101,
            createdAt: new Date(),
            user: undefined,
            seat: undefined,
          },
        ];

        jest
          .spyOn(reservationRepository, 'findBySeatId')
          .mockResolvedValue(existingReservations);

        await expect(service.createReservation(userId, seat)).rejects.toThrow(
          RESERVATION_ERROR_CODES.SEAT_ALREADY_RESERVED.message,
        );
      });
    });

    describe('createPayment', () => {
      it('should create payment if reservation exists and price is valid', async () => {
        const reservationId = 1;
        const price = 100;
        const mockReservation = {
          id: reservationId,
          userId: 1,
          seatId: 101,
          createdAt: new Date(),
          user: undefined,
          seat: undefined,
        };
        const mockPayment = {
          id: 1,
          reservationId,
          price,
          createdAt: new Date(),
          reservation: undefined,
        };

        jest
          .spyOn(reservationRepository, 'findById')
          .mockResolvedValue(mockReservation);
        jest
          .spyOn(paymentRepository, 'createPayment')
          .mockResolvedValue(mockPayment);

        const result = await service.createPayment(reservationId, price);
        expect(result).toEqual(mockPayment);
        expect(reservationRepository.findById).toHaveBeenCalledWith(
          reservationId,
          undefined,
        );
        expect(paymentRepository.createPayment).toHaveBeenCalledWith(
          reservationId,
          price,
          expect.any(Date),
          undefined,
        );
      });

      it('should throw BusinessException if price is negative', async () => {
        const reservationId = 1;
        const price = -50;

        await expect(
          service.createPayment(reservationId, price),
        ).rejects.toThrow(RESERVATION_ERROR_CODES.PRICE_INVALID.message);
      });

      it('should throw BusinessException if reservation does not exist', async () => {
        const reservationId = 1;
        const price = 100;

        jest.spyOn(reservationRepository, 'findById').mockResolvedValue(null);

        await expect(
          service.createPayment(reservationId, price),
        ).rejects.toThrow(
          RESERVATION_ERROR_CODES.RESERVATION_NOT_FOUND.message,
        );
      });
    });

    describe('deleteReservation', () => {
      it('should delete reservation successfully', async () => {
        const reservationId = 1;

        jest
          .spyOn(reservationRepository, 'deleteReservation')
          .mockResolvedValue(undefined);

        await expect(
          service.deleteReservation(reservationId),
        ).resolves.toBeUndefined();
        expect(reservationRepository.deleteReservation).toHaveBeenCalledWith(
          reservationId,
          undefined,
        );
      });

      it('should handle error if reservation deletion fails', async () => {
        const reservationId = 1;

        jest
          .spyOn(reservationRepository, 'deleteReservation')
          .mockRejectedValue(new Error('Database error'));

        await expect(service.deleteReservation(reservationId)).rejects.toThrow(
          'Database error',
        );
      });
    });

    describe('createPaymentOutbox', () => {
      it('should create payment outbox successfully', async () => {
        const metadata: IPaymentOutboxMetadata = {
          userId: 1,
          token: 'token',
          seatId: 1,
          reservationId: 1,
          price: 100,
        };

        const mockPaymentOutbox = {
          id: 1,
          status: PaymentOutboxStatus.INIT,
          createdAt: new Date(),
          metadata,
        };

        jest
          .spyOn(paymentOutboxRepository, 'createPaymentOutbox')
          .mockResolvedValue(mockPaymentOutbox);

        const result = await service.createPaymentOutbox(metadata);
        expect(result).toEqual(mockPaymentOutbox);
        expect(
          paymentOutboxRepository.createPaymentOutbox,
        ).toHaveBeenCalledWith(metadata, undefined);
      });

      it('should handle error if payment outbox creation fails', async () => {
        const metadata: IPaymentOutboxMetadata = {
          userId: 1,
          token: 'token',
          seatId: 1,
          reservationId: 1,
          price: 100,
        };

        jest
          .spyOn(paymentOutboxRepository, 'createPaymentOutbox')
          .mockRejectedValue(new Error('Database error'));

        await expect(service.createPaymentOutbox(metadata)).rejects.toThrow(
          'Database error',
        );
      });
    });
  });
});
