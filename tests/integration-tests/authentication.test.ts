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

  const workerUser = {
    name: "worker",
    email: "worker@test.fi",
    password: "bambi123",
    userType: "worker",
  };

  const registerUser = async (user: any, statusCode: StatusCodes) => {
    return await request
      .agent(app)
      .post("/api/authentication/register")
      .send(user)
      .set("Accept", "application/json")
      .expect(statusCode);
  };
  const signInUser = async (credentials: any, statusCode: StatusCodes) => {
    return request
      .agent(app)
      .post("/api/authentication/signin")
      .send(credentials)
      .set("Accept", "application/json")
      .expect(statusCode);
  };

  it("Register a new worker", () => registerUser(workerUser, StatusCodes.OK));

  it("Register a new agency", () =>
    registerUser(
      {
        name: "agency",
        email: "agency@test.fi",
        password: "bambi123",
        userType: "agency",
      },
      StatusCodes.OK
    ));

  it("Register a new business", () =>
    registerUser(
      {
        name: "business",
        email: "business@test.fi",
        password: "bambi123",
        userType: "business",
      },
      StatusCodes.OK
    ));

  it("Can't register an admin user", () =>
    registerUser(
      {
        name: "admin",
        email: "admin@test.fi",
        password: "bambi123",
        userType: "admin",
      },
      StatusCodes.BAD_REQUEST
    ));

  it("Can't register a user without data", () => registerUser(undefined, StatusCodes.BAD_REQUEST));

  it("Can't register a user without name", () =>
    registerUser(
      {
        email: "workerwithoutname@test.fi",
        password: "bambi123",
        userType: "worker",
      },
      StatusCodes.BAD_REQUEST
    ));

  it("returns warning when the password length is less than 3 characters", () =>
    registerUser(
      {
        name: "agency1",
        email: "agency1@test.fi",
        password: "ba",
        userType: "agency",
      },
      StatusCodes.BAD_REQUEST
    ));

  it("returns Unknown user type when user trys to register as an admin", () =>
    registerUser(
      {
        name: "admin",
        email: "admin@test.fi",
        password: "bambi123",
        userType: "admin",
      },
      StatusCodes.BAD_REQUEST
    ));

  it("returns the user is already registered", async () => {
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
      .expect(StatusCodes.CONFLICT);
  });

  it("returns Ok when credentials are correct", async () => {
    const response = await signInUser(
      {
        email: workerUser.email,
        password: workerUser.password,
      },
      StatusCodes.OK
    );

    expect(response.body.name).toBe(workerUser.name);
    expect(response.body.role).toBe(workerUser.userType);
    expect(Object.keys(response.body)).toEqual(["token", "name", "email", "role", "_id"]);
  });
});
