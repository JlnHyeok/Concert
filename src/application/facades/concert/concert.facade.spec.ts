import { Test, TestingModule } from '@nestjs/testing';
import { ConcertFacade } from './concert.facade';
import { ConcertService } from '../../../domain/concert/service/consert.service';
import { NotFoundException } from '@nestjs/common';

describe('ConcertFacade', () => {
  let concertFacade: ConcertFacade;
  let concertService: ConcertService;
  let performanceDate = new Date('2024-11-01');

  const mockConcertService = {
    getAvailableDates: jest.fn(),
    getSeats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConcertFacade,
        { provide: ConcertService, useValue: mockConcertService },
      ],
    }).compile();

    concertFacade = module.get<ConcertFacade>(ConcertFacade);
    concertService = module.get<ConcertService>(ConcertService);
  });

  it('should be defined', () => {
    expect(concertFacade).toBeDefined();
  });

  describe('getAvailableDates', () => {
    it('should return available dates for the given concertId', async () => {
      const mockDates = [{ date: performanceDate }];
      mockConcertService.getAvailableDates.mockResolvedValue(mockDates);

      const result = await concertFacade.getAvailableDates(1);

      expect(concertService.getAvailableDates).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDates);
    });

    it('should throw NotFoundException if no dates are found', async () => {
      mockConcertService.getAvailableDates.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(concertFacade.getAvailableDates(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSeats', () => {
    it('should return seats for the given concertId and performanceDate', async () => {
      const mockSeats = [
        {
          id: 1,
          concertId: 1,
          performanceDate: performanceDate,
          price: 10000,
          seatNumber: 1,
          status: 'AVAILABLE',
          releaseAt: null,
        },
      ];
      mockConcertService.getSeats.mockResolvedValue(mockSeats);

      const result = await concertFacade.getSeats(1, performanceDate);

      expect(concertService.getSeats).toHaveBeenCalledWith(1, performanceDate);
      expect(result).toEqual(mockSeats);
    });

    it('should throw NotFoundException if no seats are found', async () => {
      mockConcertService.getSeats.mockRejectedValue(new NotFoundException());

      await expect(concertFacade.getSeats(1, performanceDate)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
