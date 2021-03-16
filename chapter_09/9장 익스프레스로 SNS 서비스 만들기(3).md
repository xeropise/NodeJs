## 9.3 Passport 모듈로 로그인 구현하기

- SNS 서비스이므로 로그인이 필요하다. 회원가입과 로그인을 직접 구현할 수도 있지만, 세션과 쿠키 처리 등 복잡한 작업이 많으므로 검증된 모듈을 사용하는 것이 좋다.

- Passport 모듈을 사용, 아이디와 비밀번호를 사용하지 않고 구글, 페이스북, 카카오톡 같은 기존의 SNS 서비스 계정으로 고그인하기도 한다.

- 자체 회원가입 및 로그인 뿐만 아니라 한국에서 많이 사용하는 SNS인 카카오톡을 이용해 로그인하는 방법을 알아보자.

```
$ npm i passport passport-local passport-kakao bcrypt
```

- 설치 후 Passport 모듈을 미리 app.js 와 연결하자.

_app.js_

```javascript
(...)

dotenv.config();
const pageRouter = require("./routes/page");
const { sequelize } = require("./models");
const passportConfig = require("./passport");

const app = express();
passportConfig(); // 패스포트 설정
app.set("port", process.env.PORT || 8001);
app.set("view engine", "html");
nunjucks.configure("views", {
  express: app, // app 객체를 연결
  watch: true, // HTML 파일이 변경될 때 템플릿 엔진을 다시 렌더링 함
});

sequelize
  .sync({ force: false })
  .then(() => {
    console.log("데이터베이스 연결 성공");
  })
  .catch((err) => {
    console.error(err);
  });

app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// true 일 경우 qs 모듈을 사용하고, false면 query-string 모듈을 사용한다.
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
  session({
    resave: false, //요청이 왔을 때 세션에 수정사항이 생기지 않더라도 세션을 다시 저장할지에 대한 설정
    saveUninitialized: false, // 세션을 저장할 내역이 없더라도 세션을 저장할지에 대한 설정 (방문자 추적할 때 사용)
    secret: process.env.COOKIE_SECRET, // 필수항목으로 COOKIE-PARSER의 비밀키와 같은 역할
    cookie: {
      // 세션 쿠키에 대한 설정
      httpOnly: true, // 클라이언트에서 쿠키 확인 불가능하게 함
      secure: false, // HTTPS가 아닌 환경에서도 사용 가능하게 함(false)
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/", pageRouter);

(...)
```
> require('./passport')와 require('./passport/index.js')와 같다. 

- passport.initialize 미들웨어는 요청(req)에 passport 설정을 심는다.

- passport.session() 미들웨어는 req.session 객체에 passport 정보를 저장한다. req.session 객체는 express-session 에서 생성하는 것이므로 passport 미들웨어는 express-session 미들웨어보다 뒤에 연결해야 한다.

- passport 폴더 내부에 index.js 파일을 만들고 Passport 관련 코드를 작성해 보자.

_passport_index.js_

```javascript
const passport = require("passport");
const local = require("./localStrategy");
const kakao = require("./kakaoStrategy");
const User = require("../models/user");

module.exports = () => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findOne({ where: { id } })
      .then((user) => done(null, user))
      .catch((err) => done(err));
  });

  local();
  kakao();
};
```

- passport.serializeUser 는 로그인 시 실행되며, req.session(세션) 객체에 어떤 데이터를 저장할지 정하는 메서드이다. 매개변수로 user를 받고 나서, done 함수에 두 번째 인수로 user.id를 넘기고 있다. (매개변수 user가 어디서 오는지는 나중에 설명) 사용자 정보를 가지고 있다고 생각하자.

- done 함수의 첫 번째 인수는 에러 발생 시 사용하는 것이고, 두 번째 인수에는 저장하고 싶은 데이터를 넣는다. 로그인 시 사용자 데이터를 세션에 저장하는데 세션에 사용자 정보를 모두 저장하려면 세션의 용량이 커지고 데이터 일관성에 문제가 발생하므로 사용자의 아이디만 저장하라고 명령한 것

- serializeUser 가 로그인 시에만 실행된다면, deserializeUser 는 매 요청 시 실행된다. passport.session 미들웨어가 이 메서드를 호출한다. serializeUser done 의 두 번쨰 인수로 넣었던 데이터가 deserializeUser 매개 변수가 된다. serializeUser 에서 세션에 저장했던 아이디를 받아, 데이터베이스에서 사용자 정보를 조회한다. 조회한 정보를 req.user에 저장하므로 앞으로 req.user 를 통해 로그인한 사용자의 정보를 가져올 수 있다.

