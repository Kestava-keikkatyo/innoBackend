import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import config from "./utils/config";
import uploadsRouter from "./controllers/uploads";
import feelingsRouter from "./controllers/feelings";
import workcontractRouter from "./controllers/workcontracts";
import notificationsRouter from "./controllers/notifications";
import {
  errorHandler,
  requestLogger,
  unknownEndpoint,
} from "./utils/middleware";
import { info, error as _error } from "./utils/logger";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./doc/generateSwaggerDoc";
import feedbackRouter from "./controllers/feedBack";
import adminRouter from "./controllers/admin";
import jobRouter from "./controllers/job";
import authRouter from "./controllers/authentication";
import userRouter from "./controllers/user";
import applicationRouter from "./controllers/application";
import form2Router from "./controllers/form2";
import agreementRouter from "./controllers/agreement";
import reportRouter from "./controllers/report";

const app = express();

info("connecting to", config.MONGODB_URI);

// These options fix deprecation warnings
const options: any = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
};

mongoose.connect(config.MONGODB_URI || "URI_NOTFOUND", options);
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
app.use("/api/feelings", feelingsRouter);
app.use("/api/workcontracts", workcontractRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/admin", adminRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/job", jobRouter);
app.use("/api/authentication", authRouter);
app.use("/api/user", userRouter);
app.use("/api/application", applicationRouter);
app.use("/api/form2", form2Router);
app.use("/api/agreement", agreementRouter);
app.use("/api/report", reportRouter);

app.use(unknownEndpoint);
app.use(errorHandler);

export default app;
