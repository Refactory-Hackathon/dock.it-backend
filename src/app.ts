import express, {
  NextFunction, Response, Request

} from 'express';
import cookieParser from "cookie-parser";
import cors from "cors";

import { envConfig } from "./config/env.config";
import { errorHandler } from './middleware/error.middleware';
import { authRoutes } from './features/auth/auth.routes';
import { APIResponse } from './utils/response.util';

const app = express();

const allowedOrigins = (envConfig.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

app.use('/api/auth', authRoutes);

app.use(errorHandler);

app.get('/api/health', (req: Request, res: Response<APIResponse>, next: NextFunction) => {
  try {
    return res.status(200).json({
      message: 'API is healthy',
      status: 'success',
    })
  } catch (error) {
    next(error)
  }
});

export default app;
