import { Test, TestingModule } from '@nestjs/testing';
import {
  IConcertRepository,
  CONCERT_REPOSITORY,
} from '../model/repository/concert.repository';
import {
  ISeatRepository,
  SEAT_REPOSITORY,
} from '../model/repository/seat.repository';
import {
  IPerformanceDateRepository,
  PERFORMANCE_DATE_REPOSITORY,
} from '../model/repository/performance-date.repository';
import { Seat } from '../model/entity/seat.entity';
import { PerformanceDate } from '../model/entity/performance-date.entity';
import { NotFoundException } from '@nestjs/common';
import { ConcertService } from './consert.service';

describe('ConcertService', () => {
  let service: ConcertService;
  let concertRepository: IConcertRepository;
  let seatRepository: ISeatRepository;
  let performanceDateRepository: IPerformanceDateRepository;

  const mockSeat: Seat = {
    id: 1,
    concertId: 1,
    performanceDate: new Date(),
    seatNumber: 1,
    status: 'AVAILABLE',
    releaseAt: new Date(),
    price: 100,
    concert: null,
  };

  const mockPerformanceDate: PerformanceDate = {
    id: 1,
    concertId: 1,
    performanceDate: new Date('2024-10-18'),
    concert: null,
    seats: [],
  };

  const mockConcertRepository = {
    findAll: jest.fn().mockResolvedValue([]),
    createConcert: jest.fn().mockResolvedValue(null),
    deleteConcert: jest.fn().mockResolvedValue(null),
  };

  const mockSeatRepository = {
    findById: jest.fn(),
    findByConcertAndDate: jest.fn(),
    findAll: jest.fn().mockResolvedValue([mockSeat]),
    updateSeat: jest.fn(),
  };

  const mockPerformanceDateRepository = {
    findByConcertId: jest.fn(),
    createPerformanceDate: jest.fn().mockResolvedValue(null),
    updatePerformanceDate: jest.fn().mockResolvedValue(mockPerformanceDate),
    deletePerformanceDate: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConcertService,
        {
          provide: CONCERT_REPOSITORY,
          useValue: mockConcertRepository,
        },
        {
          provide: SEAT_REPOSITORY,
          useValue: mockSeatRepository,
        },
        {
          provide: PERFORMANCE_DATE_REPOSITORY,
          useValue: mockPerformanceDateRepository,
        },
      ],
    }).compile();

    service = module.get<ConcertService>(ConcertService);
    concertRepository = module.get<IConcertRepository>(CONCERT_REPOSITORY);
    seatRepository = module.get<ISeatRepository>(SEAT_REPOSITORY);
    performanceDateRepository = module.get<IPerformanceDateRepository>(
      PERFORMANCE_DATE_REPOSITORY,
    );

    jest.mock('dayjs', () => {
      return jest.fn(() => ({
        toDate: jest.fn().mockReturnValue(new Date('2024-10-18')),
      }));
    });
  });

  describe('getSeat', () => {
    it('should return a seat by id', async () => {
      jest.spyOn(seatRepository, 'findById').mockResolvedValue(mockSeat);

      const seat = await service.getSeat(1);
      expect(seat).toEqual(mockSeat);
      expect(seatRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if seat not found', async () => {
      jest.spyOn(seatRepository, 'findById').mockResolvedValue(null);

      await expect(service.getSeat(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSeats', () => {
    it('should return seats by concertId and performanceDate', async () => {
      jest
        .spyOn(seatRepository, 'findByConcertAndDate')
        .mockResolvedValue([mockSeat]);

      const seats = await service.getSeats(1, '2024-10-18');
      expect(seats).toEqual([mockSeat]);
      expect(seatRepository.findByConcertAndDate).toHaveBeenCalledWith(
        1,
        expect.any(Date),
      );
    });

    it('should throw NotFoundException if no seats found', async () => {
      jest.spyOn(seatRepository, 'findByConcertAndDate').mockResolvedValue([]);

      await expect(service.getSeats(1, '2024-10-18')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAvailableDates', () => {
    it('should return performance dates by concertId', async () => {
      jest
        .spyOn(performanceDateRepository, 'findByConcertId')
        .mockResolvedValue([mockPerformanceDate]);

      const dates = await service.getAvailableDates(1);
      expect(dates).toEqual([mockPerformanceDate]);
      expect(performanceDateRepository.findByConcertId).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if no available dates found', async () => {
      jest
        .spyOn(performanceDateRepository, 'findByConcertId')
        .mockResolvedValue([]);

      await expect(service.getAvailableDates(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateSeat', () => {
    it('should update a seat', async () => {
      jest.spyOn(seatRepository, 'updateSeat').mockResolvedValue(mockSeat);

      const updatedSeat = await service.updateSeat(1, mockSeat);
      expect(updatedSeat).toEqual(mockSeat);
      expect(seatRepository.updateSeat).toHaveBeenCalledWith(1, mockSeat);
    });

    it('should throw NotFoundException if seat not found for update', async () => {
      jest.spyOn(seatRepository, 'updateSeat').mockResolvedValue(null);

      await expect(service.updateSeat(999, mockSeat)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
