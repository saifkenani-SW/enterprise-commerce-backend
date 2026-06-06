import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EmailService {
  constructor(
    @InjectQueue('email')
    private readonly queue: Queue,
  ) {}

  async sendEmail() {
    await this.queue.add(
      'send-email',
      {
        email: 'test@test.comhught',
      },
      {
        priority: 1,
        delay: 1000,
        attempts: 3,
      },
    );
    await this.queue.add(
      'send-email',
      {
        email: 'test@test.comLOW',
      },
      {
        priority: 10,
        delay: 1000,
        attempts: 3,
      },
    );
  }
}
