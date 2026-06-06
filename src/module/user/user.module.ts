import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { BullModule } from '@nestjs/bullmq';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { EmailService } from './co';
import { EmailProcessor } from './pro';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),

    BullModule.registerQueue({
      name: 'email',
    }),
    BullBoardModule.forFeature({
      name: 'email',
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [UserController],
  providers: [UserService, EmailService, EmailProcessor],
})
export class UserModule {}
