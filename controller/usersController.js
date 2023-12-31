const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const config = require("../config/config");
const { dbQuery } = require("../config/dbConfig");

// return int as string
const saltRounds = config.saltRound;

////////////////////////////////////////////////////////////
// Functions for Authentication (token valid and isActive) and Authorisation (isAdmin)
/////////////////////////////////////////////////////////
const checkValidUser = async (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    let verifyJWTRes = {};
    let queryArr = [];
    try {
      verifyJWTRes = await jwt.verify(token, process.env.JWT_SECRET);
      // console.log("verifyResOfJWT2", verifyJWTRes);
      queryArr = [verifyJWTRes.username];
    } catch (error) {
      //res.sendStatus(403).send("Invalid Token");
      return null;
    }
    try {
      const sql = "SELECT * FROM useraccounts WHERE username = ?";
      const results = await dbQuery(sql, queryArr);
      const { active: dbActive } = results[0];
      // results.length > 0 is optional as if no result, error will be catch when destructure active
      if (results.length > 0 && dbActive) {
        return queryArr[0];
      } else {
        //res.status(404).send("Invalid token");
        return null;
      }
    } catch (error) {
      //res.status(500).send("Database transaction/connection error");
      return null;
    }
  } else {
    //res.sendStatus(401).send("Missing Token");
    return null;
  }
};

