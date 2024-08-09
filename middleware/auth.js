exports.isLoggedIn = (req, res, next) => {
  if (req.session.user) {
    req.user = req.session.user; // req.user에 세션 정보 할당
    next();
  } else {
    res.status(401).json({ redirectUrl: '/auth/login' });
  }
};
exports.isNotLoggedIn = (req, res, next) => {
  if (!req.session.user) {
    next();
  } else {
    res.status(200).json({ redirectUrl: '/' });
  }
};