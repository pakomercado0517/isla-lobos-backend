import { type Request, type Response, type NextFunction } from "express";
import { AppError } from "../lib/AppError";
import { serverLogger } from "../utils/logger";

interface ErrorResponseBody {
  status: "error"
  error: string
  message: string
  stack?: string
}

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  const isAppError = err instanceof AppError
  const statusCode = isAppError ? err.status : 500
  const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado en el servidor'

  if(!isAppError) serverLogger.error(`Error inesperado: ${err}`)

  const body: ErrorResponseBody = {
    status: "error",
    error: message,
    message
  }

  if(process.env["NODE_ENV"] === "development" && err instanceof Error && err.stack) body.stack = err.stack

  res.status(statusCode).json(body)
}

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }