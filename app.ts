import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import config from "./utils/config"
import workersRouter from "./controllers/workers"
import businessRouter from "./controllers/businesses"
import agenciesRouter from "./controllers/agencies"
import uploadsRouter from "./controllers/uploads"
import loginRouter from "./controllers/login"
import businesscontractsRouter from "./controllers/businesscontracts"
import feelingsRouter from "./controllers/feelings"
import workcontractRouter from "./controllers/workcontracts"
import formsRouter from "./controllers/forms"
import notificationsRouter from "./controllers/notifications"
import { errorHandler, requestLogger, unknownEndpoint } from "./utils/middleware"
import {info, error as _error} from "./utils/logger"
import swaggerUi from "swagger-ui-express"
import swaggerDocument from "./doc/generateSwaggerDoc"
import profileRouter from "./controllers/profile"





const app = express()

info("connecting to", config.MONGODB_URI)

// These options fix deprecation warnings
const options: any = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
}

mongoose.connect(config.MONGODB_URI || 'URI_NOTFOUND', options)
/*
  .then(() => {
    info("connected to MongoDB")
  })
  .catch((error) => {
    _error("error connection to MongoDB:", error.message)
  })
 */

app.use(cors())
app.use(express.json())
app.use(requestLogger)

app.use("/api/workers", workersRouter)
app.use("/api/businesses", businessRouter)
app.use("/api/agencies", agenciesRouter)
app.use("/api/uploads", uploadsRouter)
app.use("/api/login", loginRouter)
app.use("/api/profile",profileRouter)
app.use("/api/businesscontracts", businesscontractsRouter)
app.use("/api/feelings", feelingsRouter)
app.use("/api/workcontracts", workcontractRouter)
app.use("/api/forms", formsRouter)
app.use("/api/notifications", notificationsRouter)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))


app.use(unknownEndpoint)
app.use(errorHandler)

export default app