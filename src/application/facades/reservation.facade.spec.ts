import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConcertService } from '../../domain/concert/service/consert.service';
import { ReservationService } from '../../domain/reservation/service/reservation.service';
import { UserService } from '../../domain/user/services/user.service';
import { WaitingQueueService } from '../../domain/waiting-queue/services/waiting-queue.service';
import { ReservationFacade } from './reservation.facade';

describe('ReservationFacade', () => {
  let reservationFacade: ReservationFacade;
  let reservationService: ReservationService;
  let userService: UserService;
  let concertService: ConcertService;
  let waitingQueueService: WaitingQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationFacade,
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
  });

  describe('createReservation', () => {
    it('should throw BadRequestException if seat is not found', async () => {
      jest.spyOn(concertService, 'getSeats').mockResolvedValue([]);

      await expect(
        reservationFacade.createReservation({
          token: 'valid-token',
          userId: 1,
          concertId: 1,
          performanceDate: new Date(),
          seatNumber: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if seat is not available', async () => {
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
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createPayment', () => {
    it('should throw NotFoundException if reservation is not found', async () => {
      jest.spyOn(reservationService, 'getReservation').mockResolvedValue([]);

      await expect(
        reservationFacade.createPayment('valid-token', 1, 1),
      ).rejects.toThrow(BadRequestException);
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

      jest.spyOn(userService, 'findUserById').mockResolvedValue(mockUser);
      jest.spyOn(concertService, 'getSeat').mockResolvedValue(mockSeat);
      jest
        .spyOn(reservationService, 'getReservation')
        .mockResolvedValue([
          { id: 1, seat: mockSeat, user: mockUser, createdAt: new Date() },
        ]);

      await expect(
        reservationFacade.createPayment('valid-token', 1, 1),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
