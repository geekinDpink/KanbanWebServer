/*
Not in use yet
Not tested
*/
const bcrypt = require("bcrypt");
const connection = require("./config/dbConfig");
const jwt = require("jsonwebtoken");

require("dotenv").config();

// Find user by username
const findUser = async (username, pwd) => {
  // check if password matches db hash password and generate jwt as token {status, token}
  connection.query(
    "SELECT * FROM useraccounts WHERE username = ?",
    [username],
    function (err, results) {
      const { username: dbUser, password: dbPass } = results[0];
      bcrypt.compare(pwd, dbPass, function (err, isMatch) {
        if (isMatch) {
          // store username in token
          var token = jwt.sign({ data: dbUser }, process.env.JWT_SECRET);
          // results[0].token = token;
          // res.send(results);
          res.status(200).json({
            status: "success",
            token: token,
          });
        }
      });
    }
  );
};

// Create new user
const registerNewUser = async (pwd, saltRnd, username2, email2, usergroup2) => {
  let hashpwd = await bcrypt.hash(pwd, saltRnd);
  connection.query(
    "INSERT INTO useraccounts (username, password, email, usergroup, active) VALUES (?,?,?,?,?)",
    [username2, hashpwd, email2, usergroup2, true],
    function (err, results) {
      res.send(results);
      console.log(err);
    }
  );
};

// for admin, update all fields
const updateUserAllDetails = async (
  pwd,
  saltRnd,
  email2,
  usergroup2,
  username2
) => {
  // hash password and save to db
  let hashpwd = await bcrypt.hash(pwd, saltRnd);
  connection.query(
    "UPDATE kanban.useraccounts SET password = ?, email = ?, usergroup = ?, active = ? WHERE username = ?",
    [hashpwd, email2, usergroup2, true, username2],
    function (err, results) {
      res.send(results);
      console.log(err);
    }
  );
};

// for user, update only the email and pass
const updateUserDetails = async (pwd, saltRnd, email2, username2) => {
  // hash password and save to db
  let hashpwd = await bcrypt.hash(pwd, saltRnd);
  connection.query(
    "UPDATE kanban.useraccounts SET password = ?, email = ? WHERE username = ?",
    [hashpwd, email, username],
    function (err, results) {
      res.send(results);
      console.log(err);
    }
  );
};

// Find all users
const getAllUser = async () => {
  connection.query("SELECT * FROM useraccounts", function (err, results) {
    res.send(results);
    console.log(err);
  });
};

// Find user by username
const getUserById = async (username2) => {
  connection.query(
    "SELECT * FROM useraccounts WHERE username = ?",
    [username2],
    function (err, results) {
      res.send(results);
      console.log(err);
    }
  );
};

const usersControllers = {
  findUser,
  registerNewUser,
  updateUserAllDetails,
  updateUserDetails,
  getAllUser,
  getUserById,
};

module.exports = usersControllers;
