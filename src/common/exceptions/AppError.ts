export class AppError extends Error {
  public readonly statusCode: number;
  public readonly message: string;
  public readonly errorCode?: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode?: string,
    details?: any,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.errorCode = errorCode;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
