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
// Get All Application
/////////////////////////////////////////////////////////
const getAllApplication = async (req, res, next) => {
  const myUsername = await checkValidUser(req);
  if (myUsername) {
    try {
      const sql = "SELECT * FROM applications";
      const queryArr = [];
      const results = await dbQuery(sql, queryArr);

      // format start and end date to DD/MM/YYYY
      const formatRes = results.map((app) => {
        return {
          ...app,
          App_startDate: app.App_startDate?.toLocaleDateString(),
          App_endDate: app.App_endDate?.toLocaleDateString(),
        };
      });
      res.status(200).send(formatRes);
    } catch (error) {
      console.log(error);
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
        App_StartDate,
        App_EndDate,
        App_Permit_Create,
        App_Permit_Open,
        App_Permit_ToDoList,
        App_Permit_Doing,
        App_Permit_Done,
      } = req.body;
      const sql =
        "INSERT INTO applications (App_Acronym, App_Description, App_Rnumber, App_startDate, App_endDate, App_permit_Create, App_permit_Open, App_permit_toDoList, App_permit_Doing, App_permit_Done) VALUES (?,?,?,?,?,?,?,?,?,?)";
      const queryArr = [
        App_Acronym,
        App_Description,
        App_Rnumber,
        App_StartDate,
        App_EndDate,
        App_Permit_Create,
        App_Permit_Open,
        App_Permit_ToDoList,
        App_Permit_Doing,
        App_Permit_Done,
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
  const isProjectLead = await checkGroup(myUsername, "project lead");
  if (myUsername && isProjectLead) {
    try {
      const {
        App_Acronym,
        App_Description,
        App_Rnumber,
        App_StartDate,
        App_EndDate,
        App_Permit_Create,
        App_Permit_Open,
        App_Permit_ToDoList,
        App_Permit_Doing,
        App_Permit_Done,
      } = req.body;
      const sql =
        "UPDATE applications SET App_Description = ?, App_Rnumber = ?, App_startDate = ?, App_endDate = ?, App_permit_Create=?, App_permit_Open=?, App_permit_toDoList = ?, App_permit_Doing = ?, App_permit_Done = ? WHERE App_Acronym = ?";
      const queryArr = [
        App_Description,
        App_Rnumber,
        App_StartDate,
        App_EndDate,
        App_Permit_Create,
        App_Permit_Open,
        App_Permit_ToDoList,
        App_Permit_Doing,
        App_Permit_Done,
        App_Acronym,
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

exports.applicationsController = {
  getAllApplication,
  createApplication,
  editApplication,
};
