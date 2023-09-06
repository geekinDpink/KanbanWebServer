require("dotenv").config();

const config = {
  secret: process.env.JWT_SECRET,
  saltRound: parseInt(process.env.SALT_ROUNDS),
  port: 8080,
};
module.exports = config;
