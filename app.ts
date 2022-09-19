import express from "express";
import cors from "cors";
import mongoose, { ConnectOptions } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import config from "./utils/config";
import uploadsRouter from "./controllers/uploads";
import { errorHandler, requestLogger, unknownEndpoint } from "./utils/middleware";
import { info } from "./utils/logger";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./doc/generateSwaggerDoc";
import feedbackRouter from "./controllers/feedBack";
import jobRouter from "./controllers/job";
import authRouter from "./controllers/authentication";
import userRouter from "./controllers/user";
import applicationRouter from "./controllers/application";
import formRouter from "./controllers/form";
import agreementRouter from "./controllers/agreement";
import reportRouter from "./controllers/report";
import topicRouter from "./controllers/topic";
import workRequestRouter from "./controllers/workRequest";
import responsibilityRouter from "./controllers/responsibility";
import feelingRouter from "./controllers/feeling";

export default async (useInMemoryDb: boolean) => {
  const app = express();
  let mongod: MongoMemoryServer | null = null;

  // These options fix deprecation warnings
  const options: ConnectOptions = {};

  if (useInMemoryDb) {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoose.connect(uri, options);
  } else {
    info("connecting to", config.MONGODB_URI);
    mongoose.connect(config.MONGODB_URI || "URI_NOTFOUND", options);
  }

  /*
  .then(() => {
    info("connected to MongoDB")
  })
  .catch((error) => {
    _error("error connection to MongoDB:", error.message)
  })
 */

  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  app.use("/api/uploads", uploadsRouter);
  app.use("/api/feedback", feedbackRouter);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use("/api/job", jobRouter);
  app.use("/api/authentication", authRouter);
  app.use("/api/user", userRouter);
  app.use("/api/application", applicationRouter);
  app.use("/api/form", formRouter);
  app.use("/api/agreement", agreementRouter);
  app.use("/api/report", reportRouter);
  app.use("/api/topic", topicRouter);
  app.use("/api/workRequest", workRequestRouter);
  app.use("/api/responsibility", responsibilityRouter);
  app.use("/api/feeling", feelingRouter);

  app.use(unknownEndpoint);
  app.use(errorHandler);

  app.addListener("close", async () => {
    await mongoose.connection.close();

    if (mongod) {
      mongod.stop().catch((e) => console.error(e));
    }
  });

  return app;
};
