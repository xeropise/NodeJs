const passport = require("passport");
const KaKaoStrategy = require("passport-kakao").Strategy;

const User = require("../models/user");

module.exports = () => {
  passport.use(
    new KaKaoStrategy(
      {
        clientID: process.env.KAKAO_ID, // 카카오에서 발급해주는 아이디
        callbackURL: "/auth/kakao/callback", // 카카오로부터 인증 결과를 받을 라우터 주소
      }, // 카카오에서 인증 후 callbackURL 에 적힌 주소로 accessToken, refreshToken, profile 을 보낸다.
      async (accessToken, refreshToken, profile, done) => {
        console.log("kakao profile", profile);
        try {
          const exUser = await User.findOne({
            where: { snsId: profile.id, provider: "kakao" },
          });
          if (exUser) {
            done(null, exUser);
          } else {
            const newUser = await User.create({
              email: profile._json && profile._json.kakao_account_email,
              nick: profile.displayName,
              snsId: profile.id,
              provider: "kakao",
            });
            done(null, newUser);
          }
        } catch (error) {
          console.error(error);
          done(error);
        }
      }
    )
  );
};
