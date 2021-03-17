import express from "express"
import bodyParser from "body-parser"
import cors from "cors"
import mongoose from "mongoose"
import config from "./utils/config"
import usersRouter from "./controllers/users"
import businessRouter from "./controllers/businesses"
import agenciesRouter from "./controllers/agencies"
import loginRouter from "./controllers/login"
import businesscontractsRouter from "./controllers/businesscontracts"
import feelingsRouter from "./controllers/feelings"
import workcontractRouter from "./controllers/workcontracts"
import formsRouter from "./controllers/forms"
import middleware from "./utils/middleware"
import logger from "./utils/logger"

const app = express()

logger.info("connecting to", config.MONGODB_URI)

mongoose.set("useCreateIndex", true)
mongoose.set("useFindAndModify", false)

mongoose.connect(config.MONGODB_URI || 'URI_NOTFOUND', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    logger.info("connected to MongoDB")
  })
  .catch((error) => {
    logger.error("error connection to MongoDB:", error.message)
  })

app.use(cors())
app.use(bodyParser.json())
app.use(middleware.requestLogger)

app.use("/api/users", usersRouter)
app.use("/api/businesses", businessRouter)
app.use("/api/agencies", agenciesRouter)
app.use("/api/login", loginRouter)
app.use("/api/businesscontracts", businesscontractsRouter)
app.use("/api/feelings", feelingsRouter)
app.use("/api/workcontracts", workcontractRouter)
app.use("/api/forms", formsRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

export default app