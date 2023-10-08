const { dbQuery } = require("../config/dbConfig");
const jwt = require("jsonwebtoken");
var moment = require("moment"); // require
var nodemailer = require("nodemailer");

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

const getAuthorisedUserGrp = async (acronym, taskState) => {
  try {
    const sql =
      "SELECT App_Permit_Create, App_Permit_Open, App_Permit_ToDoList, App_Permit_Doing, App_Permit_Done FROM applications WHERE App_Acronym = ?";
    const queryArr = [acronym];
    const results = await dbQuery(sql, queryArr);

    if (results.length > 0) {
      const {
        App_Permit_Create,
        App_Permit_Open,
        App_Permit_ToDoList,
        App_Permit_Doing,
        App_Permit_Done,
      } = results[0];

      const stateAndUserGrpOwner = {
        create: App_Permit_Create,
        open: App_Permit_Open,
        todolist: App_Permit_ToDoList,
        doing: App_Permit_Doing,
        done: App_Permit_Done,
      };

      return stateAndUserGrpOwner[taskState];
    } else {
      return null;
    }
  } catch (error) {
    console.log("error");
    return null;
  }
};

////////////////////////////////////////////////////////////
// Send Email
/////////////////////////////////////////////////////////
const emailProjectLead = async () => {
  const sql = "SELECT username,email,usergroup FROM useraccounts";
  const queryArr = [];

  const sendEmail = (plEmail, plName) => {
    var transport = nodemailer.createTransport({
      host: process.env.SERVER_HOST,
      port: process.env.SERVER_PORT,
      auth: {
        user: process.env.SERVER_USER,
        pass: process.env.SERVER_PASS,
      },
    });

    var mailOptions = {
      from: "system@tms.com",
      to: plEmail,
      subject: "[For Approval] Task is done",
      text: `Dear ${plName}, a task is done and submitted for your approval.`,
    };

    transport.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  };

  try {
    const results = await dbQuery(sql, queryArr);
    // From the array of object (each user), find Project Lead and send email
    results.forEach((res) => {
      if (res.usergroup.toLowerCase().split(",").includes("project lead")) {
        sendEmail(res.email, res.username);
      }
    });
  } catch (error) {}
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
// Create Task and Increment Running Number of App
/////////////////////////////////////////////////////////
const createTask = async (req, res, next) => {
  const myUsername = await checkValidUser(req);

  if (myUsername) {
    const {
      Task_name,
      Task_description,
      Add_task_notes,
      Task_id,
      Task_plan,
      Task_app_Acronym,
      Task_state,
      Task_creator,
      Task_owner,
      Task_createDate,
    } = req.body;

    // Check App Permit of the task state and check if username is part of task owner
    const authorisedUserGrp = await getAuthorisedUserGrp(
      Task_app_Acronym,
      "create"
    );
    const isPermitted = await checkGroup(myUsername, authorisedUserGrp);

    if (isPermitted) {
      if (Task_name && Task_description && Task_app_Acronym && Task_id) {
        try {
          // Add timestamp and other details to task note
          const timeStamp = moment(new Date()).format("YYYY-MM-DD h:mmA");
          const currentNote = `${timeStamp}\nUser: ${myUsername}\nTask State: ${Task_state}\nAction: Created Task\nTask Note:\n${
            Add_task_notes ?? ""
          }`;
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
          // update App RN
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
        } catch (error) {
          console.log(error);
          res.status(500).send("Database transaction/connection error");
        }
      } else {
        res.status(404).send("Invalid Request due to missing parameters");
      }
    } else {
      console.log("Not Task Owner");
      res.status(403).send("Not Permitted");
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
    if (Task_id) {
      try {
        const sql = "SELECT * FROM tasks WHERE Task_id = ?";
        const queryArr = [Task_id];
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
      res.status(404).send("Invalid Request due to missing parameters");
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
    const { Task_id, Add_Task_Notes, Task_plan } = req.body;
    let currentTaskState;

    if (Task_id) {
      try {
        const sql =
          "SELECT Task_state, Task_notes, Task_app_Acronym, Task_plan FROM tasks WHERE Task_id = ?";
        const queryArr = [Task_id];
        const results = await dbQuery(sql, queryArr);
        if (results.length > 0) {
          // From Task State Array, find index and progress to the next state
          currentTaskState = results[0].Task_state;
          const taskStateArr = ["open", "todolist", "doing", "done", "closed"];
          const taskStateArrIndex = taskStateArr.indexOf(currentTaskState);
          const newTaskState = taskStateArr[taskStateArrIndex + 1];

          // Check App Permit of the task state and check if username is part of task owner
          const authorisedUserGrp = await getAuthorisedUserGrp(
            results[0].Task_app_Acronym,
            currentTaskState
          );
          const isPermitted = await checkGroup(myUsername, authorisedUserGrp);

          if (isPermitted) {
            if (taskStateArrIndex < taskStateArr.length - 1) {
              // Check if there is a change of plan when promoting
              if (Task_plan === results[0].Task_plan) {
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

                  const queryArr = [
                    newTaskState,
                    myUsername,
                    mergedNote,
                    Task_id,
                  ];
                  const resultsUpdate = await dbQuery(sql, queryArr);
                  if (resultsUpdate) {
                    if (newTaskState === "done") {
                      console.log("Try to email PL");
                      emailProjectLead();
                    }
                    res.status(200).send(newTaskState);
                  }
                } catch (error) {
                  console.log(error);
                  res.status(500).send("Database transaction/connection error");
                }
              } else {
                res.status(403).send("Unable to change plan");
              }
            } else {
              res.status(403).send("Unable to promote state further");
            }
          } else {
            console.log("Not Task Owner");
            res.status(403).send("Not Permitted");
          }
        } else {
          res.status(404).send("Task record not found");
        }
      } catch (error) {
        console.log(error);
        res.status(500).send("Database transaction/connection error");
      }
    } else {
      res.status(404).send("Invalid Request due to missing parameters");
    }
  } else {
    res.status(403).send("Not authorised");
  }
};

////////////////////////////////////////////////////////////
// Demote Task - Drop Task State By 1 Tier and Add Note
/////////////////////////////////////////////////////////
const demoteTask = async (req, res, next) => {
  const myUsername = await checkValidUser(req);

  // TOOO: Add checkgroup is PL
  if (myUsername) {
    const { Task_id, Add_Task_Notes, Task_plan } = req.body;
    let currentTaskState;

    if (Task_id) {
      try {
        const sql =
          "SELECT Task_state, Task_notes,Task_app_Acronym FROM tasks WHERE Task_id = ?";
        const queryArr = [Task_id];
        const results = await dbQuery(sql, queryArr);
        if (results.length > 0) {
          // From Task State Array, find index and progress to the next state
          currentTaskState = results[0].Task_state;
          const taskStateArr = ["open", "todolist", "doing", "done", "closed"];
          const taskStateArrIndex = taskStateArr.indexOf(currentTaskState);
          const newTaskState = taskStateArr[taskStateArrIndex - 1];

          // Check App Permit of the task state and check if username is part of task owner
          const authorisedUserGrp = await getAuthorisedUserGrp(
            results[0].Task_app_Acronym,
            currentTaskState
          );
          const isPermitted = await checkGroup(myUsername, authorisedUserGrp);

          if (isPermitted) {
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
                  "UPDATE tasks SET Task_state = ?, Task_owner = ?, Task_notes = ?, Task_plan = ? WHERE (Task_id = ?)";
                const queryArr = [
                  newTaskState,
                  myUsername,
                  mergedNote,
                  Task_plan,
                  Task_id,
                ];
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
            console.log("Not Task Owner");
            res.status(403).send("Not Permitted");
          }
        } else {
          res.status(404).send("Task record not found");
        }
      } catch (error) {
        console.log(error);
        res.status(500).send("Database transaction/connection error");
      }
    } else {
      res.status(404).send("Invalid Request due to missing parameters");
    }
  } else {
    res.status(403).send("Not authorised");
  }
};

////////////////////////////////////////////////////////////
// Add Task Notes
/////////////////////////////////////////////////////////
const addTaskNotes = async (req, res, next) => {
  const myUsername = await checkValidUser(req);
  if (myUsername) {
    const { Add_Task_Notes, Task_id } = req.body;

    try {
      // Query db to get task state and existing notes to add on
      const sql =
        "SELECT Task_state, Task_notes, Task_app_Acronym FROM tasks WHERE Task_id = ?";
      const queryArr = [Task_id];
      const results = await dbQuery(sql, queryArr);
      if (results.length > 0) {
        // Generate task details and add on to existing note
        const currentTaskState = results[0].Task_state;

        // Check App Permit of the task state and check if username is part of task owner
        const authorisedUserGrp = await getAuthorisedUserGrp(
          results[0].Task_app_Acronym,
          currentTaskState
        );
        const isPermitted = await checkGroup(myUsername, authorisedUserGrp);
        if (isPermitted) {
          // Add Username and Task state to task note
          const oldNotes = results[0].Task_notes;
          const timeStamp = moment(new Date()).format("YYYY-MM-DD h:mmA");
          const currentNote = `${timeStamp}\nUser: ${myUsername}\nTask State: ${currentTaskState}\nAction: Add Note\nTask Note:\n${
            Add_Task_Notes ?? ""
          }`;
          const mergedNote = `${currentNote}\n\n\n${oldNotes}`;
          try {
            // Update to db
            const sql =
              "UPDATE tasks SET Task_notes = ?, Task_owner = ? WHERE Task_id = ?";
            const queryArr = [mergedNote, myUsername, Task_id];
            const resultsUpdate = await dbQuery(sql, queryArr);
            res.status(200).send(resultsUpdate);
          } catch (error) {
            console.log(error);
            res.status(500).send("Database transaction/connection error");
          }
        } else {
          res.status(403).end("Not permitted");
        }
      }
    } catch (err) {
      res.status(404).send("Task not found");
    }
  } else {
    res.status(403).send("Not authorised");
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

exports.tasksController = {
  getAllTasksByAcronym,
  createTask,
  getTaskById,
  promoteTask,
  demoteTask,
  addTaskNotes,
  getAllTask, // not in use by frontend
  editTask, // not in use by frontend
};
