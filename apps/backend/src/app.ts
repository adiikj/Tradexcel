import express from 'express';
import cors from 'cors';
import cookieparser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import logger from './utils/logger.js';


const app = express();

app.set('trust proxy', 1);

const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000", // Next.js dev server
  credentials: true, // Allow credentials (cookies, authentication headers, etc.)
};

app.use(cors(corsOptions));
app.use(
  pinoHttp({
    logger,
    // Default pino-http serializers dump the full req (all headers, query,
    // params, remoteAddress) and res objects — one request became a huge
    // JSON blob per line. Trim to what's actually useful for a dev console.
    serializers: {
      req(req) {
        return { method: req.method, url: req.url };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);


app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended: true, limit : "16kb"}))
app.use(express.static("public"))
app.use(cookieparser())
app.options("*", cors(corsOptions)); // Enable preflight response for all routes


//routes import
import userRouter from './routes/user.routes.js';

//routes declaration
app.use("/api/v1/users",userRouter)

import financeRouter from './routes/finance.routes.js';

app.use('/api/v1/finance', financeRouter);

import tradeRouter from './routes/trade.routes.js';

app.use('/api/v1/trade', tradeRouter);

import portfolioRouter from './routes/portfolio.routes.js';

app.use('/api/v1', portfolioRouter);

import leaderboardRouter from './routes/leaderboard.routes.js';

app.use('/api/v1', leaderboardRouter);

import contestRouter from './routes/contest.routes.js';

app.use('/api/v1', contestRouter);

import alertRouter from './routes/alert.routes.js';

app.use('/api/v1', alertRouter);

import adminRouter from './routes/admin.routes.js';

app.use('/api/v1', adminRouter);

import { errorHandler } from './middlewares/error.middleware.js';

app.use(errorHandler);

export { app }