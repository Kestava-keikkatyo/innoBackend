//import * as data from "../package.json"
import config from "../utils/config"
import swaggerJsdoc from "swagger-jsdoc"

// swagger/openAPI documentation: https://swagger.io/docs/specification/about/
// Cannot be run on its own! Runs when the app gets ran.
const data = require('../package.json')
let version: any = data.version

const options: any = {
  swaggerDefinition: {
    openapi: "3.0.0",
    version,
    // Like the one described here: https://swagger.io/specification/#infoObject
    info: {
      title: "Keikkakaveri REST API",
      version,
      description: "REST API documentation for Keikkakaveri",
      license: {
        name: "Apache-2.0",
        url: "https://www.apache.org/licenses/LICENSE-2.0"
      }
    },
    servers: [
      {
        url: `${config.IP}:${config.PORT}/api`
      }
    ],
    tags: [
      {
        name: "Login",
        description: "Login routes"
      },
      {
        name: "Worker",
        description: "All routes regarding workers"
      },
      {
        name: "Agency",
        description: "All routes regarding agencies"
      },
      {
        name: "Business",
        description: "All routes regarding businesses"
      },
      {
        name: "BusinessContract",
        description: "All routes regarding business contracts"
      },
      {
        name: "WorkContract",
        description: "All routes regarding work contracts"
      },
      {
        name: "Feelings",
        description: "All routes regarding feelings"
      },
      {
        name: "Forms",
        description: "All routes regarding forms"
      },
      {
        name: "Reports",
        description: "All routes regarding reports"
      }
    ]
  },
  // List of files to be processed. You can also set globs './routes/*.js'
  apis: ["./doc/swaggerComponents.yaml", "./controllers/*.ts"],
}

const swaggerDocument = swaggerJsdoc(options)

export default swaggerDocument