import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { CONNECT_DB } from "./config/mongodb";
import { APIs_V1 } from "./routes/v1";
import { errorHandlingMiddleware } from "./middlewares/errorHandlingMiddleware";
import { corsOptions } from "./config/cors";
import { initializeSocketServer } from "./sockets/socketServer";

const START_SERVER = () => {
  const app = express();
  const httpServer = http.createServer(app);

  const hostname = process.env.APP_HOST;
  const port = process.env.APP_PORT;

  app.use(cors(corsOptions));

  // Enable req.body json data
  app.use(express.json());

  app.use("/v1", APIs_V1);

  app.use(errorHandlingMiddleware);

  initializeSocketServer(httpServer);

  httpServer.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
};

CONNECT_DB()
  .then(() => console.log("Connected to MongoDB Cloud Atlas!"))
  .then(() => START_SERVER())
  .catch((error) => {
    console.error(error);
    process.exit(0);
  });

