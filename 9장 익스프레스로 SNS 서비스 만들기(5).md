## 9.5 프로젝트 마무리하기

- 이제 팔로잉 기능과 해시태그 검색 기능만 추가하면 된다.

- 다른 사용자를 팔로우하는 기능을 만들기 위해 routes/users.js 를 작성하자.

_routes/users.js_

```javascript
const express = require("express");

const { isLoggedIn } = require("./middlewares");
const User = require("../models/user");

const router = express.Router();

router.post("/:id/follow", isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    if (user) {
      await user.addFollowing(parseInt(req.params.id, 10));
      res.send("success");
    } else {
      res.status(404).send("no user");
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
```
> :id 부분이 req.params.id 가 된다. 팔로우할 사용자를 데이터베이스에서 조회한 후, 시퀄라이즈에서 추가한 addFollowing 메서드로 현재 로그인한 사용자와의 관계를 지정하자.

- 팔로잉 관계가 생겼으므로, req.user 에도 팔로워와 팔로잉 목록을 저장한다. 앞으로 사용자 정보를 불러올 때는 팔로워와 팔로잉 목록도 같이 불러오게 된다. req.user 를 바꾸려면 deserializeuser 를 조작해야 한다.

_passport/index.js_

```javascript
...

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
      .then((user) => done(null, user))
      .catch((err) => done(err));
  });

...  
```

- 세션에 저장된 아이디로 사용자 정보를 조회할 때, 팔로잉 목록과 팔로워 목록도 같이 조회한다. include 에서 계속 attributes 를 지정하고 있는데, 이는 실수로 비밀번호를 조회하는 것을 방지하기 위해서이다.

> deserializeUser 캐싱하기
```
라우터가 실행되기 전에 deserializeUser 가 먼저 실행되는데, 모든 요청이 들어올 떄마다 매번 사용자 정보를 조회하게 된다. 서비스의 규모가 커질수록 더 많은 요청이 들어오게 되고, 그로 인해 데이터베이스에도 더 큰 부담이 주어진다. 따라서 사용자 정보가 빈번하게 바뀌는 것이 아니라면 캐싱을 해두는 것이 좋다. 다만, 캐싱이 유지되는 동안 팔로워와 팔로잉 정보가 갱신되지 않는 단점이 있으므로 캐싱 시간은 서비스 정첵에 따라 조절해야 한다.
실제 서비스에서는 메모리에 캐싱하기보다는 레디스 같은 데이터베이스에 사용자 정보를 캐싱한다.
```


- 팔로잉/팔로워 숫자와 팔로우 버튼을 표시하기 위해 routes/page.js 를 수정하자.


_routes/page.js_

```javascript
router.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.followerCount = req.user ? req.user.Followers.length : 0;
  res.locals.followingCount = req.user ? req.user.Followings.length : 0;
  res.locals.followerIdList = req.user ? req.user.Followings.map(f => f.id) : [];
  next();
});
```
> 로그인한 경우에는 req.user 가 존재하므로 팔로잉/팔로워 수와 팔로워 아이디 리스트를 넣는다. 팔로워 아이디 리스트를 넣는 이유는 팔로워 아이디 리스트에 게시글 작성자의 아이디가 존재하지 않으면, 팔로우 버튼을 보여주기 위해서 이다.

_routes/page.js_

```javascript
const express = require("express");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");
const { Post, User, Hashtag } = require('../models');

(...)

router.get('/hashtag', async (req, res, next) => {
  const query = req.query.hashtag;
  if (!query) {
    return res.redirect('/');
  }
  try {
    const hashtag = await Hashtag.findOne({ where: { title: query } });
    let posts = [];
    if (hashtag) {
      posts = await hashtag.getPosts({ include: [{ model: User }] });
    }

    return res.render('main', {
      title: `${query} | NodeBird`,
      twits: posts,
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

module.exports = router;
```

- 해시태그로 조회하는 GET /hashtag 라우터이다. 쿼리스트링으로 해시태그 이름을 받고, 해시태그 값이 없는 경우 메인페이지로 돌려보낸다. 데이터베이스에서 해당 해시 태그를 검색한 후, 해시태그가 있다면 시퀄라이즈에서 제공하는 getPosts 메서드로 모든 게시글을 가져온다. 가져올때는 작성자 정보를 합친다. 조회 후 메인 페이지를 렌더더링하면서 전체 게시글 대신 조호된 게시글만 twits 에 넣어 렌더링한다. 

- 마지막으로 routes/post.js 와 routes/user.js 를 app.js 에 연결하자. 업로드한 이미지를 제공할 라우터(/img) 도 express.static 미들웨어로 uploads 폴더와 연결하자. express.static 을 여러 번 쓸 수 있다는 사실을 기억하자. 이제 uploads 폴더 내 사진들이 /img 주소로 제공된다.

_app.js_

```javascript
const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const session = require("express-session");
// express 프레임워크에서 세션을 관리하기 위해 필요한 미들웨어
const nunjucks = require("nunjucks");
const dotenv = require("dotenv");
const passport = require("passport");

dotenv.config();
const pageRouter = require("./routes/page");
const authRouter = require("./routes/auth");
const postRouter = require("./routes/post");
const userRouter = require("./routes/users");
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
app.use("/img", express.static(path.join(__dirname, "uploads")));
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
app.use("/auth", authRouter);
app.use("/post", postRouter);
app.use("/user", userRouter);

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== "production" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기 중");
});
```

***

- 9.5.1 생략

***

### 9.5.2 핵심 정리

- 서버는 요청에 응답하는 것이 핵심 임무이므로, 요청을 수락하든 거절하든 상관없이 반드시 응답해야 한다. 이때 한 번만 응답해야 에러가 발생하지 않는다.

- 개발 시 서버를 매번 수동으로 재시작하지 않으려면, nodemon 을 사용하는 것이 좋다.

- dotenv 패키지와 .env 파일로 유출되면 안 되는 비밀 키를 관리하자.

- 라우터는 routes 폴더에, 데이터베이스는 models 폴더에, html 파일은 views 폴더에 구분하여 저장하면 프로젝트 규모가 커져도 관리하기 쉽다.

- 데이터베이스를 구성하기전에 데이터 간 관계를 잘 파악하자.

- routes/middlewares.js 처럼 라우터 내에 미들웨어를 사용할 수 있다는 것을 기억하자.

- Passport의 인증 과정을 기억해 두자. 특히 serializeUser 와 deserializeUser 가 언제 호출되는지 파악하고 있어야 한다.

- 프론트엔드 form 태그의 인코딩 방식이 multipart 일 때는 multer 같은 multipart 처리용 패키지를 사용하는 것이 좋다.

***

## 9.6 함께 보면 좋은 자료

- Passport 공식 문서 : http://www.passportjs.org

- passport-local 공식 문서 : https://www.npmjs.com/package/passport-local

- passport-kakao 공식 문서 : https://www.npmjs.com/package/passport-kakao

- bcrypt 공식 문서 : https://www.npmjs.com/package/bcrypt

- 카카오 로그인 : https://developers.kakao.com/docs/latest/ko/kakaologin/common

