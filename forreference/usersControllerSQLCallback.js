const { connection, dbQuery } = require("../config/dbConfig");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

const saltRounds = config.saltRound; // return int as string

const findUser2 = async (req, res, next) => {
  const { username, password } = req.body;
  const sql = "SELECT * FROM useraccounts WHERE username = ?";
  const queryArr = [username];

  try {
    const results = await dbQuery(sql, queryArr);

    const {
      username: dbUser,
      password: dbPass,
      usergroup: dbUsergroup,
    } = results[0];

    const isMatch = await bcrypt.compare(password, dbPass);

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
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
};

// for login, find user
const findUser = (req, res, next) => {
  let { username, password } = req.body;
  console.log("Hi0");

  if (username && password) {
    // check if password matches db hash password and generate jwt as token {status, token}
    connection.query(
      "SELECT * FROM useraccounts WHERE username = ?",
      [username],
      function (err, results) {
        // Error handling to catch faulty db connection and query + return empty results due to non-match in db
        if (err) {
          console.log("Hi1");
          res.status(500).json(err);
        } else {
          if (results.length > 0) {
            console.log("Hi2");
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
          } else {
            console.log("Hi3");
            res.status(404).send("User Account Not Found");
          }
        }
      }
    );
  } else {
    res.status(404).end("Invalid Request due to missing parameters");
  }
};

// Create new user + async to wait for encryption of password
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
const updateUserDetails = async (req, res, next) => {
  let { username, password, email, usergroup, myusergroup } = req.body;
  console.log("update user", req.body);

  // for admin, update all fields
  let updateAllFields = async (
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
  let updateCertainFields = async (pwd, saltRnd, email2, username2, res2) => {
    // hash password and save to db
    let hashpwd = await bcrypt.hash(pwd, saltRnd);
    connection.query(
      "UPDATE kanban.useraccounts SET password = ?, email = ? WHERE username = ?",
      [hashpwd, email2, username2],
      function (err, results) {
        // res.send(results);
        if (err) {
          res.status(500).json(err);
        } else {
          res.status(200).send(results);
        }
      }
    );
  };

  // check myusergroup is undefined, and if the user is admin or users(others)
  if (!myusergroup) {
    res.status(404).end("Not authorised");
  } else if (myusergroup === "admin") {
    // only admin can update usergroup
    if (password && saltRounds && email && usergroup && username) {
      updateAllFields(password, saltRounds, email, usergroup, username, res);
    } else {
      res.status(404).end("Invalid Request due to missing parameters");
    }
  } else {
    // myusergroup is not admin; dev, pm or pl
    if (password && saltRounds && email && username) {
      console.log("not admin");
      updateCertainFields(password, saltRounds, email, username, res);
    } else {
      res.status(404).end("Invalid Request due to missing parameters");
    }
  }
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

// Admin can find any user details but user can only view their details
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
  findUser: findUser2,
  registerNewUser: registerNewUser,
  updateUserDetails: updateUserDetails,
  getAllUser: getAllUser,
  getUserById: getUserById,
};

const findUser4 = async (req, res, next) => {
  let { username, password } = req.body;

  const dbQuery = (sql, queryArr) => {
    return new Promise((resolve, reject) => {
      connection.query(sql, queryArr, (error, results) => {
        if (error) {
          return reject(error);
        }
        return resolve(results);
      });
    });
  };

  const sql = "SELECT * FROM useraccounts WHERE username = ?";
  const queryArr = [username];

  try {
    const results = await dbQuery(sql, queryArr);
    res.status(200).json({ results: results }); // send a json response
  } catch (e) {
    console.log(e); // console log the error so we can see it in the console
    res.sendStatus(500);
  }
};

/* Template for connection query*/
// const findUser4 = async (req, res, next) => {
//   let { username, password } = req.body;

//   const dbQuery = (sql, queryArr) => {
//     return new Promise((resolve, reject) => {
//       connection.query(sql, queryArr, (error, results) => {
//         if (error) {
//           return reject(error);
//         }
//         return resolve(results);
//       });
//     });
//   };

//   const sql = "SELECT * FROM useraccounts WHERE username = ?";
//   const queryArr = [username];

//   try {
//     const results = await dbQuery(sql, queryArr);
//     res.status(200).json({ results: results }); // send a json response
//   } catch (e) {
//     console.log(e); // console log the error so we can see it in the console
//     res.sendStatus(500);
//   }
// };

/* precusor to template */
// const findUser3 = async (req, res, next) => {
//   let { username, password } = req.body;

//   const dbQuery = () => {
//     return new Promise((resolve, reject) => {
//       connection.query(
//         "SELECT * FROM useraccounts WHERE username = ?",
//         [username],
//         (error, results) => {
//           if (error) {
//             return reject(error);
//           }
//           return resolve(results);
//         }
//       );
//     });
//   };

//   try {
//     const results = await dbQuery();
//     res.status(200).json({ elements: results }); // send a json response
//   } catch (e) {
//     console.log(e); // console log the error so we can see it in the console
//     res.sendStatus(500);
//   }
// };

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

// for admin, update all fields
// const updateUserAllDetails = async (req, res, next) => {
//   let { username, password, email, usergroup, myusergroup } = req.body;
//   console.log("update user", req.body);

//   // hash password and save to db
//   if ((username, password, email, usergroup, myusergroup)) {
//     let hashpwd = await bcrypt.hash(password, saltRounds);
//     connection.query(
//       "UPDATE kanban.useraccounts SET password = ?, email = ?, usergroup = ?, active = ? WHERE username = ?",
//       [hashpwd, email, usergroup, true, username],
//       function (err, results) {
//         if (err) {
//           res.status(500).json(err);
//         } else {
//           if (results.length > 0) {
//             res.send(results);
//           } else {
//             res.status(404).send("User Account Not Found");
//           }
//         }
//       }
//     );
//   } else {
//     res.status(404).end("Invalid Request due to missing parameters");
//   }
// };
