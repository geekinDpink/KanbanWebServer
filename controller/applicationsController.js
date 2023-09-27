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
  console.log("checkgrp", username);

  if (username) {
    try {
      const results = await dbQuery(sql, queryArr);
      console.log(results);

      const y = groupName.toLowerCase();

      const z = results[0].usergroup.toLowerCase().split(",");
      console.log(y);
      console.log(z);

      const x = results[0].usergroup.toLowerCase().split(",").includes(y);

      console.log("check you cb", x);

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
// Get All Application
/////////////////////////////////////////////////////////
const getAllApplication = async (req, res, next) => {
  const myUsername = await checkValidUser(req);
  if (myUsername) {
    try {
      const sql = "SELECT * FROM applications";
      const queryArr = [];
      const results = await dbQuery(sql, queryArr);
      res.status(200).send(results);
    } catch (error) {
      res.status(500).send("Database transaction/connection error");
    }
  } else {
    res.status(403).send("Not authorised");
  }
};

////////////////////////////////////////////////////////////
// Create Application
/////////////////////////////////////////////////////////
const createApplication = async (req, res, next) => {
  const myUsername = await checkValidUser(req);
  const isProjectLead = await checkGroup(myUsername, "project lead");
  if (myUsername && isProjectLead) {
    try {
      const {
        App_Acronym,
        App_Description,
        App_Rnumber,
        App_startDate,
        App_endDate,
        App_permit_create,
        App_permit_Open,
        App_permit_toDoList,
        App_permit_Doing,
        App_permit_Done,
      } = req.body;
      const sql =
        "INSERT INTO applications (App_Acronym, App_Description, App_Rnumber, App_startDate, App_endDate, App_permit_Create, App_permit_Open, App_permit_toDoList, App_permit_Doing, App_permit_Done) VALUES (?,?,?,?,?,?,?,?,?,?)";
      const queryArr = [
        App_Acronym,
        App_Description,
        App_Rnumber,
        App_startDate,
        App_endDate,
        App_permit_create,
        App_permit_Open,
        App_permit_toDoList,
        App_permit_Doing,
        App_permit_Done,
      ];
      const results = await dbQuery(sql, queryArr);
      res.status(200).send(results);
    } catch (error) {
      console.log(error);
      res.status(500).send("Database transaction/connection error");
    }
  } else {
    res.status(403).send("Not authorised");
  }
};

////////////////////////////////////////////////////////////
// Edit Application
/////////////////////////////////////////////////////////
const editApplication = async (req, res, next) => {
  const myUsername = await checkValidUser(req);
  console.log(myUsername);
  const isProjectLead = await checkGroup(myUsername, "project lead");
  console.log("isProjectLead", isProjectLead);
  if (myUsername && isProjectLead) {
    try {
      const {
        App_Acronym,
        App_Description,
        App_Rnumber,
        App_startDate,
        App_endDate,
        App_permit_create,
        App_permit_Open,
        App_permit_toDoList,
        App_permit_Doing,
        App_permit_Done,
      } = req.body;
      const sql =
        "UPDATE applications SET App_Description = ?, App_Rnumber = ?, App_startDate = ?, App_endDate = ?, App_permit_Create=?, App_permit_Open=?, App_permit_toDoList = ?, App_permit_Doing = ?, App_permit_Done = ? WHERE App_Acronym = ?";
      const queryArr = [
        App_Description,
        App_Rnumber,
        App_startDate,
        App_endDate,
        App_permit_create,
        App_permit_Open,
        App_permit_toDoList,
        App_permit_Doing,
        App_permit_Done,
        App_Acronym,
      ];
      const results = await dbQuery(sql, queryArr);
      res.status(200).send(results);
    } catch (error) {
      res.status(500).send("Database transaction/connection error");
    }
  } else {
    res.status(403).send("Not authorised");
  }
};

exports.applicationsController = {
  getAllApplication,
  createApplication,
  editApplication,
  //getApplicationByAcronym,
};
