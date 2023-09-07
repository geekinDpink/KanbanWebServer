/*
Not in use yet
Not tested
*/
const bcrypt = require("bcrypt");
const connection = require("./config/dbConfig");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const getAllUserGroups = async () => {
  connection.query("SELECT * FROM usergroups", function (err, results) {
    res.send(results);
    console.log(err);
  });
};

const userGroupControllers = {
  getAllUserGroups,
};

module.exports = userGroupControllers;
