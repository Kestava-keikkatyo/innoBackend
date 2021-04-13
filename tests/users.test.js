import User, { deleteMany } from "../models/User"
import supertest from "supertest"
import { connection } from "mongoose"
import { usersInDb } from "./test_helper"
import app from "../app"
const User = require("../models/User")
const supertest = require("supertest")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const helper = require("./test_helper")
const app = require("../app")
const api = supertest(app)




describe("when there is initially one user at db", () => {
  beforeEach(async () => {
    await deleteMany({})
    // const user = new User({ name: "root", email: "test@adad.com", password: "sekret" })
    const hash = await bcrypt.hash("salis", 10)
    const user = new User({ name: "testiukkeli", email: "testiukkeli@testi.org", passwordHash: hash })
    await user.save()
  })

  test("creation succeeds with a fresh name", async () => {
    const usersAtStart = await usersInDb()

    // const newUser = {
    //   name: "testi",
    //   email: "test@test.com",
    //   password: "salasana",
    // }

    const hash = await bcrypt.hash("salis", 10)
    const newUser = new User({ name: "testiukkeli2", email: "testiukkeli2@testi.org", passwordHash: hash })

    await api
      .post("/api/users")
      .send(newUser)
      .expect(200)
      .expect("Content-Type", /application\/json/)

    const usersAtEnd = await usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.name)
    expect(usernames).toContain(newUser.name)
  })
})

afterAll(() => {
  connection.close()
})