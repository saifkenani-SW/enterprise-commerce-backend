import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { Queue } from 'bullmq';

import { QUEUES } from '../constants/queues';

@Injectable()
export class DeadLetterService {
  constructor(
    @InjectQueue(QUEUES.DEAD_LETTER)
    private readonly dlq: Queue,
  ) {}

  async add(payload: unknown): Promise<void> {
    await this.dlq.add('dead-letter', payload);
  }
}
