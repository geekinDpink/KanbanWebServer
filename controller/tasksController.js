const { dbQuery } = require("../config/dbConfig");
const jwt = require("jsonwebtoken");
var moment = require("moment"); // require

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
// Get All Task
/////////////////////////////////////////////////////////
const getAllTask = async (req, res, next) => {
  const myUsername = await checkValidUser(req);
  if (myUsername) {
    try {
      const sql = "SELECT * FROM tasks";
      const queryArr = [];
      const results = await dbQuery(sql, queryArr);

      if (results.length > 0) {
        res.status(200).send(results);
      } else {
        res.status(404).send("No record found");
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
// Get All Tasks By App Acronym
/////////////////////////////////////////////////////////
const getAllTasksByAcronym = async (req, res, next) => {
  const myUsername = await checkValidUser(req);
  if (myUsername) {
    try {
      const { Task_app_Acronym } = req.body;
      const sql = "SELECT * FROM tasks WHERE Task_app_Acronym = ?";
      const queryArr = [Task_app_Acronym];
      const results = await dbQuery(sql, queryArr);

      if (results.length > 0) {
        res.status(200).send(results);
      } else {
        res.status(404).send("No record found");
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
// Create Task
/////////////////////////////////////////////////////////
const createTask = async (req, res, next) => {
  const myUsername = await checkValidUser(req);
  // TOOO: Add checkgroup is PL
  if (myUsername) {
    const {
      Task_name,
      Task_description,
      Task_notes,
      Task_id,
      Task_plan,
      Task_app_Acronym,
      Task_state,
      Task_creator,
      Task_owner,
      Task_createDate,
    } = req.body;
    try {
      // Add Username and Task state to task note
      const currentNote = `${new Date()}\nUsername: ${myUsername}\nTask State: ${Task_state}\nTask Note:\n${Task_notes}`;

      const sql =
        "INSERT INTO tasks (Task_name, Task_description, Task_notes, Task_id, Task_plan, Task_app_Acronym, Task_state, Task_creator, Task_owner, Task_createDate) VALUES (?,?,?,?,?,?,?,?,?,?)";

      const queryArr = [
        Task_name,
        Task_description,
        currentNote,
        Task_id,
        Task_plan,
        Task_app_Acronym,
        Task_state,
        Task_creator,
        Task_owner,
        Task_createDate,
      ];
      const results = await dbQuery(sql, queryArr);
      // res.status(200).send(results);
    } catch (error) {
      console.log(error);
      res.status(500).send("Database transaction/connection error");
    }

    try {
      const { Task_app_Acronym } = req.body;
      const sql =
        "UPDATE applications SET APP_Rnumber = APP_Rnumber+1 WHERE APP_ACRONYM = ?";
      const queryArr = [Task_app_Acronym];
      const results2 = await dbQuery(sql, queryArr);
      res.status(200).send(results2);
    } catch (error) {
      res.status(500).send("Database transaction/connection error");
    }
  } else {
    res.status(403).send("Not authorised");
  }
};

////////////////////////////////////////////////////////////
// Get Task By TaskId
/////////////////////////////////////////////////////////
const getTaskById = async (req, res, next) => {
  const myUsername = await checkValidUser(req);

  if (myUsername) {
    const { Task_id } = req.body;
    try {
      const sql = "SELECT * FROM tasks WHERE Task_id = ?";
      const queryArr = [Task_id];
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
// Edit Task
/////////////////////////////////////////////////////////
const editTask = async (req, res, next) => {
  const myUsername = await checkValidUser(req);
  if (myUsername) {
    const {
      Task_name,
      Task_description,
      Task_notes,
      Task_id,
      Task_plan,
      Task_app_Acronym,
      Task_state,
      Task_creator,
      Task_owner,
      Task_createDate,
    } = req.body;
    try {
      const sql =
        "UPDATE tasks SET Task_name = ?, Task_description = ?, Task_notes = ?, Task_plan = ?, Task_app_Acronym = ?, Task_state = ?, Task_creator = ?, Task_owner = ?, Task_createDate = ? WHERE (Task_id = ?)";

      const queryArr = [
        Task_name,
        Task_description,
        Task_notes,
        Task_plan,
        Task_app_Acronym,
        Task_state,
        Task_creator,
        Task_owner,
        Task_createDate,
        Task_id,
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
// Promote Task - Advance Task State By 1 Tier and Add Note
/////////////////////////////////////////////////////////
const promoteTask = async (req, res, next) => {
  const myUsername = await checkValidUser(req);

  // TOOO: Add checkgroup is PL
  if (myUsername) {
    const { Task_id, Add_Task_Notes } = req.body;
    let currentTaskState;

    try {
      const sql = "SELECT Task_state, Task_notes FROM tasks WHERE Task_id = ?";
      const queryArr = [Task_id];
      const results = await dbQuery(sql, queryArr);
      if (results.length > 0) {
        // From Task State Array, find index and progress to the next state
        currentTaskState = results[0].Task_state;
        const taskStateArr = ["open", "todolist", "doing", "done", "closed"];
        const taskStateArrIndex = taskStateArr.indexOf(currentTaskState);
        const newTaskState = taskStateArr[taskStateArrIndex + 1];

        if (taskStateArrIndex < taskStateArr.length - 1) {
          // Add Username and Task state to task note
          const oldNotes = results[0].Task_notes;
          const timeStamp = moment(new Date()).format("YYYY-MM-DD h:mmA");
          const currentNote = `${timeStamp}\nUser: ${myUsername}\nTask State: ${currentTaskState}\nAction: Promote to ${newTaskState}\nTask Note:\n${
            Add_Task_Notes ?? ""
          }`;
          const mergedNote = `${currentNote}\n\n\n${oldNotes}`;
          try {
            const sql =
              "UPDATE tasks SET Task_state = ?, Task_owner = ?, Task_notes = ? WHERE (Task_id = ?)";

            const queryArr = [newTaskState, myUsername, mergedNote, Task_id];
            const resultsUpdate = await dbQuery(sql, queryArr);
            res.status(200).send(newTaskState);
          } catch (error) {
            console.log(error);
            res.status(500).send("Database transaction/connection error");
          }
        } else {
          res.status(403).send("Unable to promote state further");
        }
      } else {
        res.status(404).send("Task record not found");
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Database transaction/connection error");
    }
  }
};

////////////////////////////////////////////////////////////
// Demote Task - Drop Task State By 1 Tier and Add Note
/////////////////////////////////////////////////////////
const demoteTask = async (req, res, next) => {
  const myUsername = await checkValidUser(req);

  // TOOO: Add checkgroup is PL
  if (myUsername) {
    const { Task_id, Add_Task_Notes } = req.body;
    let currentTaskState;

    try {
      const sql = "SELECT Task_state, Task_notes FROM tasks WHERE Task_id = ?";
      const queryArr = [Task_id];
      const results = await dbQuery(sql, queryArr);
      if (results.length > 0) {
        // From Task State Array, find index and progress to the next state
        currentTaskState = results[0].Task_state;
        const taskStateArr = ["open", "todolist", "doing", "done", "closed"];
        const taskStateArrIndex = taskStateArr.indexOf(currentTaskState);
        const newTaskState = taskStateArr[taskStateArrIndex - 1];

        if (taskStateArrIndex > 0) {
          // Add Username and Task state to task note
          const oldNotes = results[0].Task_notes;
          const timeStamp = moment(new Date()).format("YYYY-MM-DD h:mmA");
          const currentNote = `${timeStamp}\nUser: ${myUsername}\nTask State: ${currentTaskState}\nAction: Demote to ${newTaskState}\nTask Note:\n${
            Add_Task_Notes ?? ""
          }`;
          const mergedNote = `${currentNote}\n\n\n${oldNotes}`;
          try {
            const sql =
              "UPDATE tasks SET Task_state = ?, Task_owner = ?, Task_notes = ? WHERE (Task_id = ?)";
            const queryArr = [newTaskState, myUsername, mergedNote, Task_id];
            const resultsUpdate = await dbQuery(sql, queryArr);
            res.status(200).send(newTaskState);
          } catch (error) {
            console.log(error);
            res.status(500).send("Database transaction/connection error");
          }
        } else {
          res.status(403).send("Unable to demote state further");
        }
      } else {
        res.status(404).send("Task record not found");
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Database transaction/connection error");
    }
  }
};

exports.tasksController = {
  getAllTask,
  getAllTasksByAcronym,
  createTask,
  getTaskById,
  editTask,
  promoteTask,
  demoteTask,
};
