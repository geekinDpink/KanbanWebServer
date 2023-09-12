const jwt = require("jsonwebtoken");
const { dbQuery } = require("../config/dbConfig");

require("dotenv").config();

// ensure token is valid
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403).send("Invalid Token");
      }
      req.currentUser = { currUsername: user.username };
      next();
    });
  } else {
    res.sendStatus(401).send("Missing Token");
  }
};

// get current user group
const getRole = async (req, res, next) => {
  const username = req.currentUser.currUsername;
  const sql = "SELECT usergroup FROM useraccounts WHERE username = ?";
  const queryArr = [username];

  try {
    const results = await dbQuery(sql, queryArr);

    req.currentUser = {
      ...req.currentUser,
      currUsergroup: results[0].usergroup,
    };
    next();
    // const { username: dbUser, password: dbPass, active: dbActive } = results[0];
  } catch (error) {
    res.status(404).send(error);
  }
};

const auth = {
  verifyToken,
  getRole,
};

module.exports = auth;
