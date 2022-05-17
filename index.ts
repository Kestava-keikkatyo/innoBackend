import app from "./app";
import http from "http";
import config from "./utils/config";
import TokenService from "./services/TokenService";

const server = http.createServer(app);

TokenService.scheduleCleanup();

server.listen(config.PORT, () => {
  console.log(`Node environment: ${config.NODE_ENV}`);
  console.log(`Server running at http://${config.IP}:${config.PORT}`);
  console.log(
    `API docs available at http://${config.IP}:${config.PORT}/api-docs`
  );
});
