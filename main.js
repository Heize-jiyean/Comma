require('dotenv').config();
console.log('Loaded env vars:', process.env); //환경변수확인

const express = require('express');
const mysql = require('mysql2/promise');
const methodOverride = require("method-override");
const app = express();
const path = require('path');
const session = require('express-session');
const port = 3000;
const bodyParser = require('body-parser');
const layouts = require("express-ejs-layouts");

// 지도 API 미들웨어
app.use((req, res, next) => {
  res.locals.naverMapClientId = process.env.NAVER_MAP_CLIENT_ID;
  next();
});

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

// Firebase SDK 설정
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');  // 서비스 계정 키 파일의 경로
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// DB connection
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
app.set('views', path.join(__dirname, 'views'));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// express.json() 미들웨어 추가
app.use(express.json());

// form 데이터 파싱 설정
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 로깅 미들웨어 추가
app.use((req, res, next) => {
  console.log(`Received request: ${req.method} ${req.originalUrl}`);
  next();
});


// user 변수 설정을 위한 미들웨어 (통합)
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

//네이버 지도 API 클라이언트 ID를 res.locals에 설정
app.use((req, res, next) => {
  res.locals.naverMapClientId = process.env.NAVER_MAP_CLIENT_ID;
  next();
});

app.use(methodOverride("_method"));

//layouts 사용
app.use(layouts);

// 페이지 라우팅
app.get('/', (req, res) => {
  res.render('main');
});

// 라우트 설정
const authRouter = require('./routers/authRouters');
app.use("/auth", authRouter);

const profileRouter = require('./routers/profileRouter');
app.use('/profile', profileRouter);

const diaryRouter = require('./routers/diaryRouter');
app.use("/diary", diaryRouter);

const guestbookRouter = require('./routers/guestbookRouter');
app.use("/guestbook", guestbookRouter);

const hospitalRouter = require('./routers/hospitalRouters');
app.use("/hospital", hospitalRouter);

// 404 에러 핸들러
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', message: 'The requested resource was not found.' });
});

// 오류 처리 미들웨어
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  console.log('Final check NAVER_MAP_CLIENT_ID:', process.env.NAVER_MAP_CLIENT_ID);
});