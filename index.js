const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const config = require("./config/config");
const cors = require("cors");

const { verifyToken } = require("./middleware/auth");
const { usergroupsController } = require("./controller/usergroupsController");
const { usersController } = require("./controller/usersController");

require("dotenv").config();

const router = express.Router();
const port = config.port;

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true })); // Setup the body parser to handle form submits

router.route("/login").post(usersController.findUser);
router.route("/register").post(usersController.registerNewUser);
router.route("/users").put(verifyToken, usersController.updateUserAllDetails);
router.route("/users").post(verifyToken, usersController.getAllUser);
router.route("/user").post(verifyToken, usersController.getUserById);

router
  .route("/usergroups")
  .get(verifyToken, usergroupsController.getAllUserGroups);

app.use(router);

/** App listening on port */
app.listen(port, () => {
  console.log(usergroupsController);

  console.log(`Kanban Web Server listening at http://localhost:${port}`);
});

/** V1 - Get all usergroups with router in the same file*/
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

/*V2 - Router.route and app.use*/
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

/*V3 route same file*/
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
