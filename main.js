require('dotenv').config();
console.log('Loaded env vars:', process.env); //환경변수확인

const express = require('express');
const mysql = require('mysql2/promise');
const methodOverride = require("method-override");
const app = express();
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const port = 3000;
const bodyParser = require('body-parser');
const layouts = require("express-ejs-layouts");
const cors = require('cors');

// 로깅 미들웨어 추가
app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.url);
  next();
});

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
      console.log('Database connected successfully');
      return db; // 연결된 데이터베이스 객체 반환
  } catch (error) {
      console.error("데이터베이스 연결 오류:", error);
      throw error;
  }
};

// Session store 설정
const options = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PW,
  database: process.env.DB_NAME
};

const sessionStore = new MySQLStore(options);

// session 설정
app.use(session({
  key: 'session_cookie_name',
  secret: process.env.SECRET_KEY || 'fallback_secret_key',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // HTTPS를 사용하는 경우에만 true로 설정
    maxAge: 5 * 60 * 60 * 1000 // 5시간
  }
}));

// Firebase SDK 설정
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');  // 서비스 계정 키 파일의 경로
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount), 
  storageBucket: 'comma-5a85c.appspot.com'
});

// CORS 미들웨어 설정
const corsOptions = {
  origin: 'http://localhost:3000', // 클라이언트 도메인
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

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

// user 변수 설정을 위한 미들웨어 (통합)
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// 테스트 : 세션 확인
app.get('/session-data', (req, res) => {
  if (req.session.user) {
      res.json({
          message: '세션 데이터가 있습니다.',
          user: req.session.user
      });
  } else {
      res.json({
          message: '세션 데이터가 없습니다.'
      });
  }
});

app.use(methodOverride("_method"));

//layouts 사용
app.use(layouts);

// 메인페이지 설정
const mainController = require('./controllers/mainController');
app.get('/', (req, res) => {
  if (req.session.user) {
    if (req.session.user.role === 'patient') mainController.main_patient(req, res);
    else if (req.session.user.role === 'counselor') mainController.main_counselor(req, res);
  } 
  else mainController.main(req, res); // 사용자가 로그인하지 않았을 경우
});

// 라우트 설정
const authRouter = require('./routers/authRouters');
app.use("/auth", (req, res, next) => {
  console.log("Auth route accessed:", req.method, req.url);
  next();
}, authRouter);

const profileRouter = require('./routers/profileRouter');
app.use('/profile', profileRouter);

const diaryRouter = require('./routers/diaryRouter');
app.use("/diary", diaryRouter);

const guestbookRouter = require('./routers/guestbookRouter');
app.use("/guestbook", guestbookRouter);

const hospitalRouter = require('./routers/hospitalRouters');
app.use("/hospital", hospitalRouter);

const articleRouter = require('./routers/articleRouters');
app.use("/article", articleRouter);

// 404 에러 핸들러
app.use((req, res, next) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({ error: 'Not Found', message: 'The requested resource was not found.' });
});

// 오류 처리 미들웨어
//app.use((err, req, res, next) => {
 // console.error('Error:', err);
  //res.status(500).json({ error: 'Internal Server Error', message: err.message });
//});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.name || 'Internal Server Error', 
    message: err.message || 'An unexpected error occurred',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  console.log('Final check NAVER_MAP_CLIENT_ID:', process.env.NAVER_MAP_CLIENT_ID);
});

// 클라이언트 측 JavaScript를 위한 코드 (로그아웃 기능)
app.use(express.static('public'));