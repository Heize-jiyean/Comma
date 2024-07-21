
exports.isUserAuthenticated = (session) => {
    if (!session) {
        res.render("/login/login");
        return;
    }
}

// 회원본인만 접근
exports.checkMemberId = (sessionUserId, targetID) => {
    exports.isUserAuthenticated(sessionUserId);

    if (sessionUserId != targetID) {
        res.status(500).send("세션 오류가 발생했습니다.");
    }
}

// 회원만 접근
exports.checkPatientRole = (sessionRole) => {
    exports.isUserAuthenticated(sessionRole);

    if (sessionRole != "patient") {
        res.status(500).send("세션 오류가 발생했습니다.");
    }
}

// 상담사만 접근
exports.checkCounselorRole = (sessionRole) => {
    exports.isUserAuthenticated(sessionRole);

    if (sessionRole != "counselor") {
        res.status(500).send("세션 오류가 발생했습니다.");
    }
}