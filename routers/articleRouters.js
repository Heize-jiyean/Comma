const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const bodyParser = require('body-parser');

router.use(express.json());
router.use(bodyParser.json());


router.get('/new', articleController.new);
router.post('/register', articleController.register);

router.get('/', articleController.list);
router.get('/:articleId', articleController.view);
router.delete('/:articleId', articleController.delete);

// 좋아요 등록
router.post("/like", articleController.toggleLike);
// 북마크 등록
router.post("/bookmark", articleController.toggleBookmark);


module.exports = router;
