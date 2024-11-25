import { Test, TestingModule } from '@nestjs/testing';
import { ReservationFacade } from './reservation.facade';
import { WaitingQueueService } from '../../../domain/waiting-queue/services/waiting-queue.service';
import { UserService } from '../../../domain/user/services/user.service';
import { ConcertService } from '../../../domain/concert/service/consert.service';
import { ReservationService } from '../../../domain/reservation/service/reservation.service';
import { EntityManager } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { BusinessException } from '../../../common/exception/business-exception';
import { USER_ERROR_CODES } from '../../../domain/user/error/user.error';
import { CONCERT_ERROR_CODES } from '../../../domain/concert/error/concert.error';
import { PaymentOutboxStatus } from '../../../domain/reservation/model/entity/payment.outbox.entity';

describe('ReservationFacade', () => {
  let facade: ReservationFacade;
  let concertService: ConcertService;
  let reservationService: ReservationService;
  let userService: UserService;
  let waitingQueueService: WaitingQueueService;
  let entityManager: EntityManager;
  let kafkaClient: ClientKafka;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationFacade,
        {
          provide: ConcertService,
          useValue: {
            checkAndUpdateSeatStatus: jest.fn(),
            checkSeatStatusBySeatId: jest.fn(),
            updateSeat: jest.fn(),
          },
        },
        {
          provide: ReservationService,
          useValue: {
            createReservation: jest.fn(),
            getReservationByUserIdAndSeatId: jest.fn(),
            createPaymentOutbox: jest.fn(),
            updatePaymentOutboxStatus: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            usePoint: jest.fn(),
            chargePoint: jest.fn(),
          },
        },
        {
          provide: WaitingQueueService,
          useValue: {
            expireToken: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: {
            transaction: jest.fn().mockImplementation(async (callback) => {
              const managerMock = {}; // Transactional EntityManager mock
              await callback(managerMock);
            }),
          },
        },
        {
          provide: 'KAFKA_CLIENT',
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    facade = module.get<ReservationFacade>(ReservationFacade);
    concertService = module.get<ConcertService>(ConcertService);
    reservationService = module.get<ReservationService>(ReservationService);
    userService = module.get<UserService>(UserService);
    waitingQueueService = module.get<WaitingQueueService>(WaitingQueueService);
    entityManager = module.get<EntityManager>(EntityManager);
    kafkaClient = module.get<ClientKafka>('KAFKA_CLIENT');
  });

  describe('createReservation', () => {
    it('should create a reservation successfully', async () => {
      jest.spyOn(concertService, 'checkAndUpdateSeatStatus').mockResolvedValue({
        id: 1,
        concertId: 1,
        seatNumber: 1,
        performanceDate: new Date(),
        status: 'AVAILABLE' as 'AVAILABLE',
        price: 100,
        releaseAt: null,
        concert: undefined,
      });
      jest.spyOn(reservationService, 'createReservation').mockResolvedValue({
        id: 1,
        createdAt: new Date(),
        user: undefined,
        seat: undefined,
      });

      const result = await facade.createReservation({
        userId: 1,
        concertId: 1,
        performanceDate: new Date(),
        seatNumber: 1,
      });

      expect(result).toBeDefined();
      expect(concertService.checkAndUpdateSeatStatus).toHaveBeenCalledWith(
        1,
        expect.any(Date),
        1,
        'AVAILABLE',
      );
      expect(reservationService.createReservation).toHaveBeenCalled();
    });

    it('should throw an error if seat is not available', async () => {
      jest
        .spyOn(concertService, 'checkAndUpdateSeatStatus')
        .mockRejectedValue(
          new BusinessException(CONCERT_ERROR_CODES.SEATS_NOT_FOUND),
        );

      await expect(
        facade.createReservation({
          userId: 1,
          concertId: 1,
          performanceDate: new Date(),
          seatNumber: 1,
        }),
      ).rejects.toThrow(CONCERT_ERROR_CODES.SEATS_NOT_FOUND.message);
    });
  });

  describe('createPayment', () => {
    it('should complete payment successfully', async () => {
      jest.spyOn(concertService, 'checkSeatStatusBySeatId').mockResolvedValue({
        id: 1,
        concertId: 1,
        seatNumber: 1,
        performanceDate: new Date(),
        status: 'AVAILABLE' as 'AVAILABLE',
        price: 100,
        releaseAt: null,
        concert: undefined,
      });
      jest.spyOn(concertService, 'updateSeat').mockResolvedValue({
        id: 1,
        concertId: 1,
        seatNumber: 1,
        performanceDate: new Date(),
        status: 'HOLD' as 'HOLD',
        price: 100,
        releaseAt: null,
        concert: undefined,
      });
      jest
        .spyOn(reservationService, 'getReservationByUserIdAndSeatId')
        .mockResolvedValue({
          id: 1,
          user: undefined,
          seat: undefined,
          createdAt: new Date(),
        });
      jest.spyOn(userService, 'usePoint').mockResolvedValue({
        balance: 0,
      });
      jest.spyOn(reservationService, 'createPaymentOutbox').mockResolvedValue({
        id: 1,
        metadata: undefined,
        status: PaymentOutboxStatus.INIT,
        createdAt: new Date(),
      });
      jest.spyOn(kafkaClient, 'emit').mockReturnValue({
        pipe: jest.fn(),
      } as any);

      await facade.createPayment('valid-token', 1, 1);

      expect(concertService.checkSeatStatusBySeatId).toHaveBeenCalled();
      expect(concertService.updateSeat).toHaveBeenCalled();
      expect(userService.usePoint).toHaveBeenCalledWith(
        1,
        100,
        expect.anything(),
      );
      expect(kafkaClient.emit).toHaveBeenCalledWith(
        'payment',
        expect.objectContaining({
          key: expect.stringContaining('payment_reservation_'),
        }),
      );
    });

    it('should handle insufficient balance', async () => {
      jest.spyOn(concertService, 'checkSeatStatusBySeatId').mockResolvedValue({
        id: 1,
        concertId: 1,
        seatNumber: 1,
        performanceDate: new Date(),
        status: 'AVAILABLE' as 'AVAILABLE',
        price: 100,
        releaseAt: null,
        concert: undefined,
      });
      jest
        .spyOn(userService, 'usePoint')
        .mockRejectedValue(
          new BusinessException(USER_ERROR_CODES.BALANCE_INSUFFICIENT),
        );

      await expect(facade.createPayment('valid-token', 1, 1)).rejects.toThrow(
        USER_ERROR_CODES.BALANCE_INSUFFICIENT.message,
      );

      expect(userService.usePoint).toHaveBeenCalledWith(
        1,
        100,
        expect.anything(),
      );
    });
  });
});
