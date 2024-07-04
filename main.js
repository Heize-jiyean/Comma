const express = require('express');
const app = express();
const port = 3000;

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