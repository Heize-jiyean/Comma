const express = require('express');
const mysql = require('mysql2/promise');
const methodOverride = require("method-override");
const app = express();
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
      return db; // 연결된 데이터베이스 객체 반환
  } catch (error) {
      console.error("데이터베이스 연결 오류:", error);
      throw error;
  }
};
// Firebase SDK 설정
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');  // 서비스 계정 키 파일의 경로
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


// EJS 설정
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// 정적 파일 제공
app.use(express.static(__dirname + '/public'));

app.use(methodOverride("_method"));


app.get('/', (req, res) => {
  // 임시로 user 변수를 null로 설정함
  const user = null;
  res.render('main', { user });
});

//router
const diaryRouter = require('./routers/diaryRouter');
app.use("/diary", diaryRouter);


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});