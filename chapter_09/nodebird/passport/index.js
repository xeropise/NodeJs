const passport = require("passport");
const local = require("./localStrategy");
const kakao = require("./kakaoStrategy");
const User = require("../models/user");

module.exports = () => {
  passport.serializeUser((user, done) => {
    // 매개 변수로 user 를 받고, done 함수에 두 번쨰 인수로 user.id 를 넘기고 있다.
    // 로그인 시 실행, req.session(세션) 객체에 어떤 데이터를 저장할지 정하는 메서드
    done(null, user.id); // 첫 번째 인수는 에러 발생 시 사용, 두 번쨰 인수에는 저장하고 싶은 데이터를 넣는다.
  });

  // 매 요청 시 마다 실행, passport.session 미들웨어가 이 메서드를 호출, id 는 serializeUser 에서 done 의 두번째 인자
  passport.deserializeUser((id, done) => {
    User.findOne({
      where: { id },
      include: [
        {
          model: User,
          attributes: ["id", "nick"],
          as: "Followers",
        },
        {
          model: User,
          attributes: ["id", "nick"],
          as: "Followings",
        },
      ],
    })
      .then((user) => done(null, user)) // req.user 에 조회한 정보를 저장하므로 앞으로 req.user 를 통해 로그인한 사용자의 정보를 가져올 수 있다.
      .catch((err) => done(err));
  });

  local();
  kakao();
};
