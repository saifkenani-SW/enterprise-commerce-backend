import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmailDto } from './email.dto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    // حقن الكائن الجاهز هنا
    @Inject('EMAIL_TRANSPORTER') private transporter: nodemailer.Transporter,

  ) {}

  async sendEmailWithQueue(dto: EmailDto) {
    const job = await this.emailQueue.add('send-email', dto, {
      attempts: 3,
      delay: 2000,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
    });
    this.logger.log(`Job added to queue: ${job.id}`);
    return job;
  }

  async sendEmailWithoutQueue(dto: EmailDto) {
    const { to, subject, body } = dto;
    const maxAttempts = 3;
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.logger.log(`Attempt ${attempt} to send direct email...`);
        await this.transporter.sendMail({
          from: '"Enterprise App" <no-reply@enterprise.com>',
          to,
          subject,
          text: body,
        });
        this.logger.log(`Direct email sent successfully to: ${to}`);
        return 'Email sent successfully.';
      } catch (error) {
        this.logger.error(`Attempt ${attempt} failed`, error.stack);
        if (attempt === maxAttempts) throw new Error('Failed to send email');
        await delay(2000 * attempt);
      }
    }
  }
}
