import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';
import { EmailController } from './email.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  controllers: [EmailController],
  providers: [
    EmailService,
    EmailProcessor,
    // إنشاء مزود مخصص للـ Transporter
    {
      provide: 'EMAIL_TRANSPORTER',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return nodemailer.createTransport({
          host: configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
          port: parseInt(configService.get<string>('SMTP_PORT', '587'), 10),
          secure: configService.get<string>('SMTP_SECURE') === 'true',
          auth: {
            user: configService.getOrThrow<string>('SMTP_USER'),
            pass: configService.getOrThrow<string>('SMTP_PASS'),
          },
        });
      },
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
