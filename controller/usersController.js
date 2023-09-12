const { connection, dbQuery } = require("../config/dbConfig");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

const saltRounds = config.saltRound; // return int as string

////////////////////////////////////////////////////////////////
// check if user details match in db for login
////////////////////////////////////////////////////////////////
const findUser = async (req, res, next) => {
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

    // check if password match with db password which is hashed
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
    } else {
      res.status(404).json({
        status: "fail",
        message: "Password does not match",
      });
    }
  } catch (e) {
    console.log(e);
    res.json({
      status: "fail",
      message: "Error with database server transaction/connections",
    });
  }
};

////////////////////////////////////////////////////////////////
// Create new user + async to wait for encryption of password
////////////////////////////////////////////////////////////////
const registerNewUser = async (req, res, next) => {
  let { username, password, email, usergroup, isAdmin } = req.body;
  console.log("register", req.body);

  if (username && password && usergroup) {
    let hashpwd = await bcrypt.hash(password, saltRounds);
    connection.query(
      "INSERT INTO useraccounts (username, password, email, usergroup, isAdmin, active) VALUES (?,?,?,?,?,?)",
      [username, hashpwd, email, usergroup, isAdmin, true],
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

////////////////////////////////////////////////////////////////
// for admin, update all fields
////////////////////////////////////////////////////////////////
const updateUserDetails = async (req, res, next) => {
  // Todo: isAdmin must refer to the person who changed it, based on the token search
  let { username, password, email, usergroup, isAdmin } = req.body;
  console.log("update user", req.body);

  // for admin, update all fields
  let updateAllFields = async (
    pwd,
    saltRnd,
    email2,
    usergroup2,
    username2,
    isAdmin2,
    res
  ) => {
    // hash password and save to db
    let hashpwd = await bcrypt.hash(pwd, saltRnd);
    connection.query(
      "UPDATE kanban.useraccounts SET password = ?, email = ?, usergroup = ?, isAdmin = ?, active = ? WHERE username = ?",
      [hashpwd, email2, usergroup2, isAdmin2, true, username2],
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
  let updateCertainFields = async (pwd, saltRnd, email2, username2, res) => {
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

  if (isAdmin) {
    // only admin can update usergroup
    if (password && saltRounds && email && usergroup && username && isAdmin) {
      updateAllFields(
        password,
        saltRounds,
        email,
        usergroup,
        username,
        isAdmin,
        res
      );
    } else {
      res.status(404).end("Invalid Request due to missing parameters");
    }
  } else {
    // user can only update his own password and email
    if (password && saltRounds && email && username) {
      console.log("not admin");
      updateCertainFields(password, saltRounds, email, username, res);
    } else {
      res.status(404).end("Invalid Request due to missing parameters");
    }
  }
};

////////////////////////////////////////////////////////////////
// Find all users
////////////////////////////////////////////////////////////////
const getAllUser = (req, res, next) => {
  // Todo: isAdmin must refer to the person who changed it, based on the token search
  let { isAdmin } = req.body;

  // check if the user doing the updating is admin
  if (isAdmin) {
    connection.query("SELECT * FROM useraccounts", function (err, results) {
      if (err) {
        res.status(500).json(err);
      } else {
        res.status(200).send(results);
      }
    });
  } else {
    return res.status(403).send("User is not authorized to access  "); // not authorized
  }
};

////////////////////////////////////////////////////////////////
// Admin can find any user details but user can only view their details
////////////////////////////////////////////////////////////////
const getUserById = (req, res, next) => {
  let { username, isAdmin, myusername } = req.body;

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

  // admin find other user details
  if (isAdmin) {
    if (username) {
      queryDBUserById(username, res);
    } else {
      res.status(404).end("Invalid Request due to missing parameters");
    }
  }
  // user can only search their own details
  else {
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
  updateUserDetails: updateUserDetails,
  getAllUser: getAllUser,
  getUserById: getUserById,
};
