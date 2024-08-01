const AccessCheck = require('../utils/authUtils');
const ArticleModel = require('../models/Article');
const ArticleInteractionModel = require('../models/ArticleInteraction');
const UserModel = require('../models/User');
const fetch = require('node-fetch'); // node-fetch 모듈을 사용하여 fetch를 구현

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
        let user = { role: null, id: null };
        if (req.session.user) {
            user.role = req.session.user.role;
            user.id = req.session.user.id;
            
            if (user.role == 'patient') {
                if (await ArticleInteractionModel.findLikeByPatientAndArticle(articleId, user.id) != null) interaction.liked = true;
                if (await ArticleInteractionModel.findBookmarkByPatientAndArticle(articleId, user.id) != null) interaction.bookmarked = true;
            }
        }      

        res.render('article/view', { user, article, counselor, htmlContent, interaction });
    } catch (error) {
        console.error("viewDiary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}


// exports.delete = async (req, res) => {
//     try {
//         if (req.session.user) {
//             const articleId = req.params.articleId;
//             const article = await ArticleModel.findById(articleId); 
//             const counselor = await UserModel.getCounselorById(article.counselor_id);
            
//             if (!AccessCheck.checkPatientId(req.session.user.role, req.session.user.id, diary.patient_id)) {
//                 const referer = req.get('Referer') || '/';
//                 return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
//             } 
    
//             // 스토리지 이미지 삭제
//             if (diary.image_url) {
//                 // URL parsing
//                 const parsedUrl = new URL(diary.image_url);
//                 const encodedFilePath = parsedUrl.pathname.split('/').pop();
//                 const filePath = decodeURIComponent(encodedFilePath);
    
//                 const admin = require('firebase-admin');
//                 const bucket = admin.storage().bucket('comma-5a85c.appspot.com'); 
//                 const file = bucket.file(filePath);
    
//                 try {
//                     await file.delete();  // 파일 삭제
//                 } catch (error) {
//                     console.error("Failed to delete file", error);
//                     res.status(500).send({ error: "Failed to delete file: " + error.message });
//                 }
//             }
            
//             // DB diary 삭제
//             await diaryModel.delete(diaryId);
    
//             // redirect
//             return res.json({ success: true, redirect: `/profile/patient/${patient.id}/diaries` });
//         }
//         else return res.render("login/login");
//     } catch (error) {
//         console.error("deleteDiary 오류:", error);
//         res.status(500).send("서버 오류가 발생했습니다.");
//     }
// }

// // 상담사 메인화면 일기 리스트
// exports.list = async (req, res) => {
//     try {
//         if (req.session.user) {
//             // if (!AccessCheck.checkCounselorRole(req.session.user.role)) {
//             //     const referer = req.get('Referer') || '/';
//             //     return res.status(403).send(`<script>alert("권한이 없습니다."); window.location.href = "${referer}";</script>`);
//             //  }
//             // 개발편의를 위해 잠시 주석처리

//              const option = req.query.option ? req.query.option : "all";
//              let currentPage = req.query.page ? parseInt(req.query.page) : 1;
     
//              const totalPages = Math.ceil( await diaryModel.countOfFindAll(option, 1) / 9);
//              let Previews = await diaryModel.PreviewfindAll(currentPage, option, 1); // 임시 상담사 설정
     
//              if (Previews) {
//                  Previews.forEach(preview => {
//                      preview.image_url = setDefaultImage(preview.image_url);
//                      // preview.profile_picture = 프로필 기본이미지 설정
//                  });
//              }
             
//              res.render('main-counselor', {Previews, currentPage, totalPages});
//         }
//         else return res.render("login/login");
//     } catch (error) {
//         console.error("listAllDiaries 오류:", error);
//         res.status(500).send("서버 오류가 발생했습니다.");
//     }
// }


// 좋아요 토글 
exports.toggleLike = async (req, res) => { 
    try {
        // 로그인 여부 확인 && 요청id == 세션id

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
    
        return res.json({ response: true, liked });
    } catch (error) {
        console.error("좋아요 오류:", error);
    }
}

// 북마크 토글 
exports.toggleBookmark = async (req, res) => { 
    try {
        // 로그인 여부 확인 && 요청id == 세션id

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
    } catch (error) {
        console.error("북마크 오류:", error);
    }
}