import { Inject } from '@nestjs/common';
import { WaitingQueueService } from '../../../domain/waiting-queue/services/waiting-queue.service';

export class WaitingQueueFacade {
  constructor(
    @Inject(WaitingQueueService)
    private readonly waitingQueueService: WaitingQueueService,
  ) {}

  async checkWaitingQueue(token: string) {
    return await this.waitingQueueService.checkWaitingQueue(token);
  }

  async issueToken() {
    return await this.waitingQueueService.generateToken();
  }

  // ONLY FOR TESTING
  async deleteAll() {
    return await this.waitingQueueService.deleteAll();
  }

  // ONLY FOR TESTING
  async getSize() {
    return await this.waitingQueueService.getSizeOfProcessingStatus();
  }
}
