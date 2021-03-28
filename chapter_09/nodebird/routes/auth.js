const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");
const User = require("../models/user");

const router = express.Router();

router.post("/join", isNotLoggedIn, async (req, res, next) => {
  const { email, nick, password } = req.body;
  try {
    const exUser = await User.findOne({ where: { email } });
    if (exUser) {
      return res.redirect("/join?error=exist");
    }
    const hash = await bcrypt.hash(password, 12);
    await User.create({
      email,
      nick,
      password: hash,
    });
    return res.redirect("/");
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.post("/login", isNotLoggedIn, (req, res, next) => {
  passport.authenticate("local", (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      return res.redirect(`/?loginError=${info.message}`);
    }
    return req.login(user, (loginError) => {
      // req.login 은 passport 가 추가해 준다. req.login 은 passport.serializeUser 를 호출한다. req.login 에 제공하는 user 객체가 serializeUser 로 넘어가게 된다.
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      return res.redirect("/");
    });
  })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
});

router.get("/logout", isLoggedIn, (req, res) => {
  req.logout(); // req.logout 은 passport 가 추가해 준다, req.user 객체를 제거
  req.session.destroy(); // req.session 객체의 내용을 제거
  res.redirect("/");
});

router.get("/kakao", passport.authenticate("kakao"));

// 로컬 로그인과 다른점은 passport.authteticate 메서드에 콜백 함수를 제공하지 않는다.
// 카카오 로그인은 로그인 성공 시 내부적으로 req.login 을 호출하므로 직접 호출할 필요가 없다.
router.get(
  "/kakao/callback",
  passport.authenticate("kakao", {
    failureRedirect: "/",
  }),
  (req, res) => {
    res.redirect("/");
  }
);

module.exports = router;
