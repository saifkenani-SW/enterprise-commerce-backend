import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';

import { QUEUES } from '../constants/queues';

@Processor(QUEUES.DEAD_LETTER)
export class DeadLetterProcessor extends WorkerHost {
  async process(job: Job) {
    console.error('DLQ JOB', job.id);

    console.error(job.data);
  }
}
