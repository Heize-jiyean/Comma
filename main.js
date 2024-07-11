const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const port = 3000;
const bodyParser = require('body-parser');
const layouts = require("express-ejs-layouts");

require('dotenv').config();

// DB 연결
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
          connectionLimit: 30,
          queueLimit: 10
      });
      return db; // 연결된 데이터베이스 객체 반환
  } catch (error) {
      console.error("데이터베이스 연결 오류:", error);
      throw error;
  }
};

// session 설정
app.use(session({
  secret: process.env.SECRET_KEY || 'fallback_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// EJS 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

//layouts 사용
app.use(layouts);

// form 데이터 파싱 설정
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// user 변수 설정을 위한 미들웨어 (통합)
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// 라우트 설정
const authRouter = require('./routers/authRouters');

app.get('/', (req, res) => {
  res.render('main');
});

app.use("/auth", authRouter);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});