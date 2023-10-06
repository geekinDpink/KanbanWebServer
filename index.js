const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const config = require("./config/config");
const cors = require("cors");

const { usergroupsController } = require("./controller/usergroupsController");
const { usersController } = require("./controller/usersController");
const {
  applicationsController,
} = require("./controller/applicationsController");
const { plansController } = require("./controller/plansController");
const { tasksController } = require("./controller/tasksController");

require("dotenv").config();

const router = express.Router();
const port = config.port;

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" }));
app.use(bodyParser.urlencoded({ extended: true })); // Parse json in HTTP Request bodies from URL

//////////////////////////////
// Users
//////////////////////////////
router.route("/login").post(usersController.findUser);
router.route("/register").post(usersController.registerNewUser); // admin only
router.route("/users").put(usersController.updateUserDetails);
router.route("/users").post(usersController.getAllUser); // admin only
router.route("/user").get(usersController.getMyUser);
router.route("/user").post(usersController.getUserById); // admin only
router.route("/user/auth").get(usersController.checkValidUserAndIsAdmin); // check valid user and isAdmin
router.route("/user/permits").post(usersController.checkPermit);

/////////////////////////////////
// Usergroups
////////////////////////////////
router.route("/usergroups").get(usergroupsController.getAllUserGroups);
router.route("/usergroups").post(usergroupsController.createUserGroup); // admin only

/////////////////////////////////
// Applications
////////////////////////////////
router.route("/apps").get(applicationsController.getAllApplication);
router.route("/app/acronym").post(applicationsController.getAppByAcronym);
router.route("/app").post(applicationsController.createApplication);
router.route("/app").put(applicationsController.editApplication);

/////////////////////////////////
// Plan
////////////////////////////////
router.route("/plan").post(plansController.createPlan);
router.route("/plans/acronym").post(plansController.getAllPlans);
router
  .route("/plan/acronym/name")
  .post(plansController.getPlanByAcronymAndName);
router.route("/plan/acronym/name").put(plansController.editPlan);

/////////////////////////////////
// Task
////////////////////////////////
router.route("/tasks").get(tasksController.getAllTask);
router.route("/tasks/acronym").post(tasksController.getAllTasksByAcronym);
router.route("/task").post(tasksController.createTask);
router.route("/task").put(tasksController.editTask);
router.route("/task/note").post(tasksController.addTaskNotes);
router.route("/task/id").post(tasksController.getTaskById);
router.route("/task/promote").put(tasksController.promoteTask);
router.route("/task/demote").put(tasksController.demoteTask);

app.use(router);

/** App listening on port */
app.listen(port, () => {
  console.log(usergroupsController);

  console.log(`Kanban Web Server listening at http://localhost:${port}`);
});

/** V1 - Using Router.htmlrequest() in the same file*/
// let getUserGrps = router.get("/usergroups", (req, res) => {
//   // find user by username
//   let getAllUserGroups = (res) => {
//     connection.query("SELECT * FROM usergroups", function (err, results) {
//       if (err) {
//         res.status(500).json(err);
//       } else {
//         res.send(results);
//       }
//     });
//   };
//   getAllUserGroups(res);
// });
// app.use(getUserGrps);

/*V2 - Using Router.route and app.use in the same file*/
// const getAllUserGroups = (req, res, next) => {
//   let getAllUserGroups = (res) => {
//     connection.query("SELECT * FROM usergroups", function (err, results) {
//       if (err) {
//         res.status(500).json(err);
//       } else {
//         res.send(results);
//       }
//     });
//   };
//   getAllUserGroups(res);
// };

// app.use(getAllUserGroups);

// router.route("/usergroups").get(getAllUserGroups);

/*V3 Refactoring the middleware*/
// router.route("/food").get((req, res, next) => {
//   connection.query("SELECT * FROM usergroups", function (err, results) {
//     if (err) {
//       res.status(500).json(err);
//     } else {
//       res.send(results);
//     }
//   });
// });

// app.use(router);
