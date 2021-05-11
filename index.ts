import app from "./app"
import http from "http"
import config from "./utils/config"

const server = http.createServer(app)

server.listen(config.PORT, () => {
  console.log(`Server running at ${config.IP}:${config.PORT}`)
  console.log(`API docs available at ${config.IP}:${config.PORT}/api-docs`)
})