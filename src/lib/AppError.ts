export class AppError extends Error {
  public readonly status: number
  public readonly isOperational: boolean

  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.isOperational = true
    this.name = 'AppError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}