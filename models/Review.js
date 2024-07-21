// 모든 리뷰 최신순으로 불러오기
exports.getLatestReviews = async () => {
    try {
        const db = await require('../main').connection();
        const [rows] = await db.query(`
            SELECT r.review_id, r.content, r.created_at, 
                   h.name AS hospital_name, h.address AS hospital_address, 
                   p.nickname AS patient_nickname
            FROM review r
            JOIN hospital h ON r.hospital_id = h.hospital_id
            JOIN patient p ON r.patient_id = p.patient_id
            ORDER BY r.created_at DESC
        `);

        // 날짜 형식 변환
        rows.forEach(row => {
            row.created_at = new Date(row.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            });
        });
        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }
        return rows;
    } catch (err) {
        throw new Error('Error fetching reviews: ' + err.message);
    }
};

// 병원 별 리뷰 최신순으로 불러오기
exports.getReviewsByHospital = async (hospitalId) => {
    try {
        const db = await require('../main').connection();
        const [rows] = await db.query(`
            SELECT r.review_id, r.content, r.created_at, 
                   h.name AS hospital_name, h.address AS hospital_address, 
                   p.nickname AS patient_nickname
            FROM review r
            JOIN hospital h ON r.hospital_id = h.hospital_id
            JOIN patient p ON r.patient_id = p.patient_id
            WHERE h.hospital_id = ?
            ORDER BY r.created_at DESC
        `, [hospitalId]);

        // 날짜 형식 변환
        rows.forEach(row => {
            row.created_at = new Date(row.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            });
        });
        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }
        return rows;
    } catch (err) {
        throw new Error('Error fetching reviews for hospital: ' + err.message);
    }
};

// 병원 ID로 리뷰 가져오는 함수 (새로 추가)
exports.getReviewsByHospitalId = async (hospitalId) => {
    try {
        const db = await require('../main').connection();
        const [rows] = await db.query(`
            SELECT r.review_id, r.content, r.created_at, 
                   h.name AS hospital_name, h.address AS hospital_address, 
                   p.nickname AS patient_nickname
            FROM review r
            JOIN hospital h ON r.hospital_id = h.hospital_id
            JOIN patient p ON r.patient_id = p.patient_id
            WHERE h.hospital_id = ?
            ORDER BY r.created_at DESC
        `, [hospitalId]);

        // 날짜 형식 변환
        rows.forEach(row => {
            row.created_at = new Date(row.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            });
        });
        if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }
        return rows;
    } catch (err) {
        throw new Error('Error fetching reviews by hospital ID: ' + err.message);
    }
};