const checkGroup = async (username, groupName) => {
  const sql = "SELECT usergroup FROM useraccounts WHERE username = ?";
  const queryArr = [username];

  if (username) {
    try {
      const results = await dbQuery(sql, queryArr);
      if (
        results.length > 0 &&
        results[0].usergroup
          .toLowerCase()
          .split(",")
          .includes(groupName.toLowerCase())
      ) {
        return true;
        // res.status(200).send("Yes");
      } else {
        return false;
        // res.status(404).send("No");
      }
    } catch (error) {
      // res.status(404).send("Database transaction/connection error");
      return false;
    }
  } else {
    // res.status(404).send("Invalid Request due to missing parameters");
    return false;
  }
};

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
    if (results.length > 0) {
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
        var token = jwt.sign({ username: dbUser }, process.env.JWT_SECRET, {
          expiresIn: "2h",
        });
        // results[0].token = token;
        // res.send(results);
        res.status(200).json({
          status: "success",
          token: token,
          isAdmin: dbUserGroup.toLowerCase().split(",").includes("admin"),
        });
      }
      // if pwd does match db or not active user
      else {
        if (!isMatch) {
          res.status(403).json({
            status: "Fail",
            token: undefined,
            remarks: "Invalid username/password",
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
    } else {
      res.status(404).json({
        status: "Fail",
        token: undefined,
        remarks: "Invalid username/password",
      });
    }
  } catch (error) {
    console.log(error);
    res.json({
      status: "Fail",
      token: undefined,
      remarks: "Database transaction/connection error",
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

  const myUsername = await checkValidUser(req);
  const isAdmin = await checkGroup(myUsername, "admin");

  const invalidUsername = await valUsername(username, true);
  const invalidEmail = await valEmail(email);
  const invalidPassword = await valPassword(password, true);

  // change to lowercase, convert to arr, check for admin
  if (myUsername && isAdmin) {
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
        res.status(500).send("Database transaction/connection error");
      }
    } else {
      if (invalidUsername) {
        res.status(404).send(invalidUsername);
      } else if (invalidEmail) {
        res.status(404).send(invalidEmail);
      } else if (invalidPassword) {
        res.status(404).send(invalidPassword);
      } else {
        res.status(404).send("Invalid Login");
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
  const myUsername = await checkValidUser(req);
  const isAdmin = await checkGroup(myUsername, "admin");

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

    try {
      const sql =
        "UPDATE kanban.useraccounts SET password = COALESCE(?,password), email = ?, usergroup = ?, active = ? WHERE username = ?";
      const queryArr = [hashpwd, email2, usergroup2, active2, username2];
      const results = await dbQuery(sql, queryArr);
      res.status(200).send(results);
    } catch (error) {
      res.status(500).send("Database transaction/connection error");
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
      res.status(500).send("Database transaction/connection error");
    }
  };
  // change to lowercase, convert to arr, check for admin
  if (myUsername && isAdmin) {
    // only admin can update usergroup field and other users
    if (!invalidPassword && saltRounds && !invalidEmail && !invalidUsername) {
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
    // user can only update his own password and email, hence do a check on username = myusername, and update with myUsername instead of username from req body
    if (
      myUsername &&
      !invalidPassword &&
      saltRounds &&
      !invalidEmail &&
      !invalidUsername & (username === myUsername)
    ) {
      userUpdate(password, saltRounds, email, myUsername, res);
    } else {
      if (!myUsername) {
        res.status(403).send("Not authorised");
      } else if (username !== myUsername) {
        res.status(403).send("Not authorised to edit other users"); // usergroup is not admin and field not editing own field
      } else if (invalidUsername) {
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
// Only Admin can find all users
////////////////////////////////////////////////////////////////
const getAllUser = async (req, res, next) => {
  const myUsername = await checkValidUser(req);
  const isAdmin = await checkGroup(myUsername, "admin");

  if (myUsername && isAdmin) {
    // check if the user doing the updating is admin
    // change to lowercase, convert to arr, check for admin
    try {
      const sql = "SELECT * FROM useraccounts";
      const queryArr = [];
      const results = await dbQuery(sql, queryArr);
      if (results.length > 0) {
        res.status(200).send(results);
      } else {
        res.status(404).send("No record found");
      }
    } catch (error) {
      res.status(500).send("Database transaction/connection error");
    }
  } else {
    res.status(403).send("Not authorised");
  }
};

////////////////////////////////////////////////////////////////
// Only Admin can find any user details
////////////////////////////////////////////////////////////////
const getUserById = async (req, res, next) => {
  const { username } = req.body;
  const myUsername = await checkValidUser(req);
  const isAdmin = await checkGroup(myUsername, "admin");

  // find user by username
  let queryDBUserById = async (username2, res) => {
    try {
      const sql = "SELECT * FROM useraccounts WHERE username = ?";
      const queryArr = [username2];
      const results = await dbQuery(sql, queryArr);
      if (results.length > 0) {
        res.status(200).send(results);
      } else {
        res.status(404).send("No record found");
      }
    } catch (error) {
      res.status(500).send("Database transaction/connection error");
    }
  };

  // admin find other user details
  // change to lowercase, convert to arr, check for admin
  if (myUsername && isAdmin) {
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
  const myUsername = await checkValidUser(req);

  // find user by username
  let queryDBUserById = async (username2, res) => {
    try {
      const sql = "SELECT * FROM useraccounts WHERE username = ?";
      const queryArr = [username2];
      const results = await dbQuery(sql, queryArr);
      if (results.length > 0) {
        res.status(200).send(results);
      } else {
        res.status(404).send("No record found");
      }
    } catch (error) {
      res.status(500).send("Database transaction/connection error");
    }
  };

  // user can only search their own details
  if (myUsername) {
    queryDBUserById(myUsername, res);
  } else {
    res.status(404).send("Not authorised");
  }
};

////////////////////////////////////////////////////////////////
// Authentication and Authorisation Check for each page load
////////////////////////////////////////////////////////////////
const checkValidUserAndIsAdmin = async (req, res, next) => {
  const myUsername = await checkValidUser(req);
  const isAdmin = await checkGroup(myUsername, "admin");

  // user can only search their own details
  if (myUsername) {
    if (isAdmin) {
      res.status(200).send({ isAdmin: true });
    } else {
      res.status(200).send({ isAdmin: false });
    }
  } else {
    res.status(403).send("Not authorised");
  }
};

////////////////////////////////////////////////////////////////
// Check Usergroup Permits (Task, Plan and App) for Kanban Page Load
// If there is no app acronym, omit task and check plan and app permit
////////////////////////////////////////////////////////////////
const checkPermit = async (req, res, next) => {
  const myUsername = await checkValidUser(req);
  const { App_Acronym } = req.body;

  // user can only search their own details
  if (myUsername) {
    if (App_Acronym) {
      try {
        const sql =
          "SELECT App_Permit_Create, App_Permit_Open, App_Permit_ToDoList, App_Permit_Doing, App_Permit_Done FROM applications WHERE App_Acronym = ?";
        const queryArr = [App_Acronym];
        const results = await dbQuery(sql, queryArr);

        if (results.length > 0) {
          const {
            App_Permit_Create,
            App_Permit_Open,
            App_Permit_ToDoList,
            App_Permit_Doing,
            App_Permit_Done,
          } = results[0];

          // Task Permit
          const isCreate = await checkGroup(myUsername, App_Permit_Create);
          const isOpen = await checkGroup(myUsername, App_Permit_Open);
          const isTodolist = await checkGroup(myUsername, App_Permit_ToDoList);
          const isDoing = await checkGroup(myUsername, App_Permit_Doing);
          const isDone = await checkGroup(myUsername, App_Permit_Done);
          // Plan Permit
          const isPlan = await checkGroup(myUsername, "project manager");
          // App Permit
          const isApp = await checkGroup(myUsername, "project lead");

          const permits = {
            isCreate: isCreate,
            isOpen: isOpen,
            isTodolist: isTodolist,
            isDoing: isDoing,
            isDone: isDone,
            isPlan: isPlan,
            isApp: isApp,
          };
          res.status(200).send(permits);
        } else {
          res.status(404).send("App not found");
        }
      } catch (error) {
        res.status(500).send("Database transaction/connection error");
      }
    } else {
      try {
        // Plan Permit
        const isPlan = await checkGroup(myUsername, "project manager");
        // App Permit
        const isApp = await checkGroup(myUsername, "project lead");
        const permits = {
          isCreate: false,
          isOpen: false,
          isTodolist: false,
          isDoing: false,
          isDone: false,
          isPlan: isPlan,
          isApp: isApp,
        };
        res.status(200).send(permits);
      } catch (error) {
        res.status(403).send("Database transaction/connection error");
      }
    }
  } else {
    res.status(403).send("Not authorised");
  }
};

exports.usersController = {
  findUser: findUser,
  registerNewUser: registerNewUser,
  updateUserDetails: updateUserDetails,
  getAllUser: getAllUser,
  getUserById: getUserById,
  getMyUser: getMyUser,
  checkValidUserAndIsAdmin: checkValidUserAndIsAdmin,
  checkPermit: checkPermit,
};
