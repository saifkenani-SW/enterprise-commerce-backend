export class LockTimeoutException extends Error {
  constructor(key: string) {
    super(`Lock timeout for key: ${key}`);

    this.name = 'LockTimeoutException';
  }
}
