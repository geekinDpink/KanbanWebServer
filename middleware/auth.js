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
// Two Part Midware - get username from req of previous midware and find usergroup, then pass to http req
//////////////////////////////////
const getCurrUserGroup = async (req, res, next) => {
  const username = req.currentUser.currentUsername;
  const sql = "SELECT usergroup FROM useraccounts WHERE username = ?";
  const queryArr = [username];

  try {
    const results = await dbQuery(sql, queryArr);

    req.currentUser = {
      ...req.currentUser,
      currentUserGroup: results[0].usergroup,
    };
    next();
    // const { username: dbUser, password: dbPass, active: dbActive } = results[0];
  } catch (error) {
    res.status(404).send(error);
  }
};

const auth = {
  verifyToken,
  getCurrUserGroup,
};

module.exports = auth;
