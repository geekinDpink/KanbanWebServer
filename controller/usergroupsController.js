const connection = require("../config/dbConfig");

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

const getAllUserGroups = (req, res, next) => {
  connection.query("SELECT * FROM usergroups", function (err, results) {
    if (err) {
      res.status(500).json(err);
    } else {
      res.status(200).send(results);
    }
  });
};

exports.usergroupsController = {
  getAllUserGroups: getAllUserGroups,
};
