const { dbQuery } = require("../config/dbConfig");
const jwt = require("jsonwebtoken");

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
      queryArr = [verifyJWTRes.username];
    } catch (error) {
      console.log("token not verify");
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
        return null;
      }
    } catch (error) {
      return null;
    }
  } else {
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
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  } else {
    return false;
  }
};

////////////////////////////////////////////////////////////
// Create Plan
/////////////////////////////////////////////////////////
const createPlan = async (req, res, next) => {
  const myUsername = await checkValidUser(req);
  const isProjectManager = await checkGroup(myUsername, "project manager");

  if (myUsername && isProjectManager) {
    try {
      const {
        Plan_MVP_name,
        Plan_startDate,
        Plan_endDate,
        Plan_app_Acronym,
        Plan_color,
      } = req.body;

      const sql =
        "INSERT INTO plans (Plan_MVP_name, Plan_startDate, Plan_endDate, Plan_app_Acronym, Plan_color) VALUES (?,?,?,?,?)";
      const queryArr = [
        Plan_MVP_name,
        Plan_startDate ? Plan_startDate : null,
        Plan_endDate ? Plan_endDate : null,
        Plan_app_Acronym,
        Plan_color,
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
// Get All Plans By Acronym
/////////////////////////////////////////////////////////
const getAllPlans = async (req, res, next) => {
  const myUsername = await checkValidUser(req);

  if (myUsername) {
    try {
      const { Plan_app_Acronym } = req.body;
      const sql = "SELECT * FROM plans WHERE Plan_app_Acronym = ?";
      const queryArr = [Plan_app_Acronym];
      const results = await dbQuery(sql, queryArr);
      if (results.length > 0) {
        res.status(200).send(results);
      } else {
        res.status(404).send("Mo plan found");
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Database transaction/connection error");
    }
  } else {
    res.status(403).send("Not authorised");
  }
};

////////////////////////////////////////////////////////////
// Get Plan By Acronym and Name
/////////////////////////////////////////////////////////
const getPlanByAcronymAndName = async (req, res, next) => {
  const myUsername = await checkValidUser(req);

  if (myUsername) {
    try {
      const { Plan_app_Acronym, Plan_MVP_name } = req.body;
      const sql =
        "SELECT * FROM plans WHERE Plan_app_Acronym = ? AND Plan_MVP_name = ?";
      const queryArr = [Plan_app_Acronym, Plan_MVP_name];
      const results = await dbQuery(sql, queryArr);
      if (results.length > 0) {
        res.status(200).send(results);
      } else {
        res.status(404).send("No plan found");
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Database transaction/connection error");
    }
  } else {
    res.status(403).send("Not authorised");
  }
};

exports.plansController = {
  createPlan,
  getAllPlans,
  getPlanByAcronymAndName,
};
