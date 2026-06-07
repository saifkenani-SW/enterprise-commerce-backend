import { Injectable, Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationService } from '../module/notification/notification.service';

@Injectable()
@Processor('notifications')
export class NotificationWorker extends WorkerHost {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(private notificationService: NotificationService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`📨 Processing job: ${job.name} #${job.id}`);

    switch (job.name) {
      case 'send-batch':
        return this.notificationService.sendBatchNotifications(
          job.data.title,
          job.data.message,
        );

      case 'send-product':
        return this.notificationService.notifyUsersWhoBoughtProduct(
          job.data.productId,
          job.data.title,
          job.data.message,
        );

      default:
        throw new Error(`Unknown job: ${job.name}`);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`✅ Job #${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`❌ Job #${job.id} failed: ${error.message}`);
  }
}
