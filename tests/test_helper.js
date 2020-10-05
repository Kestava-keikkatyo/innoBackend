const User = require('../models/User')

const usersInDb = async () => {
    const users = await User.find({})
    return users.map(u => u.toJSON())
  }

  module.exports = {
    usersInDb
  }