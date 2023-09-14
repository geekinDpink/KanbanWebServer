const { dbQuery } = require("../config/dbConfig");

// exports.usergroupsController = {
//   getAllUserGroups: (req, res, next) => {
//     let getAllUserGroups = (res) => {
//       connection.query("SELECT * FROM usergroups", function (err, results) {
//         if (err) {
//           res.status(500).json(err);
//         } else {
//           res.send(results);
//         }
//       });
//     };
//     res.status(500).json({
//       success: true,
//       data: getAllUserGroups(res),
//     });
//   },
// };

const getAllUserGroups = async (req, res, next) => {
  try {
    const sql = "SELECT * FROM usergroups";
    const queryArr = [];
    const results = await dbQuery(sql, queryArr);
    res.status(200).send(results);
  } catch (error) {
    res.status(500).json(error);
  }
};

const createUserGroup = async (req, res, next) => {
  const { usergroup } = req.body;
  const { currentUserGroup: myUserGroup } = req.currentUser;
  if (myUserGroup.includes("admin")) {
    if (usergroup) {
      try {
        const sql = "INSERT INTO usergroups (usergroup) VALUES (?)";
        const queryArr = [usergroup];
        const results = await dbQuery(sql, queryArr);
        res.status(200).send(results);
      } catch (error) {
        res.status(500).json(error);
      }
    } else {
      res.status(404).end("Invalid Request due to missing parameters");
    }
  } else {
    res.status(403).send("Not authorised");
  }
};

exports.usergroupsController = {
  getAllUserGroups: getAllUserGroups,
  createUserGroup: createUserGroup,
};
