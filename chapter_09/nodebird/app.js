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
