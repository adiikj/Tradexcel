import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieparser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import logger from './utils/logger.js';
import { globalLimiter } from './middlewares/rateLimit.middleware.js';
import { corsOptions } from './config/cors.js';


const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors(corsOptions));
app.use(globalLimiter);
app.use(
  pinoHttp({
    logger,
    // Only failed requests are logged; successful traffic is just noise.
    customLogLevel: (_req, res, err) => (err || res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "silent"),
    serializers: {
      // Path only: query strings can carry emails, codes or tokens.
      req(req) {
        return { method: req.method, path: String(req.url).split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);


app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended: true, limit : "16kb"}))
// No express.static: public/temp holds uploads briefly before they go to
// Cloudinary, and nothing there should be reachable over HTTP.
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

import socialRouter from './routes/social.routes.js';

app.use('/api/v1', socialRouter);

import newsRouter from './routes/news.routes.js';

app.use('/api/v1', newsRouter);

import notificationRouter from './routes/notification.routes.js';

app.use('/api/v1', notificationRouter);

import achievementsRouter from './routes/achievements.routes.js';

app.use('/api/v1', achievementsRouter);

import hallOfFameRouter from './routes/hallOfFame.routes.js';

app.use('/api/v1', hallOfFameRouter);

import contactRouter from './routes/contact.routes.js';

app.use('/api/v1', contactRouter);

import chatRouter from './routes/chat.routes.js';

app.use('/api/v1', chatRouter);

import { errorHandler } from './middlewares/error.middleware.js';

app.use(errorHandler);

export { app }