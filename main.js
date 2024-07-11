const express = require('express');
const app = express();
const layouts = require("express-ejs-layouts");//모듈 설치
const mysql = require('mysql2/promise');
const port = 3000;

// DB connection
require('dotenv').config();
exports.connection = async () => {
  try {
      const db = await mysql.createPool({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PW,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME,
          waitForConnections: true,
          insecureAuth: true,
      });
      return db;
  } catch (error) {
      console.error("데이터베이스 연결 오류:", error);
      throw error;
  }
};

// EJS 설정
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// 정적 파일 제공
app.use(express.static(__dirname + '/public'));

//layouts 사용
app.use(layouts);

// 페이지 라우팅
app.get('/', (req, res) => {
  // 임시로 user 변수를 null로 설정함
  const user = null;
  res.render('main', { user });
});

const profileRouter = require('./routers/profileRouter');
app.use('/profile', profileRouter);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});