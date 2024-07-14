exports.diary = async (req, res) => {
    try {
        
        // 예외 처리

        res.render('profile/diary');
    } catch (error) {
        console.error("profile-diary 오류:", error);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
}
