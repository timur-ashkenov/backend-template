import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config();

const allowedOrigins = [
  process.env.ALLOWED_ORIGIN_LOCALHOST,
  process.env.ALLOWED_ORIGIN_BUILD_LOCALHOST
].filter(Boolean);

export function corsMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const origin = request.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    response.header("Access-Control-Allow-Origin", origin);
  }

  response.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  response.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
}