const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createPool({
  host: "localhost",
  user: "root",
  password: process.env.DB_PASSWORD,
  database: "kanban",
});

const dbQuery = (sql, queryArr) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, queryArr, (error, results) => {
      if (error) {
        return reject(error);
      }
      return resolve(results);
    });
  });
};

module.exports = { connection: connection, dbQuery: dbQuery };
