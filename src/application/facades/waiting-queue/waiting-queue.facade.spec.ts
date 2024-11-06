import { WaitingQueueFacade } from './waiting-queue.facade';
import { WaitingQueueService } from '../../../domain/waiting-queue/services/waiting-queue.service';
import { BusinessException } from '../../../common/exception/business-exception';
import { WAITING_QUEUE_ERROR_CODES } from '../../../domain/waiting-queue/error/waiting-queue.error';

describe('WaitingQueueFacade', () => {
  let facade: WaitingQueueFacade;
  let service: Partial<WaitingQueueService>;

  beforeEach(async () => {
    service = {
      checkWaitingQueue: jest.fn(),
      expireToken: jest.fn(),
      generateToken: jest.fn(),
      updateTokenStatus: jest.fn(),
    };
    facade = new WaitingQueueFacade(service as WaitingQueueService);
  });

  it('should call checkWaitingQueue from service', async () => {
    const token = 'test-token';
    jest.spyOn(service, 'checkWaitingQueue').mockResolvedValue({
      waitingNumber: 1,
      remainingTime: 10,
      status: 'WAITING',
    });

    const result = await facade.checkWaitingQueue(token);

    expect(service.checkWaitingQueue).toHaveBeenCalledWith(token);
    expect(result).toEqual({
      waitingNumber: 1,
      remainingTime: 10,
      status: 'WAITING',
    });
  });

  it('should throw BusinessException if token is invalid', async () => {
    const token = 'invalid-token';
    jest
      .spyOn(service, 'checkWaitingQueue')
      .mockRejectedValue(
        new BusinessException(WAITING_QUEUE_ERROR_CODES.TOKEN_INVALID),
      );

    await expect(facade.checkWaitingQueue(token)).rejects.toThrow(
      BusinessException,
    );
  });

  it('should call issueToken from service', async () => {
    jest.spyOn(service, 'generateToken').mockResolvedValue('new-token');

    const result = await facade.issueToken();

    expect(service.generateToken).toHaveBeenCalled();
    expect(result).toBe('new-token');
  });
});
