export class Result<T> {
  constructor(
    public readonly success: boolean,
    public readonly error?: string,
    public readonly value?: T,
  ) {}

  static ok<T>(value?: T): Result<T> {
    return new Result(true, undefined, value);
  }

  static fail<T>(error: string): Result<T> {
    return new Result(false, error);
  }
}
