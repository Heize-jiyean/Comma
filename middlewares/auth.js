
exports.isUserAuthenticated = (session) => {
    return session != null;
}

// 회원만 접근
exports.checkPatientRole = (sessionRole) => {
    if (!exports.isUserAuthenticated(sessionRole)) return false;

    return sessionRole === "patient";
}

// 상담사만 접근
exports.checkCounselorRole = (sessionRole) => {
    if (!exports.isUserAuthenticated(sessionRole)) return false;

    return sessionRole === "counselor";
}

// 회원본인만 접근
exports.checkPatientId = (sessionRole, sessionUserId, targetID) => {
    if (!exports.isUserAuthenticated(sessionUserId)) return false;
    if (!exports.checkPatientRole(sessionRole)) return false;

    return sessionUserId === targetID;
}