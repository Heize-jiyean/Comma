
// 환자 정보를 닉네임으로 가져오기
exports.getPatientByNickname = async(nickname) => {
    try {
        const db = await('../main').conection();
        let sql = `
            SELECT *
            FROM patient
            WHERE nickname = ?`

        const [result] = await db.query(sql, [nickname]);

        // 데이터베이스 연결 종료
        if (db && db.end) {
            eb.end().catch(err => {
                console.log('DB 연결 종료 중 오류: ', err);
            });
        }

        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('UserModel.getPatientByNickname 오류:', error);
        throw error;
    }
};

// 의사 정보를 닉네임으로 가져오기
exports.getCounselorByNickname = async(nickname) => {
    try {
        const db = await('../main').connection();
        let sql = `
        SELECT *
        FROM counselolr
        WHERE nickname = ?`

        const [result] = await db.query(sql, [nickname]);

        // 데이터베이스 연결 종료
        if (db && db.end) {
            eb.end().catch(err => {
                console.log('DB 연결 종료 중 오류: ', err);
            });
        }

        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error("UserModel.getCounselorByNickname() 쿼리 실행 중 오류:", error);
        throw error;
    }
};