const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PASSWORD, // 환경변수에서 비밀번호를 읽음
  database: 'eyewear_db'
});

module.exports = pool;
