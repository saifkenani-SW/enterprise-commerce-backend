import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';

type EmailJob = {
  to: string;
  subject: string;
  body: string;
};

@Processor('email', { concurrency: 3 })
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    // حقن نفس الكائن الجاهز هنا أيضاً
    @Inject('EMAIL_TRANSPORTER') private transporter: nodemailer.Transporter,
  ) {
    super();
  }

  async process(job: Job<EmailJob>): Promise<void> {
    this.logger.log(`PROCESSOR STARTED: ${job.name} - Job ID: ${job.id}`);
    const { to, subject, body } = job.data;

    try {
      await this.transporter.sendMail({
        from: '"Enterprise App" <no-reply@enterprise.com>',
        to,
        subject,
        text: body,
      });
      this.logger.log(`Email sent from processor to: ${to}`);
    } catch (error) {
      this.logger.error(`Processor failed to send email to ${to}`, error.stack);
      throw error;
    }
  }
}
