const { dbQuery } = require("../config/dbConfig");
const jwt = require("jsonwebtoken");

////////////////////////////////////////////////////////////
// Functions for Authentication (token valid and isActive) and Authorisation (isAdmin)
/////////////////////////////////////////////////////////
const checkValidUser = async (req) => {
  const authHeader = req.headers.authorization;

  console.log("checkValidUser", authHeader);
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    let verifyJWTRes = {};
    let queryArr = [];
    try {
      verifyJWTRes = await jwt.verify(token, process.env.JWT_SECRET);
      console.log("verifyResOfJWTgrp", verifyJWTRes);
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
// Get All Usergroups for Multiselect
/////////////////////////////////////////////////////////
const getAllUserGroups = async (req, res, next) => {
  const myUsername = await checkValidUser(req);
  if (myUsername) {
    try {
      const sql = "SELECT * FROM usergroups";
      const queryArr = [];
      const results = await dbQuery(sql, queryArr);
      res.status(200).send(results);
    } catch (error) {
      res.status(500).json(error);
    }
  } else {
    res.status(403).send("Not authorised");
  }
};

////////////////////////////////////////////////////////////
// Only Admin can create new user group
/////////////////////////////////////////////////////////
const createUserGroup = async (req, res, next) => {
  const { usergroup } = req.body;

  const myUsername = await checkValidUser(req);
  const isAdmin = await checkGroup(myUsername, "admin");
  // change to lowercase, convert to arr, check for admin
  if (myUsername && isAdmin) {
    if (usergroup) {
      try {
        const sql = "INSERT INTO usergroups (usergroup) VALUES (?)";
        const queryArr = [usergroup];
        const results = await dbQuery(sql, queryArr);
        res.status(200).send(results);
      } catch (error) {
        res.status(500).json(error);
      }
    } else {
      res.status(404).send("Invalid Request due to missing parameters");
    }
  } else {
    res.status(403).send("Not authorised");
  }
};

exports.usergroupsController = {
  getAllUserGroups: getAllUserGroups,
  createUserGroup: createUserGroup,
};