```javascript
passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializerUser((id, done) => {
    User.findOne({ where: { id } })
        .then(user => done(null, user))
        .catch(err => done(err));
})
```

- 즉, serializerUser 는 사용자 정보 객체를 세션에 아이디로 저장하는 것이고, deserializeUser 는 세션에 저장한 아이디를 통해 사용자 정보 객체를 불러오는 것이다. 세션에 불필요한 데이터를 담아두지 않기 위한 과정이다.

- 전체 과정은 다음과 같다.
  
    1) 라우터를 통해 로그인 요청이 들어옴 
   
    2) 라우터에서 passport.authenticate 메서드 호출

    3) 로그인 전략 수행

    4) 로그인 성공 시 사용자 정보 객체와 함께 req.login 호출

    5) req.login 메서드가 passport.serializeUser 호출

    6) req.session 에 사용자 아이디만 저장

    7) 로그인 완료

- 1~4번은 아직 구현하지 않았고, 로컬 로그인을 구현하면서 상응하는 코드를 보게 될 것이다. 다음은 로그인 이후의 과정이다.

    1) 요청이 들어옴

    2) 라우터에 요청이 도달하기 전에 passport.session 미들웨어가 passport.deserializeUser 메서드 호출

    3) req.session에 저장된 아이디로 데이터베이스에서 사용자 조회

    4) 조회된 사용자 정보를 req.use 에 저장

    5) 라우터에서 req.user 객체 사용 가능

- passport/index.js 의 localStrategy 와 kakaoStrategy 파일은 각각 로컬 로그인과 카카오 로그인 전략에 대한 파일로, Passport 는 로그인 시의 동작을 전략(strategy)라는 용어로 표현하고 있다.

***

### 9.3.1 로컬 로그인 구현하기

- 로컬 로그인이란 다른 SNS 서비스를 통해 로그인하지 않고, 자체적으로 회원 가입 후, 로그인하는 것을 의마한다. (아이디/비밀번호 혹은 이메일/비밀번호로 로그인)

- Passport 에서 이를 구현하려면 passport-local 모듈이 필요하다. 설치했으므로 로컬 로그인 전략만 세우면 된다. 로그인에만 해당하는 전략이므로 회원가입은 따로 만들어야 한다.

- 회원가입, 로그인, 로그아웃 라우터를 만들어 보자. 라우터에는 접근 조건이 있는데, 로그인한 사용자는 회원가입과 로그인 라우터에 접근하면 안 된다. 마찬가지로 로그인하지 않은 사용자는 로그아웃 라우터에 접근하면 안 된다. 따라서 라우터에 접근 권한을 제어하는 미들웨어가 필요하다. 미들웨어를 만들어보며 Passport 가 req 객체에 추가해주는 req.isAuthenticated 메서드를 사용해 보자.


_routes/middlewares.js_

```javascript
exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(403).send("로그인 필요");
  }
};

exports.isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    next();
  } else {
    const message = encodeURIComponent("로그인한 상태입니다.");
    res.redirect(`/?error=${message}`);
  }
};
```
> 로그인 중이면 req.isAuthenticated() 가 true 아니면 false

- 라우터들 중에 로그아웃 라우터나 이미지 업로드 라우터 등은 로그인한 사람만 접근할 수 있게 해야 하고, 회원가입 라우터나 로그인 라우터는 로그인하지 않은 사람만 접근할 수 있게 해야 한다. 이럴 때 라우터에 로그인 여부를 검사하는 미들웨어를 넣어 걸러낼 수 있다.

- 만든 미들웨어를 page 라우터에 사용해 보자.

_routes/page.js_

```javascript
const express = require("express");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");

const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.followerCount = 0;
  res.locals.followingCount = 0;
  res.locals.followeridList = [];
  next();
});

router.get("/profile", isLoggedIn, (req, res) => {
  res.render("profile", { title: "내 정보 - NodeBird" });
});

router.get("/join", isNotLoggedIn, (req, res) => {
  res.render("join", { title: "회원가입 - NodeBird " });
});

router.get("/", (req, res, next) => {
  const twits = [];
  res.render("main", {
    title: "NodeBird",
    twits,
  });
});

module.exports = router;
```
> res.local.user 속성에 req.user 를 넣은 것을 주목하자. nunjucks 에서 user 객체를 통해 사용자 정보에 접근할 수 있게 되었다.

