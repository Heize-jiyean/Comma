

// 병원 검색 함수
exports.searchHospitals = async (query) => {
    const db = await require('../main').connection();
    const sql = `
        SELECT hospital_id, name, latitude, longitude, website
        FROM hospital
        WHERE name LIKE ?`;

    const [rows] = await db.query(sql, [`%${query}%`]);
    if (db && db.end) { db.end().catch(err => { console.error('DB 연결 종료 중 오류:', err); }); }
    return rows;
}