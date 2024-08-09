const AccessCheck = require('../utils/authUtils');
const ArticleModel = require('../models/Article');
const ArticleInteractionModel = require('../models/ArticleInteraction');
const UserModel = require('../models/User');
const JsonUtils = require('../utils/jsonUtils');
const fetch = require('node-fetch'); // node-fetch 모듈을 사용하여 fetch를 구현
const axios = require('axios');

function setDefaultImage(image_url) {
    if (image_url == null) image_url = "https://firebasestorage.googleapis.com/v0/b/comma-5a85c.appspot.com/o/images%2F%EC%8A%A4%ED%81%AC%EB%A6%B0%EC%83%B7%202024-07-10%20171637.png?alt=media&token=d979b5b3-0d0b-47da-a72c-2975caf52acd";
    return image_url;
}

exports.new = async (req, res) => {
    try {
        if (req.session.user) {
            if (!AccessCheck.checkCounselorRole(req.session.user.role)) {
                const referer = req.get('Referer') || '/';
                return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
            }

            const counselorId = req.session.user.id;
            res.render('article/new', {counselorId});
        }
        else return res.render("login/login");
    } catch (error) {
        console.error("newDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

exports.register = async (req, res) => {
    try {
        if (req.session.user) {
            if (!AccessCheck.checkCounselorRole(req.session.user.role)) {
                const referer = req.get('Referer') || '/';
                return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
            }
            const { articleData } = req.body;
            const savedArticleId = await ArticleModel.register(articleData);

            //추천 시스템 관련
            const response = await axios.post('http://localhost:5000/embedding', { sentence: articleData.title });
            const vectorResult = response.data;
            JsonUtils.addJson(0, savedArticleId, vectorResult)
            await axios.post('http://localhost:5000/similarity_article', { aid: savedArticleId, vector: vectorResult});

            return res.json({ success: true, redirect: `/article/${savedArticleId}` });
        }
        else return res.render("login/login");
    } catch (error) {
        console.error("registerDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

exports.view = async (req, res) => {
    try {
        const articleId = req.params.articleId;
        
        await ArticleModel.increasedViews(articleId); //조회수 증가


        const article = await ArticleModel.findById(articleId);
        const counselor = await UserModel.getCounselorByCounselorId(article.counselor_id); 

        let htmlContent = '';
        if (article.content) {
            // Firebase Storage에서 HTML 파일 가져오기
            const response = await fetch(article.content);
            if (!response.ok) {
                throw new Error(`Error fetching the file: ${response.statusText}`);
            }
            htmlContent = await response.text(); // HTML 콘텐츠 가져오기
        }

        let interaction = { liked: false, bookmarked: false };
        let userData = { role: null, id: null };
        if (req.session.user) {
            userData.role = req.session.user.role;
            userData.id = req.session.user.id;
            
            if (userData.role == 'patient') {
                if (await ArticleInteractionModel.findLikeByPatientAndArticle(articleId, userData.id) != null) interaction.liked = true;
                if (await ArticleInteractionModel.findBookmarkByPatientAndArticle(articleId, userData.id) != null) interaction.bookmarked = true;
            }
        }      

        res.render('article/view', { userData, article, counselor, htmlContent, interaction });
    } catch (error) {
        console.error("viewDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}


exports.delete = async (req, res) => {
    try {
        if (req.session.user) {
            const articleId = req.params.articleId;
            const article = await ArticleModel.findById(articleId); 
            
            if (!AccessCheck.checkCounselorId(req.session.user.role, req.session.user.id, article.counselor_id)) {
                const referer = req.get('Referer') || '/';
                return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
            } 
    
            // 스토리지 내용 삭제
            if (article.content) {
                // URL parsing
                const parsedUrl = new URL(article.content);
                const encodedFilePath = parsedUrl.pathname.split('/').pop();
                const filePath = decodeURIComponent(encodedFilePath);
    
                const admin = require('firebase-admin');
                const bucket = admin.storage().bucket('comma-5a85c.appspot.com'); 
                const file = bucket.file(filePath);
    
                try {
                    await file.delete();  // 파일 삭제
                } catch (error) {
                    console.error("Failed to delete file", error);
                    res.status(500).send({ error: "Failed to delete file: " + error.message });
                }
            }
            
            // DB diary 삭제
            await ArticleModel.delete(articleId);
    
            // redirect
            return res.json({ success: true, redirect: `/article` });
        }
        else return res.render("login/login");
    } catch (error) {
        console.error("deleteDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}

// 아티클 리스트
exports.list = async (req, res) => {
    try {
        const sortBy = req.query.sort ? req.query.sort : "latest"; // 좋아순/최신순
        const currentPage = req.query.page ? parseInt(req.query.page) : 1;

        const totalPages = Math.ceil( await ArticleModel.countOfFindAll(sortBy) / 9);
        let Previews = await ArticleModel.PreviewFindAll(currentPage, sortBy); // 임시 상담사 설정

        if (Previews) {
            Previews.forEach(preview => {
                preview.thumbnail_url = setDefaultImage(preview.thumbnail_url);
            });
        }
        
        res.render('article/articles', {Previews, currentPage, totalPages});
    } catch (error) {
        console.error("listAllDiaries 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}


// 좋아요 토글 
exports.toggleLike = async (req, res) => { 
    try {
        // 로그인 여부 확인 && 요청id == 세션id
        if (req.session.user) {
            if (!AccessCheck.checkPatientRole(req.session.user.role)) {
                const referer = req.get('Referer') || '/';
                return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
            }

            let { articleId, patientId } = req.body;
            articleId = parseInt(articleId); // 추출한 body값을 정수로 변환
            patientId = parseInt(patientId);
    
            let liked = true;
            if (await ArticleInteractionModel.findLikeByPatientAndArticle(articleId, patientId) == null) { // 좋아요 추가
                ArticleInteractionModel.createLike(articleId, patientId);
            }
            else { // 좋아요 삭제
                ArticleInteractionModel.deleteLike(articleId, patientId);
                liked = false;
            }

            //추천 시스템 관련
            if (req.session.user.role=='patient') {
                const likeData = await ArticleInteractionModel.findLikeByPatient(patientId);
                const response = await axios.post('http://localhost:5000/similarity_like', { pid: patientId, likeId: likeData });
                const vectorResult = response.data;
                JsonUtils.addJson(1, patientId, vectorResult)
            }

            return res.json({ response: true, liked });
        }
        else return res.render("login/login");
    } catch (error) {
        console.error("좋아요 오류:", error);
    }
}


// 북마크 토글 
exports.toggleBookmark = async (req, res) => { 
    try {
        // 로그인 여부 확인 && 요청id == 세션id
        if (req.session.user) {
            if (!AccessCheck.checkPatientRole(req.session.user.role)) {
                const referer = req.get('Referer') || '/';
                return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
            }

            let { articleId, patientId } = req.body;
            articleId = parseInt(articleId); // 추출한 body값을 정수로 변환
            patientId = parseInt(patientId);

            let bookmarked = true;
            if (await ArticleInteractionModel.findBookmarkByPatientAndArticle(articleId, patientId) == null) { // 북마크 추가
                ArticleInteractionModel.createBookmark(articleId, patientId);
            }
            else { // 북마크 삭제
                ArticleInteractionModel.deleteBookmark(articleId, patientId);
                bookmarked = false;
            }
        
            return res.json({ response: true, bookmarked });
        }
        else return res.render("login/login");
    } catch (error) {
        console.error("북마크 오류:", error);
    }
}