- 이제 회원가입, 로그인, 로그아웃 라우터를 작성해 보자.

_routes/auth.js_

```javascript
const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");
const User = require("../models/user");

const router = express.Router();

router.post("/join", isNotLoggedIn, async (req, res, next) => {
  const { email, nick, password } = req.body;
  try {
    const exUser = await User.fineOne({ where: { email } });
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
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      return res.redirect("/");
    });
  })(req, res, next); //미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다.
});

router.get("/logout", isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
```
> 나중에 app.js 와 연결할 때, /auth 접두사를 붙일 것이므로, 라우터의 주소는 각각 /auth/join, /auth/login, /auth/logout 이 된다.

- 로그인 요청이 들어오면, passport.authenticate('local') 미들웨어가 로컬 로그인 전략을 수행하는데, 미들웨어인데 라우터 미들웨어 안에 들어 있다. 미들 웨어에 사용자 정의 기능을 추가하고 싶을 떄 이렇게 할 수 있다. 이럴 떄는 내부 미들웨어에 (req,res,next) 를 인수로 제공해서 호출하면 된다.

- 전략이 성공하거나 실패하면 authenticate 메서드의 콜백 함수가 실행되는데, 콜백 함수의 첫 번째 매개변수(authErr) 값이 있다면 실패, 두 번째 매개변수 값이 있다면 성공한 것이고, req.login 메서드를 호출한다. Passport는 req 객체에 login 과 logout 메서드를 추가하는 데, req.login은 serislizeuser 를 호출하고 req.login에 제공하는 user 객체가 serializeUser로 넘어가게 된다.

_passport/localStreategy.js_

```javascript
const passport = require("passport");
const LocalStreategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

const User = require("../models/user");

module.exports = () => {
  passport.use(
    new LocalStreategy({
      usernameFiled: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const exUser = await User.findOne({ where: { email } });
        if (exUser) {
          const result = await bcrypt.compare(password, exUser.password);
          if (Result) {
            done(null, exUser);
          } else {
            done(null, false, { message: "비밀번호가 일치하지 않습니다." });
          }
        } else {
          done(null, false, { message: "가입되지 않은 회원입니다." });
        }
      } catch (error) {
        console.error(error);
        done(error);
      }
    }));
};
```

- LocalStreategy 생성자의 첫 번쨰 인수로 주어진 객체는 전략에 관한 설정을 하는 곳으로, usernameField 와 passwordField 에는 일치하는 로그인 라우터의 req.body 속성명을 적으면 된다. req.body.email 에 이메일주소, req.body.password 에 비밀번호가 담겨 들어오므로 email 과 password 를 각각 넣었다.

- async 이후가 실제 전략을 수행하는 곳으로, LocalStrategy 생서자의 두 번쨰 인수로 들어간다. 첫 번째 인수에서 넣어준 email 과 password 는 각각 async 함수의 첫 번쨰, 두 번쨰 매개변수로 세 번째 매개변수인 done 함수는 passport.authenticate 의 콜백 함수이다.

- 전략의 내용은 다음과 같다. 먼저 사용자 데이터베이스에서 일치하는 이메일이 있는지 찾은 후, 있다면 bcrypt의 compare 함수로 비밀번호를 비교한다. 비밀번호까지 일치한다면 done 함수의 두 번쨰 인수로 사용자 정보를 넣어 보내고, 두 번쨰 인수를 사용하지 않는 경우는 로그인에 실패했을 때 뿐이다.

- done 함수의 첫 번쨰 인수를 사용하는 경우는, 서버 쪽에서 에러가 발생, 세 번쨰 인수를 사용하는 경우는 로그인 처리 과정에서 비밀번호가 일치하지 않거나 존재하지 않는 회원일 때와 같은 사용자 정의 에러가 발생했을 때이다.

