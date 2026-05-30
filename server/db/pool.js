const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:              process.env.DB_HOST     || 'localhost',
  port:              parseInt(process.env.DB_PORT) || 3306,
  database:          process.env.DB_NAME     || 'mustashar_db',
  user:              process.env.DB_USER     || 'mustashar_user',
  password:          process.env.DB_PASS     || '',
  charset:           process.env.DB_CHARSET  || 'utf8mb4',
  waitForConnections: true,
  connectionLimit:   10,
  queueLimit:        0,
  timezone:          '+03:00'
});

module.exports = pool;
