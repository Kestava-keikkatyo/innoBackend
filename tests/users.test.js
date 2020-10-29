const User = require("../models/user")
const supertest = require("supertest")
const mongoose = require("mongoose")
const helper = require("./test_helper")
const app = require("../app")
const api = supertest(app)

describe("when there is initially one user at db", () => {
  beforeEach(async () => {
    await User.deleteMany({})
    const user = new User({ name: "root", email: "test@adad.com", password: "sekret" })
    await user.save()
  })

  test("creation succeeds with a fresh name", async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      name: "testi",
      email: "test@test.com",
      password: "salasana",
    }

    await api
      .post("/api/users")
      .send(newUser)
      .expect(200)
      .expect("Content-Type", /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.name)
    expect(usernames).toContain(newUser.name)
  })
})
afterAll(() => {
  mongoose.connection.close()
})