import { Module } from '@nestjs/common';

import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { QUEUES } from '../constants/queues';

@Module({
  imports: [
    BullBoardModule.forRoot({
      route: '/admin/queues',

      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: QUEUES.DEAD_LETTER,
      adapter: BullMQAdapter,
    }),
  ],
  exports: [BullBoardModule],
})
export class QueueDashboardModule {}
