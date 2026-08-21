import jwt, { type SignOptions } from "jsonwebtoken";
import { UserAccesTokenDTO } from "../types/auth.types";
import { randomUUID } from "crypto";
import RefreshToken from "../models/RefreshToken";

const isProduction = process.env["NODE_ENV"] === "production";

export const ACCESS_TOKEN_EXPIRES_IN = isProduction ? "15m" : "10s";
export const ACCESS_TOKEN_COOKIE_MAX_AGE_MS = isProduction
  ? 15 * 60 * 1000
  : 10 * 1000;
export const REFRESH_TOKEN_DAYS = 7;
export const REFRESH_TOKEN_COOKIE_MAX_AGE_MS =
  REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000;

export const getJwtSecret = (): string => {
  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    throw new Error("JWT_SECRET no está configurado");
  }
  return secret;
};

export const generateAccessToken = (payload: UserAccesTokenDTO): string => {
  const options: SignOptions = { expiresIn: ACCESS_TOKEN_EXPIRES_IN };
  return jwt.sign(payload, getJwtSecret(), options);
};

export const generateRefreshToken = async (userId: string): Promise<string> => {
  const token = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

  await RefreshToken.create({
    token,
    userId,
    expiresAt,
    isRevoked: false,
  });

  return token;
};
