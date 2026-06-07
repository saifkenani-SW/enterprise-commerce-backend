import { LockException } from './lock.exception';

export class LockAlreadyAcquiredException extends LockException {
  constructor(key: string) {
    super(`Lock already acquired for key: ${key}`);
  }
}
