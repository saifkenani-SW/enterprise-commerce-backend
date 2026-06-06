import { JobsOptions } from 'bullmq';

export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,

  backoff: {
    type: 'exponential',
    delay: 3000,
  },

  removeOnComplete: 1000,

  removeOnFail: 5000,
};
