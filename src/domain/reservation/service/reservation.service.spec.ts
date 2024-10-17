import { Test, TestingModule } from '@nestjs/testing';
import { ReservationService } from '../service/reservation.service';
import {
  RESERVATION_REPOSITORY,
  IReservationRepository,
} from '../model/repository/reservation.repository';
import {
  PAYMENT_REPOSITORY,
  IPaymentRepository,
} from '../model/repository/payment.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import dayjs from 'dayjs';

describe('ReservationService', () => {
  let service: ReservationService;
  let reservationRepository: IReservationRepository;
  let paymentRepository: IPaymentRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        {
          provide: RESERVATION_REPOSITORY,
          useValue: {
            findByUserId: jest.fn(),
            createReservation: jest.fn(),
            findById: jest.fn(),
            deleteReservation: jest.fn(),
          },
        },
        {
          provide: PAYMENT_REPOSITORY,
          useValue: {
            createPayment: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
    reservationRepository = module.get<IReservationRepository>(
      RESERVATION_REPOSITORY,
    );
    paymentRepository = module.get<IPaymentRepository>(PAYMENT_REPOSITORY);
  });

  describe('getReservation', () => {
    it('should throw NotFoundException if no reservations are found', async () => {
      jest.spyOn(reservationRepository, 'findByUserId').mockResolvedValue([]);
      await expect(service.getReservation(1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return reservations if found', async () => {
      const reservations = [
        { id: 1, createdAt: new Date(), user: null, seat: null },
      ];
      jest
        .spyOn(reservationRepository, 'findByUserId')
        .mockResolvedValue(reservations);
      expect(await service.getReservation(1)).toEqual(reservations);
    });
  });

  describe('createReservation', () => {
    it('should create a reservation successfully', async () => {
      const reservation = {
        id: 1,
        createdAt: new Date(),
        user: null,
        seat: null,
      };
      jest
        .spyOn(reservationRepository, 'createReservation')
        .mockResolvedValue(reservation);

      const result = await service.createReservation(1, 1);
      expect(result).toEqual(reservation);
    });
  });

  describe('createPayment', () => {
    it('should throw NotFoundException if reservation is not found', async () => {
      jest.spyOn(reservationRepository, 'findById').mockResolvedValue(null);
      await expect(service.createPayment(1, 100)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if price is zero or negative', async () => {
      jest.spyOn(reservationRepository, 'findById').mockResolvedValue({
        id: 1,
        user: null,
        seat: null,
        createdAt: new Date(),
      });
      await expect(service.createPayment(1, 0)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createPayment(1, -10)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create a payment successfully', async () => {
      const payment = {
        id: 1,
        price: 100,
        createdAt: new Date(),
        reservation: null,
      };
      jest.spyOn(reservationRepository, 'findById').mockResolvedValue({
        id: 1,
        user: null,
        seat: null,
        createdAt: new Date(),
      });
      jest.spyOn(paymentRepository, 'createPayment').mockResolvedValue(payment);

      const result = await service.createPayment(1, 100);
      expect(result).toEqual(payment);
    });
  });
});
