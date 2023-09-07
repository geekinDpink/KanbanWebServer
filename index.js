const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const connection = require("./config/dbConfig");
const config = require("./config/config");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const saltRounds = config.saltRound; // return int as string

const app = express();
app.use(express.json());
const port = config.port;

// Inititalize the app and add middleware
app.use(bodyParser.urlencoded({ extended: true })); // Setup the body parser to handle form submits
app.use(session({ secret: "super-secret" })); // Session setup

// TODO catchasyncerror
// TODO Protected Route
// TODO Got token -> Sessionislogged on

/** Handle login display and form submit */
app.post("/login", (req, res) => {
  let { username, password } = req.body;

  if (username && password) {
    let findUser = async (username, pwd) => {
      // check if password matches db hash password and generate jwt as token {status, token}
      connection.query(
        "SELECT * FROM useraccounts WHERE username = ?",
        [username],
        function (err, results) {
          const { username: dbUser, password: dbPass } = results[0];
          bcrypt.compare(pwd, dbPass, function (err, isMatch) {
            if (isMatch) {
              // store username in token
              var token = jwt.sign({ data: dbUser }, process.env.JWT_SECRET);
              // results[0].token = token;
              // res.send(results);
              res.status(200).json({
                status: "success",
                token: token,
              });
            }
          });
        }
      );
    };
    findUser(username, password);
  }
});

//Todo
/** Handle user creation */
app.post("/register", (req, res) => {
  // with placeholder
  let { username, password, email, usergroup } = req.body;
  console.log("register", req.body);

  if (username && password) {
    // hash password and save to db
    let registerNewUser = async (
      pwd,
      saltRnd,
      username2,
      email2,
      usergroup2
    ) => {
      let hashpwd = await bcrypt.hash(pwd, saltRnd);
      connection.query(
        "INSERT INTO useraccounts (username, password, email, usergroup, active) VALUES (?,?,?,?,?)",
        [username2, hashpwd, email2, usergroup2, true],
        function (err, results) {
          res.send(results);
          console.log(err);
        }
      );
    };
    registerNewUser(password, saltRounds, username, email, usergroup);
  }
});

/** Full update based on username, instead of patch (partial) */
app.put("/users", (req, res) => {
  // with placeholder
  let { username, password, email, usergroup, myusergroup } = req.body;
  console.log("update user", req.body);

  // for admin, update all fields
  let updateUserAllDetails = async (
    pwd,
    saltRnd,
    email2,
    usergroup2,
    username2
  ) => {
    // hash password and save to db
    let hashpwd = await bcrypt.hash(pwd, saltRnd);
    connection.query(
      "UPDATE kanban.useraccounts SET password = ?, email = ?, usergroup = ?, active = ? WHERE username = ?",
      [hashpwd, email2, usergroup2, true, username2],
      function (err, results) {
        res.send(results);
        console.log(err);
      }
    );
  };

  // for user, update only the email and pass
  let updateUserDetails = async (pwd, saltRnd, email2, username2) => {
    // hash password and save to db
    let hashpwd = await bcrypt.hash(pwd, saltRnd);
    connection.query(
      "UPDATE kanban.useraccounts SET password = ?, email = ? WHERE username = ?",
      [hashpwd, email, username],
      function (err, results) {
        res.send(results);
        console.log(err);
      }
    );
  };

  // check if the user doing the updating is admin
  if (myusergroup === "admin") {
    updateUserAllDetails(password, saltRounds, email, usergroup, username);
  } else {
    updateUserDetails(password, saltRounds, email2, username2);
  }
});

/** Admin view all users*/
app.post("/users", (req, res) => {
  let { myusergroup } = req.body;

  // Find all users
  let getAllUser = async () => {
    connection.query("SELECT * FROM useraccounts", function (err, results) {
      res.send(results);
      console.log(err);
    });
  };

  // check if the user doing the updating is admin
  if (myusergroup === "admin") {
    getAllUser();
    console.log("isAdmin");
  } else {
    return res.status(401).end("User is not authorized"); // not authorized
  }
});

/** Admin find user by id */
app.post("/user", (req, res) => {
  let { username, myusergroup } = req.body;

  // find user by username
  let getUserById = async (username2) => {
    connection.query(
      "SELECT * FROM useraccounts WHERE username = ?",
      [username2],
      function (err, results) {
        res.send(results);
        console.log(err);
      }
    );
  };

  // check if the user doing the updating is admin
  if (myusergroup === "admin") {
    getUserById(username);
    console.log("isAdmin");
  } else {
    return res.status(401).end("User is not authorized"); // not authorized
  }
});

/** For testing */
// app.get("/login", (req, res) => {
//   // with placeholder
//   connection.query(
//     "SELECT * FROM useraccounts",
//     ["username", "password"],
//     function (err, results) {
//       res.send(results);
//     }
//   );
// });

// app.post("/login", (req, res) => {
//   const { username, password } = req.body;
//   if (username === "bob" && password === "1234") {
//     req.session.isLoggedIn = true;
//     res.redirect(req.query.redirect_url ? req.query.redirect_url : "/");
//   } else {
//     res.render("login", { error: "Username or password is incorrect" });
//   }
// });

// /** Handle logout function */
// app.get("/logout", (req, res) => {
//   req.session.isLoggedIn = false;
//   res.redirect("/");
// });

// /** Simulated bank functionality */
// app.get("/", (req, res) => {
//   res.render("index", { isLoggedIn: req.session.isLoggedIn });
// });

// app.get("/balance", (req, res) => {
//   if (req.session.isLoggedIn === true) {
//     res.send("Your account balance is $1234.52");
//   } else {
//     res.redirect("/login?redirect_url=/balance");
//   }
// });

// app.get("/account", (req, res) => {
//   if (req.session.isLoggedIn === true) {
//     res.send("Your account number is ACL9D42294");
//   } else {
//     res.redirect("/login?redirect_url=/account");
//   }
// });

// app.get("/contact", (req, res) => {
//   res.send("Our address : 321 Main Street, Beverly Hills.");
// });

/** App listening on port */
app.listen(port, () => {
  console.log(`MyBank app listening at http://localhost:${port}`);
});
