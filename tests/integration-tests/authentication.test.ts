import "jest";
import * as express from "express";
import * as request from "supertest";
import { StatusCodes } from "http-status-codes";
import IntegrationHelpers from "../helpers/Integration-helpers";
describe("authentication api integration tests", () => {
  let app: express.Application;
  beforeAll(async () => {
    app = await IntegrationHelpers.getApp();
  });

  afterAll(async () => {
    app.emit("close");
  });

  it("Register a new worker", async () => {
    await request
      .agent(app)
      .post("/api/authentication/register")
      .send({
        name: "worker",
        email: "worker@test.fi",
        password: "bambi123",
        userType: "worker",
      })
      .set("Accept", "application/json")
      .expect(StatusCodes.OK);
  });

  it("Register a new agency", async () => {
    await request
      .agent(app)
      .post("/api/authentication/register")
      .send({
        name: "agency",
        email: "agency@test.fi",
        password: "bambi123",
        userType: "agency",
      })
      .set("Accept", "application/json")
      .expect(StatusCodes.OK);
  });

  it("Register a new business", async () => {
    await request
      .agent(app)
      .post("/api/authentication/register")
      .send({
        name: "business",
        email: "business@test.fi",
        password: "bambi123",
        userType: "business",
      })
      .set("Accept", "application/json")
      .expect(StatusCodes.OK);
  });

  it("Can't register an admin user", async () => {
    await request
      .agent(app)
      .post("/api/authentication/register")
      .send({
        name: "admin",
        email: "admin@test.fi",
        password: "bambi123",
        userType: "admin",
      })
      .set("Accept", "application/json")
      .expect(StatusCodes.BAD_REQUEST);
  });

  it("Can't register a user without data", async () => {
    await request
      .agent(app)
      .post("/api/authentication/register")
      .set("Accept", "application/json")
      .expect(StatusCodes.BAD_REQUEST);
  });
});
