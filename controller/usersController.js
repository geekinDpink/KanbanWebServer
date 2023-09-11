const connection = require("../config/dbConfig");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

const saltRounds = config.saltRound; // return int as string

const findUser = (req, res, next) => {
  let { username, password } = req.body;

  if (username && password) {
    // check if password matches db hash password and generate jwt as token {status, token}
    connection.query(
      "SELECT * FROM useraccounts WHERE username = ?",
      [username],
      function (err, results) {
        if (err) {
          res.status(500).json(err);
        } else {
          const {
            username: dbUser,
            password: dbPass,
            usergroup: dbUsergroup,
          } = results[0];
          bcrypt.compare(password, dbPass, function (err, isMatch) {
            if (isMatch) {
              // store username and usergroup in token
              var token = jwt.sign(
                { username: dbUser },
                process.env.JWT_SECRET
                //{ expiresIn: "1m" }
              );
              // results[0].token = token;
              // res.send(results);
              res.status(200).json({
                status: "success",
                token: token,
              });
            }
          });
        }
      }
    );
  } else {
    res.status(404).end("Invalid Request due to missing parameters");
  }
};

// Create new user
const registerNewUser = async (req, res, next) => {
  let { username, password, email, usergroup } = req.body;
  console.log("register", req.body);

  if (username && password && usergroup) {
    let hashpwd = await bcrypt.hash(password, saltRounds);
    connection.query(
      "INSERT INTO useraccounts (username, password, email, usergroup, active) VALUES (?,?,?,?,?)",
      [username, hashpwd, email, usergroup, true],
      function (err, results) {
        if (err) {
          res.status(500).json(err);
        } else {
          res.send(results);
        }
      }
    );
  } else {
    res.status(404).end("Invalid Request due to missing parameters");
  }
};

// for admin, update all fields
const updateUserAllDetails = async (req, res, next) => {
  let { username, password, email, usergroup, myusergroup } = req.body;
  console.log("update user", req.body);

  // hash password and save to db
  let hashpwd = await bcrypt.hash(password, saltRounds);
  connection.query(
    "UPDATE kanban.useraccounts SET password = ?, email = ?, usergroup = ?, active = ? WHERE username = ?",
    [hashpwd, email, usergroup, true, username],
    function (err, results) {
      if (err) {
        res.status(500).json(err);
      } else {
        res.send(results);
      }
    }
  );
};

// Find all users
const getAllUser = (req, res, next) => {
  let { myusergroup } = req.body;

  // check if the user doing the updating is admin
  if (myusergroup === "admin") {
    connection.query("SELECT * FROM useraccounts", function (err, results) {
      if (err) {
        res.status(500).json(err);
      } else {
        res.status(200).send(results);
      }
    });
  } else {
    return res.status(403).end("User is not authorized to access  "); // not authorized
  }
};

const getUserById = (req, res, next) => {
  let { username, myusergroup, myusername } = req.body;

  // find user by username
  let queryDBUserById = async (username2, res) => {
    connection.query(
      "SELECT * FROM useraccounts WHERE username = ?",
      [username2],
      function (err, results) {
        if (err) {
          res.status(500).json(err);
        } else {
          res.send(results);
        }
      }
    );
  };

  // check if there is usergroup and if usergroup is admin or user
  if (!myusergroup) {
    return res.status(401).end("User is not authorized"); // not authorized
  } else if (myusergroup === "admin") {
    // admin find other user details
    if (username) {
      queryDBUserById(username, res);
    } else {
      res.status(404).end("Invalid Request due to missing parameters");
    }
  } else {
    // search own user details
    if (myusername) {
      queryDBUserById(myusername, res);
    } else {
      res.status(404).end("Invalid Request due to missing parameters");
    }
  }
};

exports.usersController = {
  findUser: findUser,
  registerNewUser: registerNewUser,
  updateUserAllDetails: updateUserAllDetails,
  getAllUser: getAllUser,
  getUserById: getUserById,
};

// const findUser = (req, res, next) => {
//   let { username, password } = req.body;

//   connection.query(
//     "SELECT * FROM useraccounts WHERE username = ?",
//     [username],
//     function (err, results) {
//       if (err) {
//         res.status(500).json(err);
//       } else {
//         res.status(200).send(results);
//       }
//     }
//   );
// };
