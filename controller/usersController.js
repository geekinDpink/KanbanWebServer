const { dbQuery } = require("../config/dbConfig");
const bcrypt = require("bcrypt"); // TODO change to bcryptjs
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
      active: dbActive,
      usergroup: dbUserGroup,
    } = results[0];

    // check if password match with db password which is hashed
    const isMatch = await bcrypt.compare(password, dbPass);

    // issue token only to active user, token undefined for inactive user; undefined will be omitted from res
    if (dbActive && isMatch) {
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
        isAdmin: dbUserGroup.includes("admin"),
      });
    }
    // if not in db and/or not active user
    else {
      if (!isMatch) {
        res.status(403).json({
          status: "Fail",
          token: undefined,
          remarks: "Invalid password/username",
        });
      } else if (!dbActive) {
        res.status(404).json({
          status: "Fail",
          token: undefined,
          remarks: "Inactive user",
        });
      } else {
        res.status(400).json({
          status: "Fail",
          token: undefined,
          remarks: "Login denied",
        });
      }
    }
  } catch (error) {
    console.log(error);
    res.json({
      status: "Fail",
      token: undefined,
      remarks: "Error with database server transaction/connections",
      error: error,
    });
  }
};

////////////////////////////////////////////////////////////////
// Create new user + async to wait for encryption of password
////////////////////////////////////////////////////////////////
const registerNewUser = async (req, res, next) => {
  const { username, password, email, usergroup } = req.body;
  const { currentUserGroup: myUserGroup } = req.currentUser;
  console.log("register", req.body);

  // Check for error
  const valUsername = async (username) => {
    const sql = "SELECT * FROM useraccounts WHERE username = ?";
    const queryArr = [username];
    const results = await dbQuery(sql, queryArr);

    if (!username) {
      return "No username provided";
    } else if (username.length < 3) {
      return "Username:Mins 3 chars";
    } else if (results[0]) {
      return "Existing Username";
    } else {
      return false;
    }
  };

  const valEmail = (email) => {
    // letter/no/special char contain @ and ., 2 in length
    const regex = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
    if (!regex.test(email)) {
      return "Invalid email";
    } else {
      return false;
    }
  };

  const valPassword = (password) => {
    // ^- context start, (?=._\d)-contain digit, (?=._[~!@#$%^&*()--+={}\[\]|\\:;"'<>,.?/_₹])-special char
    // (?=.\*[a-zA-Z])-at least 1 lower/uppercase, .{8,10}-length of 8-10
    // const regex = /^(?=._\d)(?=.\*[a-z])(?=.\*[A-Z]).{8,10}$/;
    // const regex2 =
    //   /^(?=._\d)(?=._[~`!@#$%^&*()--+={}\[\]|\\:;"'<>,.?/_₹])(?=.\*[a-zA-Z]).{8,10}$/;

    if (!password) {
      return "Missing password";
    }
    // else if (!regex2.test(password)) {
    //   return "Weak password"; // not in requirement
    // }
    else {
      return false;
    }
  };

  const invalidUsername = await valUsername(username);
  const invalidEmail = await valEmail(email);
  const invalidPassword = await valPassword(password);

  if (myUserGroup.includes("admin")) {
    if (!invalidUsername && !invalidEmail && !invalidPassword && usergroup) {
      let hashpwd = await bcrypt.hash(password, saltRounds);

      try {
        const sql =
          "INSERT INTO useraccounts (username, password, email, usergroup, active) VALUES (?,?,?,?,?)";
        const queryArr = [username, hashpwd, email, usergroup, true];

        // save record to db. DB rule disallowed duplicate username/email.
        const results = await dbQuery(sql, queryArr);
        res.status(200).send(results);
      } catch (error) {
        res.status(500).json(error);
      }
    } else {
      if (invalidUsername) {
        res.status(404).send(invalidUsername);
      } else if (invalidEmail) {
        res.status(404).send(invalidEmail);
      } else if (invalidPassword) {
        res.status(404).send(invalidPassword);
      } else {
        res.status(404).send("Invalid Request");
      }
    }
  } else {
    res.status(403).send("Not authorised");
  }
};

