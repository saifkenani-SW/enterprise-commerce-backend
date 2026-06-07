import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailDto } from './email.dto';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send-with-queue')
  async sendWithQueue(@Body() dto: EmailDto) {
    const job = await this.emailService.sendEmailWithQueue(dto);
    return { message: 'Email job added to queue successfully.', jobId: job.id };
  }

  @Post('send-without-queue')
  async sendWithoutQueue(@Body() dto: EmailDto) {
    const result = await this.emailService.sendEmailWithoutQueue(dto);
    return { message: result };
  }
}
