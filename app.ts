var { graphqlHTTP } = require('express-graphql');
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import config from "./utils/config";
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLList,
  
} from "graphql";
import crossloginRouter from './controllers/crosslogin'
import workersRouter from "./controllers/workers";
import businessRouter from "./controllers/businesses";
import agenciesRouter from "./controllers/agencies";
import uploadsRouter from "./controllers/uploads";
import businesscontractsRouter from "./controllers/businesscontracts";
import feelingsRouter from "./controllers/feelings";
import workcontractRouter from "./controllers/workcontracts";
import formsRouter from "./controllers/forms";
import businessContractFormsRouter from "./controllers/businesscontractforms";
import notificationsRouter from "./controllers/notifications";
import {
  errorHandler,
  requestLogger,
  unknownEndpoint,
} from "./utils/middleware";
import { info, error as _error } from "./utils/logger";
import swaggerUi from "swagger-ui-express";

import swaggerDocument from "./doc/generateSwaggerDoc";
import profileRouter from "./controllers/profile";
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
let humanType = new GraphQLObjectType({
  name: "Profile",
  fields: () => ({
    id: { type: GraphQLString },
    email: { type: GraphQLString }
  })
});
let schema = new GraphQLSchema({
  query: new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    hello: {
      type: GraphQLString,
      resolve() {
        return "world";
      }
    },
    profile: {
      type: new GraphQLList(humanType),
      args: {
            id: {
                type: GraphQLID
            }
        },
      resolve(parent:any,args:any) {
        console.log(parent,args.id);
        return getProfile(args.id);
      }
    }
  }
})
});
// These options fix deprecation warnings
const options: any = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
};

const getProfile = (id:number) => {
  return Promise.resolve([{
    id: id,
    email : 'matt@mail.com'
  }]);
}
// The root provides a resolver function for each API endpoint
var root = {
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

app.use("/api/workers", workersRouter);
app.use("/api/businesses", businessRouter);
app.use("/api/agencies", agenciesRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/profile", profileRouter);
app.use("/api/businesscontracts", businesscontractsRouter);
app.use("/api/feelings", feelingsRouter);
app.use("/api/workcontracts", workcontractRouter);
app.use("/api/forms", formsRouter);
app.use("/api/businesscontractforms", businessContractFormsRouter);
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
app.use('/crosslogin', crossloginRouter)
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

app.use(unknownEndpoint);
app.use(errorHandler);

export default app;
