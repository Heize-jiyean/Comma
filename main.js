const express = require('express');
const app = express();
const path = require('path');
const port = 3000;

// EJS 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// user 변수 설정을 위한 미들웨어
app.use((req, res, next) => {
  res.locals.user = null; // 현재는 항상 null로 설정
  next();
});

// 라우트 설정
app.get('/', (req, res) => {
  res.render('main');
});

app.get('/auth/login', (req, res) => {
  res.render('login/login');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});