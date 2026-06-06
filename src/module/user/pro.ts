import { Job } from 'bullmq';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';

@Processor('email', {
  concurrency: 10,
})
export class EmailProcessor extends WorkerHost {
  async process(job: Job) {
    await new Promise((r) => setTimeout(r, 1000));
    throw new Error('test error');
    console.log('START', job.id);

    // throw new Error('test error');
    await new Promise((r) => setTimeout(r, 5000));

    console.log('END', job.id);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log('COMPLETED', job.id);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    console.log('FAILED', job.id, error.message);
    console.log('FAILED', job.attemptsMade, job.opts.attempts, error.message);
  }
}
