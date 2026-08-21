import jwt from "jsonwebtoken";
import { UserAccesTokenDTO } from "../types/auth.types";
import { randomUUID } from "crypto";
import RefreshToken from "../models/RefreshToken";

export const generateAccessToken = (payload: UserAccesTokenDTO): string => {
  const secret = process.env["JWT_SECRET"] || "falback-secret"
  const expiresIn = process.env["JWT_EXPIRES_IN"] || "15m"
  return jwt.sign(payload, secret, { expiresIn })
}

export const generateRefreshToken = async (userId: string): Promise<string> => {
  const token = randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await RefreshToken.create({
    token,
    userId,
    expiresAt,
    isRevoked: false,
  })

  return token
}