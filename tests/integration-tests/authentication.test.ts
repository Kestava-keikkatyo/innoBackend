import "jest";
import * as express from "express";
import * as request from "supertest";
import { StatusCodes } from "http-status-codes";
import IntegrationHelpers from "../helpers/Integration-helpers";
import { error } from "console";

describe("authentication api integration tests", () => {
  let app: express.Application;
  beforeAll(async () => {
    app = await IntegrationHelpers.getApp();
  });

  afterAll(async () => {
    app.emit("close");
  });

  let workerUser: any = {
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
    return await request
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

  it("returns Ok, token, name, email, role and user id when credentials are correct and login success", async () => {
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

    workerUser._id = response.body._id;
  });

  it("returns 401 when user does not exist", async () => {
    await signInUser(
      {
        email: "batman@test.fi",
        password: "batman123",
      },
      StatusCodes.UNAUTHORIZED
    );
  });

  it("returns 401 when password is wrong", async () => {
    await signInUser(
      {
        email: workerUser.email,
        password: "hfhgfghgf123",
      },
      StatusCodes.UNAUTHORIZED
    );
  });

  it("returns 401 when e-mail is wrong", async () => {
    await signInUser(
      {
        email: "worker@test.com",
        password: workerUser.password,
      },
      StatusCodes.UNAUTHORIZED
    );
  });

  it("can't login as inactive user", async () => {
    const response = await signInUser(
      {
        email: "admin@nowhere.com",
        password: "Fisherman",
      },
      StatusCodes.OK
    );
    error("workerUser", workerUser);
    await request
      .agent(app)
      .patch("/api/user/updateStatus/" + workerUser._id)
      .send({
        userId: workerUser._id,
        active: false,
      })
      .set("x-access-token", response.body.token)
      .set("Accept", "application/json")
      .expect(StatusCodes.OK);

    await signInUser(
      {
        email: "worker@test.com",
        password: workerUser.password,
      },
      StatusCodes.UNAUTHORIZED
    );
  });
});