////////////////////////////////////////////////////////////////
// for admin, update all fields
////////////////////////////////////////////////////////////////
const updateUserDetails = async (req, res, next) => {
  // Todo: isAdmin must refer to the person who changed it, based on the token search
  const { username, password, email, usergroup, active } = req.body;
  const { currentUsername: myUsername, currentUserGroup: myUserGroup } =
    req.currentUser;

  // for admin, update all fields
  let updateAllFields = async (
    pwd,
    saltRnd,
    email2,
    usergroup2,
    username2,
    active2,
    res
  ) => {
    // hash password and save to db
    let hashpwd = await bcrypt.hash(pwd, saltRnd);

    // TODO need to catch username not valid
    try {
      const sql =
        "UPDATE kanban.useraccounts SET password = ?, email = ?, usergroup = ?, active = ? WHERE username = ?";
      const queryArr = [hashpwd, email2, usergroup2, active2, username2];
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

  if (myUserGroup.includes("admin")) {
    // only admin can update usergroup
    if (password && saltRounds && email && usergroup && username) {
      console.log("update by admin");
      updateAllFields(
        password,
        saltRounds,
        email,
        usergroup,
        username,
        active,
        res
      );
    } else {
      res.status(404).end("Invalid Request due to missing parameters");
    }
  } else {
    // user can only update his own password and email, so use myUsername instead of username from req body
    if (password && saltRounds && email && myUsername) {
      updateCertainFields(password, saltRounds, email, myUsername, res);
    } else {
      res.status(404).end("Invalid Request due to missing parameters");
    }
  }
};

////////////////////////////////////////////////////////////////
// Find all users
////////////////////////////////////////////////////////////////
const getAllUser = async (req, res, next) => {
  let { currentUserGroup: myUserGroup } = req.currentUser;

  // check if the user doing the updating is admin
  if (myUserGroup.includes("admin")) {
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
// Only Admin can find any user details
////////////////////////////////////////////////////////////////
const getUserById = async (req, res, next) => {
  const { username } = req.body;
  const { currentUserGroup: myUserGroup } = req.currentUser;

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
  if (myUserGroup.includes("admin")) {
    if (username) {
      queryDBUserById(username, res);
    } else {
      res.status(404).send("Invalid Request due to missing parameters");
    }
  } else {
    res.status(404).send("Not authorised");
  }
};

////////////////////////////////////////////////////////////////
// View Own User Details - My Profile Page
////////////////////////////////////////////////////////////////
const getMyUser = async (req, res, next) => {
  const { currentUsername: myUsername } = req.currentUser;

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

  // user can only search their own details
  if (myUsername) {
    queryDBUserById(myUsername, res);
  } else {
    res.status(404).send("Invalid Request due to missing parameters");
  }
};

//////////////////////////////////
// Check if user is admin - Used during start of every react route
//////////////////////////////////
const checkIsAdmin = async (req, res, next) => {
  const username = req.currentUser.currentUsername;
  const sql = "SELECT usergroup FROM useraccounts WHERE username = ?";
  const queryArr = [username];

  if (username) {
    try {
      const results = await dbQuery(sql, queryArr);

      const isAdmin = results[0].usergroup.includes("admin") ? "yes" : "no";
      res.status(200).send({ isAdmin: isAdmin });
    } catch (error) {
      res.status(404).send(error);
    }
  } else {
    res.status(404).send("Invalid Request due to missing parameters");
  }
};

exports.usersController = {
  findUser: findUser,
  registerNewUser: registerNewUser,
  updateUserDetails: updateUserDetails,
  getAllUser: getAllUser,
  getUserById: getUserById,
  getMyUser: getMyUser,
  checkIsAdmin: checkIsAdmin,
};
