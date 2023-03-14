import "jest";
import * as express from "express";
import * as request from "supertest";
import { StatusCodes } from "http-status-codes";
import IntegrationHelpers from "../helpers/Integration-helpers";
import Token from "../../models/Token";

describe("authentication api integration tests", () => {
  let app: express.Application;
  beforeAll(async () => {
    app = await IntegrationHelpers.getApp();
  });

  afterAll(async () => {
    app.emit("close");
  });

  let workerUser: any = {
    firstName: "Working",
    lastName: "Wayde",
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

  const logOutUser = async (token: any, statusCode: StatusCodes) => {
    return await request
      .agent(app)
      .post("/api/authentication/logout")
      .set("x-access-token", token)
      .set("Accept", "application/json")
      .expect(statusCode);
  };

  const changePassword = async (token: any, currentPassword: string, newPassword: string, statusCode: StatusCodes) => {
    return await request
      .agent(app)
      .put("/api/authentication/changePassword")
      .send({ currentPassword, newPassword })
      .set("x-access-token", token)
      .set("Accept", "application/json")
      .expect(statusCode);
  };

  it("Register a new worker", () => registerUser(workerUser, StatusCodes.OK));

  it("Register a new agency", () =>
    registerUser(
      {
        firstName: "Agency",
        lastName: "Annie",
        email: "agency@test.fi",
        password: "bambi123",
        userType: "agency",
      },
      StatusCodes.OK
    ));

  it("Register a new business", () =>
    registerUser(
      {
        firstName: "Business",
        lastName: "Bob",
        email: "business@test.fi",
        password: "bambi123",
        userType: "business",
      },
      StatusCodes.OK
    ));

  it("Can't register an admin user", () =>
    registerUser(
      {
        firstName: "admin",
        lastName: "admin",
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

  it("returns 400 when the password length is less than 8 characters", () =>
    registerUser(
      {
        firstName: "Agency1",
        lastName: "Annie1",
        email: "agency1@test.fi",
        password: "ba",
        userType: "agency",
      },
      StatusCodes.BAD_REQUEST
    ));

  it("returns Unknown user type when user trys to register as an admin", () =>
    registerUser(
      {
        firstName: "admin",
        lastName: "admin",
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
        firstName: "Agency",
        lastName: "Annie",
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

    expect(response.body.firstName).toBe(workerUser.firstName);
    expect(response.body.lastName).toBe(workerUser.lastName);
    expect(response.body.role).toBe(workerUser.userType);
    expect(Object.keys(response.body)).toEqual(["token", "firstName", "lastName", "email", "role", "_id"]);

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

    // Confirm that login works before inactivating user
    await signInUser(
      {
        email: workerUser.email,
        password: workerUser.password,
      },
      StatusCodes.OK
    );

    // Inactivate user by admin user
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

    // Confirm that user login doesn't work anymore
    await signInUser(
      {
        email: workerUser.email,
        password: workerUser.password,
      },
      StatusCodes.FORBIDDEN
    );
  });

  it("returns 200 when user logout and deletes user's token from database", async () => {
    await registerUser(
      {
        firstName: "User",
        lastName: "Uniform",
        email: "user@test.com",
        password: "user1234",
        userType: "worker",
      },
      StatusCodes.OK
    );
    const response = await signInUser(
      {
        email: "user@test.com",
        password: "user1234",
      },
      StatusCodes.OK
    );
    const token = response.body.token;
    await logOutUser(token, StatusCodes.OK);
    const storedToken = await Token.findOne({ token: token });
    expect(storedToken).toBeNull();
  });

  it("changing password checks", async () => {
    const response = await registerUser(
      {
        firstName: "Good",
        lastName: "Luck",
        email: "goodluck@test.com",
        password: "badluck123",
        userType: "agency",
      },
      StatusCodes.OK
    );

    const token = response.body.token;

    // returns 406 when current password is same as new password
    await changePassword(token, "badluck123", "badluck123", StatusCodes.NOT_ACCEPTABLE);

    // returns 406 when current password is incorrect
    await changePassword(token, "badluck12345", "badluck123", StatusCodes.NOT_ACCEPTABLE);

    // returns 400 when the new password is empty
    await changePassword(token, "badluck123", "", StatusCodes.BAD_REQUEST);

    // returns 411 when the new password is less than 8 characters
    await changePassword(token, "badluck123", "hello", StatusCodes.LENGTH_REQUIRED);

    // returns 200 when change password succeed
    await changePassword(token, "badluck123", "Goodluck123", StatusCodes.OK);
    await logOutUser(token, StatusCodes.OK);
    await signInUser(
      {
        email: "goodluck@test.com",
        password: "Goodluck123",
      },
      StatusCodes.OK
    );
  });

  it("token checks", async () => {
    const response = await registerUser(
      {
        firstName: "Token",
        lastName: "Guy",
        email: "tokenguy@test.com",
        password: "qwerty123",
        userType: "worker",
      },
      StatusCodes.OK
    );

    const userId = response.body._id;

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 - 1);

    const expiredToken = "expired-token";
    await Token.create({
      token: expiredToken,
      user: userId,
      lastUsedAt: oneWeekAgo,
    });

    const validToken = "valid-token";
    await Token.create({
      token: validToken,
      user: userId,
      lastUsedAt: new Date(),
    });

    // No token given
    await changePassword(null, "qwerty123", "qwerty456", StatusCodes.UNAUTHORIZED);

    // Expired token given
    await changePassword(expiredToken, "qwerty123", "qwerty456", StatusCodes.UNAUTHORIZED);

    // Valid token given
    await changePassword(validToken, "qwerty123", "qwerty456", StatusCodes.OK);
  });
});
