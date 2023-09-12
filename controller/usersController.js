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
  } catch (error) {
    console.log(error);
    res.json({
      status: "fail",
      remarks: "Error with database server transaction/connections",
      error: error,
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

    try {
      const sql =
        "INSERT INTO useraccounts (username, password, email, usergroup, isAdmin, active) VALUES (?,?,?,?,?,?)";
      const queryArr = [username, hashpwd, email, usergroup, isAdmin, true];

      // save record to db. DB rule disallowed duplicate username/email.
      const results = await dbQuery(sql, queryArr);
      res.status(200).send(results);
    } catch (error) {
      res.status(500).json(error);
    }
  } else {
    res.status(404).end("Invalid Request due to missing parameters");
  }
};

////////////////////////////////////////////////////////////////
// for admin, update all fields
////////////////////////////////////////////////////////////////
const updateUserDetails = async (req, res, next) => {
  // Todo: isAdmin must refer to the person who changed it, based on the token search
  let { username, password, email, usergroup, isAdmin, active } = req.body;
  console.log("update user", req.body);

  // for admin, update all fields
  let updateAllFields = async (
    pwd,
    saltRnd,
    email2,
    usergroup2,
    username2,
    isAdmin2,
    active2,
    res
  ) => {
    // hash password and save to db
    let hashpwd = await bcrypt.hash(pwd, saltRnd);

    // TODO need to catch username not valid
    try {
      const sql =
        "UPDATE kanban.useraccounts SET password = ?, email = ?, usergroup = ?, isAdmin = ?, active = ? WHERE username = ?";
      const queryArr = [
        hashpwd,
        email2,
        usergroup2,
        isAdmin2,
        active2,
        username2,
      ];
      const results = await dbQuery(sql, queryArr);
      res.status(200).send(results);
    } catch (error) {
      res.status(500).json(error);
    }
  };

  // for user, update only the email and pass
  let updateCertainFields = async (pwd, saltRnd, email2, username2, res) => {
    // hash password and save to db
    let hashpwd = await bcrypt.hash(pwd, saltRnd);

    try {
      const sql =
        "UPDATE kanban.useraccounts SET password = ?, email = ? WHERE username = ?";
      const queryArr = [hashpwd, email2, username2];
      const results = await dbQuery(sql, queryArr);
      res.status(200).send(results);
    } catch (error) {
      res.status(500).json(error);
    }
  };

  if (isAdmin) {
    // only admin can update usergroup
    if (password && saltRounds && email && usergroup && username && isAdmin) {
      console.log("update by admin");
      updateAllFields(
        password,
        saltRounds,
        email,
        usergroup,
        username,
        isAdmin,
        active,
        res
      );
    } else {
      res.status(404).end("Invalid Request due to missing parameters");
    }
  } else {
    // user can only update his own password and email
    if (password && saltRounds && email && username) {
      console.log("update by user");
      updateCertainFields(password, saltRounds, email, username, res);
    } else {
      res.status(404).end("Invalid Request due to missing parameters");
    }
  }
};

////////////////////////////////////////////////////////////////
// Find all users
////////////////////////////////////////////////////////////////
const getAllUser = async (req, res, next) => {
  // Todo: isAdmin must refer to the person who changed it, based on the token search
  let { isAdmin } = req.body;

  // check if the user doing the updating is admin
  if (isAdmin) {
    try {
      const sql = "SELECT * FROM useraccounts";
      const queryArr = [];
      const results = await dbQuery(sql, queryArr);
      res.status(200).send(results);
    } catch (error) {
      res.status(500).json(error);
    }
  } else {
    return res.status(403).send("User is not authorized to access"); // not authorized
  }
};

////////////////////////////////////////////////////////////////
// Admin can find any user details but user can only view their details
////////////////////////////////////////////////////////////////
const getUserById = async (req, res, next) => {
  let { username, isAdmin, myusername } = req.body;

  // find user by username
  let queryDBUserById = async (username2, res) => {
    try {
      const sql = "SELECT * FROM useraccounts WHERE username = ?";
      const queryArr = [username2];
      const results = await dbQuery(sql, queryArr);
      res.status(200).send(results);
    } catch (error) {
      res.status(500).json(err);
    }
  };

  // admin find other user details
  if (isAdmin === true) {
    if (username) {
      queryDBUserById(username, res);
    } else {
      res.status(404).send("Invalid Request due to missing parameters");
    }
  }
  // user can only search their own details
  else {
    if (myusername) {
      queryDBUserById(myusername, res);
    } else {
      res.status(404).send("Invalid Request due to missing parameters");
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
