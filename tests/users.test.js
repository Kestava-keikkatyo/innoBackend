/* eslint-disable no-unused-vars */
import Worker from "../models/Worker"
import Business from "../models/Business"
import Agency from "../models/Agency"
import supertest from "supertest"
import mongoose from "mongoose"
import { usersInDb } from "./test_helper"
import bcrypt from "bcryptjs"
import app from "../app"

const api = supertest(app)


describe("when there is initially one user at db", () => {
  beforeEach(async () => {
    await Worker.deleteMany({})
    const hash = await bcrypt.hash("salis", 10)
    const user = new Worker({ name: "testiukkeli", email: "testiukkeli@testi.org", passwordHash: hash })
    await user.save()
  })

  test("creation succeeds with a fresh name", async () => {
    const usersAtStart = await usersInDb()
    const hash = await bcrypt.hash("salis", 10)
    const newUser = new Worker({ name: "testiukkeli2", email: "testiukkeli2@testi.org", passwordHash: hash })

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

// afterAll(() => {
//   connection.close()
// })