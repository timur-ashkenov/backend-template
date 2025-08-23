import cors from "cors";

const ALLOWED_ORIGIN = process.env.CORS;

export const corsConfig = cors({
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});
