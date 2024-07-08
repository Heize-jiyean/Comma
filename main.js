const express = require('express');
const app = express();
const session = require('express-session');
const dotenv = require('dotenv');
const port = 3000;

require('dotenv').config();

// session 설정
app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// EJS 설정
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// 정적 파일 제공
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  // 임시로 user 변수를 null로 설정함
  const user = null;
  res.render('main', { user });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});