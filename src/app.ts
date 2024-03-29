import express, { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import config from "config";
import responseTime from "response-time";
import connect from "./utils/connect";
import logger from "./utils/logger";
import routes from "./routes";
import matchRoutes from "./routes/match.routes";
import deserializeUser from "./middleware/deserializeUser";
import { restResponseTimeHistogram, startMetricsServer } from "./utils/metrics";
import swaggerDocs from "./utils/swagger";
import playerRoutes from "./routes/player.routes";
import playerMatchRoutes from "./routes/player-match.routes";
import cookieParser from "cookie-parser";
import impactRoutes from "./routes/impact.routes";

const port = config.get<number>("port");

const app = express();
const cors = require("cors");

app.use(
  cors({
    origin: config.get("origin"),
    methods: "POST,GET,PUT,PATCH,OPTIONS,DELETE",
    credentials: true,
  })
);

app.use(cookieParser());

app.use(express.json());

app.use(deserializeUser);

app.use(
  responseTime((req: Request, res: Response, time: number) => {
    if (req?.route?.path) {
      restResponseTimeHistogram.observe(
        {
          method: req.method,
          route: req.route.path,
          status_code: res.statusCode,
        },
        time * 1000
      );
    }
  })
);

app.listen(port, async () => {
  logger.info(`App is running at http://localhost:${port}`);

  await connect();

  routes(app);
  matchRoutes(app);
  playerRoutes(app);
  playerMatchRoutes(app);
  impactRoutes(app)

  startMetricsServer();

  //swaggerDocs(app, port);
});