![img](https://user-images.githubusercontent.com/50399804/111316587-bbe56c00-86a6-11eb-98e5-a82661d76da0.png)

- done이 호출된 후에는 다시 passport.authenticate 의 콜백 함수에서 나머지 로직이 실행된다. 로그인에 성공했다면 메인 페이지로 리다이렉트되면서 로그인 폼 대신 회원 정보가 뜰 것이다. 아직 auth 라우터를 연결하지 않았으므로 코드가 동작하지 않는다. 카카오 로그인까지 구현하고 연결해 보자.

***

### 9.3.2 카카오 로그인 구현하기

- SNS 로그인의 특징은 회원가입 절차가 따로 없다는 것이다. 처음 로그인할 때 회원가입 처리를 해야 하고, 두 번째 로그인부터는 로그인 처리를 해야 한다. 따라서 SNS 로그인 전략은 로컬 로그인 전략보다 다소 복잡하다.

_passport/kakaoStrategy.js_

```javascript
const passport = require("passport");
const KakaoStrategy = require("passport-kakao").Strategy;

const User = require("../models/user");

module.exports = () => {
  passport.use(
    new KakaoStrategy(
      {
        clientID: proceess.env.KAKAO_ID,
        callbackURL: "/auth/kakao/callback",
      },
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
              email: profile._json && profile._json.kakao_acount_email,
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
```

- 로컬 로그인과 마찬가지로 카카오 로그인에 대한 설정을 하자. clientId 는 카카오에서 발급해주는 아이디고, 노출되지 않아야 하므로 process.env.KAKAO_ID 로 설정하자. 나중에 아이디를 발급받아 .env 파일에 넣을 것이다. callbackURL 은 카카오로부터 인증 결과를 받을 라우터 주소이다. 아래에서 라우터를 작성할 때 이 주소를 사용하자.

- 먼저 기존에 카카오를 통해 회원가입한 사용자가 있는지 조회한다. 있다면 이미 회원가입 되어 있는 경우이므로 사용자 정보와 함께 done 함수를 호출하고 전략을 종료한다.

- 카카오를 통해 회원가입한 사용자가 없다면 회원가입을 진행한다. 카카오에서는 인증 후 callbackURL 에 적힌 주소로 accessToken, refreshToken, profile 을 보내는데 profile 에는 사용자 정보가 들어 있다. 카카오에서 보내주는 것이므로 데이터는 console.log 메서드로 확인해 보는 것이 좋다. profile 객체에서 원하는 정보를 꺼내와 회원가입을 하고 사용자를 생성한 뒤 done 함수를 호출한다.

- 이제 카카오 로그인 라우터를 만들어보자. 로그아웃 라우터 아래에 추가하면 된다. 회원가입을 따로 코딩할 필요가 없고, 카카오 로그인 전략이 대부분의 로직을 처리하므로 라우터가 상대적으로 간단하다.

_routes/auth.js_

```javascript
router.get("/kakao", passport.authenticate("kakao"));

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
```

- GET /auth/kakao 로 접근하면 카카오 로그인 과정이 시작되는데, layout.html 의 카카오톡 버튼에 /auth;/kakao 링크가 붙어 있다. GET /auth/kakao 에서 로그인 전략을 수행하는데, 처음에는 카카오 로그인 창으로 리다이렉트한다. 그 창에서 로그인 후 성공 여부 결과를 GET /auth/kakao/callback 으로 받는다. 이 라우터에서는 카카오 로그인 전략을 다시 수행한다.

- 로컬 로그인과 다른 점은 passport.authenticate 메서드에 콜백 함수를 제공하지 않는다는 점이다. 카카오 로그인은 로그인 성공 시 내부적으로 req.login 을 호출하므로, 우리가 직접 호출할 필요가 없다. 콜백 함수 대신 로그인에 실패했을 떄 어디로 이동할지를 failureRedirect 속성에 적고, 성공 시에도 어디로 이동할지를 다음 미들웨어에 적는다.

- 추가한 auth 라우터를 app.js 에 연결하자.

_app.js_

```javascript
(...)

const pageRouter = require("./routes/page");
const authRouter = require("./routes/auth");
const { sequelize } = require("./models");

(...)

app.use("/", pageRouter);
app.use("/auth", authRouter);

(...)
```

- 아직 끝난것이 아니라, kakaoStategy.js 에서 사용하는 clientID를 발급 받아야 한다. 카카오 로그인을 위해서는 카카오 개발자 계쩡과 카카오 로그인용 애플리케이션 등록이 필요하다. https://developers.kakao.com 에 접속하여 카카오 회원가입 또는 로그인을 하자.

- 이하 생략 (책 참조)


  