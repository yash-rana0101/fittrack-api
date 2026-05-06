import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security Middleware: Helmet helps secure the app by setting various HTTP headers
app.use(helmet());

// CORS Middleware: Enable Cross-Origin Resource Sharing
app.use(cors());

// Body Parser Middleware: Parse incoming JSON requests
app.use(express.json());

// Logger Middleware: HTTP request logger (Morgan)
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health Check Route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'FitTrack API is healthy and running',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[server]: FitTrack API is running at http://localhost:${PORT}`);
  console.log(`[server]: Environment: ${NODE_ENV}`);
});
