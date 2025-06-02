var mysql = require("mysql");
require("dotenv").config();

const config = {
  connectionLimit: 4,
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'recipes',
};
const pool = new mysql.createPool(config);

const connection = () => {
  return new Promise((resolve, reject) => {
   pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error getting connection from pool:", err); 
    reject(err);
    return;
  }
  if (!connection) {
    console.error("No connection returned from pool!");
    reject(new Error("No connection object"));
    return;
  }
  console.log("MySQL pool connected: threadId " + connection.threadId);
      const query = (sql, binding) => {
        return new Promise((resolve, reject) => {
          connection.query(sql, binding, (err, result) => {
            if (err) reject(err);
            resolve(result);
          });
        });
      };
      const release = () => {
        return new Promise((resolve, reject) => {
          if (err) reject(err);
          console.log("MySQL pool released: threadId " + connection.threadId);
          resolve(connection.release());
        });
      };
      resolve({ query, release });
    });
  });
};
const query = (sql, binding) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, binding, (err, result, fields) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};
module.exports = { pool, connection, query };