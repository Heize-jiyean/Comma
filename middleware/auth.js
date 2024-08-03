exports.isLoggedIn = (req, res, next) => {
    if (req.session.user) {
      next();
    } else {
      res.redirect('/auth/login');
    }
  };
  
  exports.isNotLoggedIn = (req, res, next) => {
    if (!req.session.user) {
      next();
    } else {
      res.redirect('/');
    }
  };