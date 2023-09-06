const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const mysql = require("mysql2");

const app = express();
app.use(express.json());
const port = 8080;

// create the connection to database
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "pass",
  database: "kanban",
});

// Inititalize the app and add middleware
app.use(bodyParser.urlencoded({ extended: true })); // Setup the body parser to handle form submits
app.use(session({ secret: "super-secret" })); // Session setup

//TODO catchasyncerror
// TODO JWT
// TODO Protected Route

/** Handle login display and form submit */
app.post("/login", (req, res) => {
  // with placeholder
  let { username, password } = req.body;
  console.log(req.body);
  console.log("post");

  if (username && password) {
    connection.query(
      "SELECT * FROM useraccounts WHERE username = ? AND password = ?",
      [username, password],
      function (err, results) {
        res.send(results);
      }
    );
  }
});

//Todo
/** Handle user creation */
app.post("/register", (req, res) => {
  // with placeholder
  let { username, password, email } = req.body;
  console.log(req.body);
  console.log("post");

  if (username && password) {
    connection.query(
      "INSERT INTO useraccounts (username, password, email, active) VALUES (?,?,?,?)",
      [username, password, email, true],
      function (err, results) {
        res.send(results);
      }
    );
  }
});

/** For testing */
app.get("/login", (req, res) => {
  // with placeholder
  connection.query(
    "SELECT * FROM useraccounts",
    ["username", "password"],
    function (err, results) {
      res.send(results);
    }
  );
});

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
