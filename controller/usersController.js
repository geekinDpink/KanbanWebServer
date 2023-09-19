const { dbQuery } = require("../config/dbConfig");
const bcrypt = require("bcrypt"); // TODO change to bcryptjs
const jwt = require("jsonwebtoken");
const config = require("../config/config");

const saltRounds = config.saltRound; // return int as string

////////////////////////////////////////////////////////////
// Functions for validating inputs
/////////////////////////////////////////////////////////
const valUsername = async (username, isCreate) => {
  const sql = "SELECT * FROM useraccounts WHERE username = ?";
  const queryArr = [username];
  const results = await dbQuery(sql, queryArr);

  if (!username) {
    return "No username provided";
  } else if (username.length < 3) {
    return "Username:Mins 3 chars";
  } else if (username.length > 51) {
    return "Username:Max 50 chars";
  } else if (isCreate && results.length > 0) {
    return "Existing Username";
  } else if (!isCreate && results.length === 0) {
    return "No existing user";
  } else {
    return false;
  }
};

const valPassword = (password, isCreate) => {
  // ^- context start, (?=._\d)-contain digit, (?=._[~!@#$%^&*()--+={}\[\]|\\:;"'<>,.?/_₹])-special char, (?=.\*[a-zA-Z])-at least 1 lower/uppercase, .{8,10}-length of 8-10
  const regex =
    /^(?=.*\d)(?=.*[~`!@#$%^&*()--+={}\[\]|\\:;"'<>,.?/_₹])(?=.*[a-zA-Z]).{8,10}$/;

  if (isCreate && !password) {
    return "No password provided";
  }

  if (password) {
    if (password.length > 10) {
      return "Password:Max 10 characters";
    } else if (password.length < 8) {
      return "Password:Min 8 characters";
    } else if (!regex.test(password)) {
      return "Require alphanumeric and special chars";
    } else {
      return false;
    }
  } else {
    return false;
  }
};

const valEmail = (email) => {
  // letter/no/special char contain @ and ., 2 in length
  const regex = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
  if (email && !regex.test(email)) {
    return "Invalid email";
  } else {
    return false;
  }
};

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
// Username, Password are mandatory, Active is by default true
////////////////////////////////////////////////////////////////
const registerNewUser = async (req, res, next) => {
  const { username, password, email, usergroup } = req.body;
  const { currentUserGroup: myUserGroup } = req.currentUser;
  console.log("register", req.body);

  const invalidUsername = await valUsername(username, true);
  const invalidEmail = await valEmail(email);
  const invalidPassword = await valPassword(password, true);

  if (myUserGroup.includes("admin")) {
    if (!invalidUsername && !invalidEmail && !invalidPassword) {
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
  const { username, password, email, usergroup, active } = req.body;
  const { currentUsername: myUsername, currentUserGroup: myUserGroup } =
    req.currentUser;

  const invalidUsername = await valUsername(username, false);
  const invalidEmail = await valEmail(email);
  const invalidPassword = await valPassword(password, false);

  /************** function for admin, update all fields********************/
  let adminUpdate = async (
    pwd,
    saltRnd,
    email2,
    usergroup2,
    username2,
    active2,
    res
  ) => {
    // hash password and save to db
    let hashpwd = pwd ? await bcrypt.hash(pwd, saltRnd) : null;

    // TODO need to catch username not valid
    try {
      const sql =
        "UPDATE kanban.useraccounts SET password = COALESCE(?,password), email = ?, usergroup = ?, active = ? WHERE username = ?";
      const queryArr = [hashpwd, email2, usergroup2, active2, username2];
      const results = await dbQuery(sql, queryArr);
      res.status(200).send(results);
    } catch (error) {
      res.status(500).send(error);
    }
  };

  /*****************function for user, update own email and pass field **********************/
  let userUpdate = async (pwd, saltRnd, email2, username2, res) => {
    // hash password and save to db
    let hashpwd = pwd ? await bcrypt.hash(pwd, saltRnd) : null;

    try {
      const sql =
        "UPDATE kanban.useraccounts SET password = COALESCE(?,password), email = COALESCE(?,email) WHERE username = ?";
      const queryArr = [hashpwd, email2, username2];
      const results = await dbQuery(sql, queryArr);
      res.status(200).send(results);
    } catch (error) {
      res.status(500).json(error);
    }
  };

  if (myUserGroup.includes("admin")) {
    // only admin can update usergroup field and other users
    if (!invalidPassword && saltRounds && !invalidEmail && !invalidUsername) {
      console.log("update by admin1");
      adminUpdate(
        password,
        saltRounds,
        email,
        usergroup,
        username,
        active,
        res
      );
    } else {
      if (invalidUsername) {
        res.status(404).send(invalidUsername);
      } else if (invalidEmail) {
        res.status(404).send(invalidEmail);
      } else if (invalidPassword) {
        res.status(404).send(invalidPassword);
      } else {
        res.status(404).send("Invalid Request due to missing parameters");
      }
    }
  } else {
    // if username === myusername, edit own details
    // user can only update his own password and email, so use myUsername instead of username from req body
    if (
      !invalidPassword &&
      saltRounds &&
      !invalidEmail &&
      !invalidUsername & (username === myUsername)
    ) {
      userUpdate(password, saltRounds, email, myUsername, res);
    } else {
      if (invalidUsername) {
        res.status(404).send(invalidUsername);
      } else if (invalidEmail) {
        res.status(404).send(invalidEmail);
      } else if (invalidPassword) {
        res.status(404).send(invalidPassword);
      } else {
        res.status(404).send("Invalid Request due to missing parameters");
      }
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
// Check if usergroup
//////////////////////////////////
const checkGroup = async (req, res, next) => {
  const { username } = req.body;
  const sql = "SELECT usergroup FROM useraccounts WHERE username = ?";
  const queryArr = [username];

  if (username) {
    try {
      const results = await dbQuery(sql, queryArr);
      if (results.length > 0) {
        res.status(200).send(results);
      } else {
        res.status(404).send("No existing users");
      }
      console.log(results);
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
  checkGroup: checkGroup,
};
