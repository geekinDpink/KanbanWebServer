const jwt = require("jsonwebtoken");
const { dbQuery } = require("../config/dbConfig");

require("dotenv").config();

//////////////////////////////////
// Two Part Midware - ensure token is valid and to add username from token to req
//////////////////////////////////
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403).send("Invalid Token");
      }
      req.currentUser = { currentUsername: user.username };
      next();
    });
  } else {
    res.sendStatus(401).send("Missing Token");
  }
};

//////////////////////////////////
// Two Part Midware - get username from req of previous midware and find usergroup and active status, verify active user and pass status to http req
//////////////////////////////////
const getUserGrpAndVerifyActive = async (req, res, next) => {
  const username = req.currentUser.currentUsername;
  const sql = "SELECT usergroup, active FROM useraccounts WHERE username = ?";
  const queryArr = [username];

  try {
    const results = await dbQuery(sql, queryArr);
    if (results[0].active === 1) {
      req.currentUser = {
        ...req.currentUser,
        currentUserGroup: results[0].usergroup,
        currentUserActive: results[0].active,
      };
      next();
    } else {
      res.status(403).send("User account is not active");
    }
    // const { username: dbUser, password: dbPass, active: dbActive } = results[0];
  } catch (error) {
    res.status(404).send(error);
  }
};

const auth = {
  verifyToken,
  getUserGrpAndVerifyActive,
};

module.exports = auth;
