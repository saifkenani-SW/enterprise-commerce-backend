import { DynamicModule, Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueDashboardModule } from './dashboard/bull-board.module';
import { QUEUES } from './constants/queues';

@Global()
@Module({})
export class BullMqModule {
  static forRootAsync(): DynamicModule {
    return {
      module: BullMqModule,

      imports: [
        BullModule.forRootAsync({
          imports: [ConfigModule],

          inject: [ConfigService],

          useFactory: (configService: ConfigService) => ({
            connection: {
              host: configService.get<string>('REDIS_HOST', 'localhost'),

              port: configService.get<number>('REDIS_PORT', 6379),

              password: configService.get<string>('REDIS_PASSWORD', ''),

              db: configService.get<number>('REDIS_QUEUE_DB', 1),
            },
          }),
        }),
        BullModule.registerQueue({
          name: QUEUES.DEAD_LETTER,
        }),
        QueueDashboardModule,
      ],

      exports: [BullModule],
    };
  }
}
