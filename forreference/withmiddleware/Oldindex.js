const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const config = require("./config/config");
const cors = require("cors");

const { verifyToken, getUserGrpAndVerifyActive } = require("./middleware/auth");
const { usergroupsController } = require("./controller/usergroupsController");
const { usersController } = require("./controller/usersController");

require("dotenv").config();

const router = express.Router();
const port = config.port;

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" }));
app.use(bodyParser.urlencoded({ extended: true })); // Parse json in HTTP Request bodies from URL

router.route("/login").post(usersController.findUser);
router
  .route("/register")
  .post(
    verifyToken,
    getUserGrpAndVerifyActive,
    usersController.registerNewUser
  ); // admin only
router
  .route("/users")
  .put(
    verifyToken,
    getUserGrpAndVerifyActive,
    usersController.updateUserDetails
  );
router
  .route("/users")
  .post(verifyToken, getUserGrpAndVerifyActive, usersController.getAllUser); // admin only
router
  .route("/user")
  .get(verifyToken, getUserGrpAndVerifyActive, usersController.getMyUser);
router
  .route("/user")
  .post(verifyToken, getUserGrpAndVerifyActive, usersController.getUserById); // admin only
router
  .route("/usergroups")
  .get(
    verifyToken,
    getUserGrpAndVerifyActive,
    usergroupsController.getAllUserGroups
  );
router
  .route("/usergroups")
  .post(
    verifyToken,
    getUserGrpAndVerifyActive,
    usergroupsController.createUserGroup
  ); // admin only
router.route("/user/usergroup").post(verifyToken, usersController.checkGroup);

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
