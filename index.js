const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const connection = require("./config/dbConfig");
const config = require("./config/config");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const { verifyToken } = require("./middleware/auth");

require("dotenv").config();

const saltRounds = config.saltRound; // return int as string

const app = express();
app.use(express.json());
app.use(cors());
const port = config.port;

// Inititalize the app and add middleware
app.use(bodyParser.urlencoded({ extended: true })); // Setup the body parser to handle form submits
app.use(session({ secret: "super-secret" })); // Session setup

// Error Handling: Missing Params - 400, Authorized users, DB Query error [test case: wrong dbconfig] - 500, JWT sign
// TODO DB Query Error Handling
// TODO catchasyncerror wrapper
// TODO Got token -> Sessionislogged on
// TODO Send JWT in cookies
// TODO Add expiry and refresh token

/** Handle login display and form submit */
app.post("/login", (req, res) => {
  let { username, password } = req.body;

  if (username && password) {
    let findUser = async (username, pwd, res) => {
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
            bcrypt.compare(pwd, dbPass, function (err, isMatch) {
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
    };
    findUser(username, password, res);
  } else {
    res.status(404).end("Invalid Request due to missing parameters");
  }
});

// Todo handle email empty
/** Handle user creation */
app.post("/register", (req, res) => {
  let { username, password, email, usergroup } = req.body;
  console.log("register", req.body);

  if (username && password && usergroup) {
    // Create new user
    let registerNewUser = async (
      pwd,
      saltRnd,
      username2,
      email2,
      usergroup2,
      res
    ) => {
      let hashpwd = await bcrypt.hash(pwd, saltRnd);
      connection.query(
        "INSERT INTO useraccounts (username, password, email, usergroup, active) VALUES (?,?,?,?,?)",
        [username2, hashpwd, email2, usergroup2, true],
        function (err, results) {
          if (err) {
            res.status(500).json(err);
          } else {
            res.send(results);
          }
        }
      );
    };
    registerNewUser(password, saltRounds, username, email, usergroup, res);
  } else {
    res.status(404).end("Invalid Request due to missing parameters");
  }
});

/** Full update based on username, instead of patch (partial) */
app.put("/users", verifyToken, (req, res) => {
  let { username, password, email, usergroup, myusergroup } = req.body;
  console.log("update user", req.body);

  // for admin, update all fields
  let updateUserAllDetails = async (
    pwd,
    saltRnd,
    email2,
    usergroup2,
    username2,
    res
  ) => {
    // hash password and save to db
    let hashpwd = await bcrypt.hash(pwd, saltRnd);
    connection.query(
      "UPDATE kanban.useraccounts SET password = ?, email = ?, usergroup = ?, active = ? WHERE username = ?",
      [hashpwd, email2, usergroup2, true, username2],
      function (err, results) {
        if (err) {
          res.status(500).json(err);
        } else {
          res.send(results);
        }
      }
    );
  };

  // for user, update only the email and pass
  let updateUserDetails = async (pwd, saltRnd, email2, username2, res) => {
    // hash password and save to db
    let hashpwd = await bcrypt.hash(pwd, saltRnd);
    connection.query(
      "UPDATE kanban.useraccounts SET password = ?, email = ? WHERE username = ?",
      [hashpwd, email2, username2],
      function (err, results) {
        if (err) {
          res.status(500).json(err);
        } else {
          res.send(results);
        }
      }
    );
  };

  // check if the user doing the updating is admin
  if (!myusergroup) {
    res.status(404).end("Invalid Request due to missing parameters");
  } else if (myusergroup === "admin") {
    // only admin can update usergroup
    if (password && saltRounds && email && usergroup && username) {
      updateUserAllDetails(
        password,
        saltRounds,
        email,
        usergroup,
        username,
        res
      );
    } else {
      res.status(404).end("Invalid Request due to missing parameters");
    }
  } else {
    // myusergroup is not admin; dev, pm or pl
    if (password && saltRounds && email && username) {
      updateUserDetails(password, saltRounds, email, usergroup, username, res);
    } else {
      res.status(404).end("Invalid Request due to missing parameters");
    }
  }
});

/** Admin view all users*/
app.post("/users", verifyToken, (req, res) => {
  let { myusergroup } = req.body;

  // Find all users
  let getAllUser = (res) => {
    connection.query("SELECT * FROM useraccounts", function (err, results) {
      if (err) {
        res.status(500).json(err);
      } else {
        res.send(results);
      }
    });
  };

  // check if the user doing the updating is admin
  if (myusergroup === "admin") {
    getAllUser(res);
  } else {
    return res.status(403).end("User is not authorized to access  "); // not authorized
  }
});

/** Admin can find other user by id, other user can only view their own user id*/
app.post("/user", verifyToken, (req, res) => {
  let { username, myusergroup, myusername } = req.body;

  // find user by username
  let getUserById = async (username2, res) => {
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
      getUserById(username, res);
    } else {
      res.status(404).end("Invalid Request due to missing parameters");
    }
  } else {
    // search own user details
    if (myusername) {
      getUserById(myusername, res);
    } else {
      res.status(404).end("Invalid Request due to missing parameters");
    }
  }
});

/** Get all usergroups*/
app.get("/usergroups", verifyToken, (req, res) => {
  // find user by username
  let getAllUserGroups = (res) => {
    connection.query("SELECT * FROM usergroups", function (err, results) {
      if (err) {
        res.status(500).json(err);
      } else {
        res.send(results);
      }
    });
  };

  getAllUserGroups(res);
});

// app.get("/account", (req, res) => {
//   if (req.session.isLoggedIn === true) {
//     res.send("Your account number is ACL9D42294");
//   } else {
//     res.redirect("/login?redirect_url=/account");
//   }
// });

/** App listening on port */
app.listen(port, () => {
  console.log(`Kanban Web Server listening at http://localhost:${port}`);
});
