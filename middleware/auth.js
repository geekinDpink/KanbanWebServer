const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403).end("Invalid Token");
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401).end("Missing Token");
  }
};

const auth = {
  verifyToken,
};

module.exports = auth;
