## 9장 익스프레스로 SNS 서비스 만들기

***

- 실제 웹 서비스를 작성해 보자

***

### 9.1 프로젝트 구초 갖추기

- 서비스 중에 140자의 단문 메시지를 보내고 사람들이 메시지의 내용을 공유할 수 있는 서비스가 있다. 만들어 보자.

- nodebird 라는 폴더를 만들고, package.json 을 생성하며 시퀄라이즈를 설치하자. 이 프로젝트는 SQL(MySQL) 을 데이터베이스로 사용할 것이다.

_콘솔_ 
```
$ npm i sequlieze mysql2 sequlieze-cli
$ npx sequlieze init
```
> sequelize-cli 는 스켈레톤 구조를 잡아주는 매니저, mysql2 는 mysql과 달리 promise 문법을 지원한다.

- npx sequlie init 명령어를 호출하면 config, migrations, models, seeders 폴더가 생성된다. 다른 폴더도 생성하자. 템플릿 파일을 넣을 views 폴더, 라우터를 넣을 routes 폴더, 정적 파일을 넣을 public 폴더가 필요하다. 

- 9.3절에서 설명할 passport 패키지를 위한 passport 폴더도 만들자.

- 익스프레스 서버 코드가 담길 app.js 와 설정값들을 담을 .env 파일을 nodebird 폴더 안에 생성하자.

![캡처](https://user-images.githubusercontent.com/50399804/111020547-1e6e0c00-840a-11eb-9442-35ceafbc9a6f.JPG)

<br>

- 필요한 npm 패키지들을 설치하고 app.js 를 작성하자. 템플릿 엔진은 nunjucks 를 사용할 것이다.

```
$ npm i express cookie-parser express-session morgan multer dotenv nunjucks
$ npm i -D nodemon 
```
> nodemon은 프로젝트 폴더의 파일들을 모니터링 하고 있다가 파일이 수정될 경우, 자동으로 서버를 리스타트 시켜준다. 여러 옵션들을 통해 특정 파일들의 변화를 감지 하지않거나 딜레이를 줄 수 있다.

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

dotenv.config();
const pageRouter = require("./routes/page");

const app = express();
app.set("port", procee.env.PORT || 8001);
app.set("view engine", "html");
nunjucks.configure("views", {
  express: app, // app 객체를 연결
  watch: true, // HTML 파일이 변경될 때 템플릿 엔진을 다시 렌더링 함
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

app.use("/", pageRouter);

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
> 라우터로는 pageRouter, 라우터 이후에는 404 응답 미들웨어와 에러 처리 미들웨어가 있다.
> 여길 [참조](https://expressjs.com/ko/starter/faq.html) 하자.

<br>

_.env_

```
COOKIE_SECRET=cookiesecret
```

<br>

- 하드 코딩된 비밀번호가 유일하게 남아 있는 파일이 있는데 시퀄라이즈 설정을 담아둔 config.json 파일이며, JSON 파일이라 process.env 를 사용할 수 없다. 비밀번호를 숨기는 방법은 15.2.1 절에 있다.

- 기본적인 라우터와 템플릿 엔진도 만들어보자. routes 폴더 안에는 page.js, views 폴더 안에는 layout.html, main.html, profile.html, join.html, error.html 을 생성하자. 디자인을 위해 main.css 를 public 폴더 안에 생성하자.

_routes/page.js_
```javascript
const express = require("express");

const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = null;
  res.locals.followerCount = 0;
  res.locals.followingCount = 0;
  res.locals.followeridList = [];
  next();
});

router.get("/profile", (req, res) => {
  res.render("profile", { title: "내 정보 - NodeBird" });
});

router.get("/join", (req, res) => {
  res.render("join", { title: "회원가입 - NodeBird " });
});

router.get("/", (res, res, next) => {
  const twits = [];
  res.render("main", {
    title: "NodeBird",
    twits,
  });
});

module.exports = router;
```
> router.use 로 라우터용 미들웨어를 만들어 템플릿 엔진에서 사용할 user, followingCount, followerCount, followeredIdList 변수를 res.locals 로 설정했다. 이 방법으로 모든 템플릿 엔진에서 공통으로 사용할 수 있다.
[참조](http://expressjs.com/en/5x/api.html#res.locals)

<br>

- 다음은 클라이언트 코드를 만들어 보자.

_view/layout.html_
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>{{title}}</title>
    <meta name="viewport" content="width=device-width, user-scalable=no">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <link rel="stylesheet" href="/main.css">
  </head>
  <body>
    <div class="container">
      <div class="profile-wrap">
        <div class="profile">
          {% if user and user.id %}
            <div class="user-name">{{'안녕하세요! ' + user.nick + '님'}}</div>
            <div class="half">
              <div>팔로잉</div>
              <div class="count following-count">{{followingCount}}</div>
            </div>
            <div class="half">
              <div>팔로워</div>
              <div class="count follower-count">{{followerCount}}</div>
            </div>
          <input id="my-id" type="hidden" value="{{user.id}}">
          <a id="my-profile" href="/profile" class="btn">내 프로필</a>
          <a id="logout" href="/auth/logout" class="btn">로그아웃</a>
        {% else %}
          <form id="login-form" action="/auth/login" method="post">
            <div class="input-group">
              <label for="email">이메일</label>
              <input id="email" type="email" name="email" required autofocus>
            </div>
            <div class="input-group">
              <label for="password">비밀번호</label>
              <input id="password" type="password" name="password" required>
            </div>
            <a id="join" href="/join" class="btn">회원가입</a>
            <button id="login" type="submit" class="btn">로그인</button>
            <a id="kakao" href="/auth/kakao" class="btn">카카오톡</a>
          </form>
        {% endif %}
        </div>
        <footer>
          Made by&nbsp;
          <a href="https://www.zerocho.com" target="_blank">ZeroCho</a>
        </footer>
      </div>
      {% block content %}
      {% endblock %}
    </div>
    <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
    <script>
      window.onload = () => {
        if (new URL(location.href).searchParams.get('loginError')) {
          alert(new URL(location.href).searchParams.get('loginError'));
        }
      };
    </script>
    {% block script %}
    {% endblock %}
  </body>
</html>
```

_views/main.html_
```html
{% extends 'layout.html' %}

{% block content %}
    <div class="timeline">
      {% if user %}
        <div>
          <form id="twit-form" action="/post" method="post" enctype="multipart/form-data">
            <div class="input-group">
              <textarea id="twit" name="content" maxlength="140"></textarea>
            </div>
            <div class="img-preview">
              <img id="img-preview" src="" style="display: none;" width="250" alt="미리보기">
              <input id="img-url" type="hidden" name="url">
            </div>
            <div>
              <label id="img-label" for="img">사진 업로드</label>
              <input id="img" type="file" accept="image/*">
              <button id="twit-btn" type="submit" class="btn">짹짹</button>
            </div>
          </form>
        </div>
      {% endif %}
      <div class="twits">
        <form id="hashtag-form" action="/hashtag">
          <input type="text" name="hashtag" placeholder="태그 검색">
          <button class="btn">검색</button>
        </form>
        {% for twit in twits %}
          <div class="twit">
            <input type="hidden" value="{{twit.User.id}}" class="twit-user-id">
            <input type="hidden" value="{{twit.id}}" class="twit-id">
            <div class="twit-author">{{twit.User.nick}}</div>
            {% if not followerIdList.includes(twit.User.id) and twit.User.id !== user.id %}
              <button class="twit-follow">팔로우하기</button>
            {% endif %}
            <div class="twit-content">{{twit.content}}</div>
            {% if twit.img %}
              <div class="twit-img"><img src="{{twit.img}}" alt="섬네일"></div>
            {% endif %}
          </div>
        {% endfor %}
      </div>
    </div>
{% endblock %}

{% block script %}
  <script>
    if (document.getElementById('img')) {
      document.getElementById('img').addEventListener('change', function(e) {
        const formData = new FormData();
        console.log(this, this.files);
        formData.append('img', this.files[0]);
        axios.post('/post/img', formData)
          .then((res) => {
            document.getElementById('img-url').value = res.data.url;
            document.getElementById('img-preview').src = res.data.url;
            document.getElementById('img-preview').style.display = 'inline';
          })
          .catch((err) => {
            console.error(err);
          });
      });
    }
    document.querySelectorAll('.twit-follow').forEach(function(tag) {
      tag.addEventListener('click', function() {
        const myId = document.querySelector('#my-id');
        if (myId) {
          const userId = tag.parentNode.querySelector('.twit-user-id').value;
          if (userId !== myId.value) {
            if (confirm('팔로잉하시겠습니까?')) {
              axios.post(`/user/${userId}/follow`)
                .then(() => {
                  location.reload();
                })
                .catch((err) => {
                  console.error(err);
                });
            }
          }
        }
      });
    });
  </script>
{% endblock %}
```

_views/profile.html_

```html
{% extends 'layout.html' %}

{% block content %}
  <div class="timeline">
    <div class="followings half">
      <h2>팔로잉 목록</h2>
      {% if user.Followings %}
        {% for following in user.Followings %}
          <div>{{following.nick}}</div>
        {% endfor %}
      {% endif %}
    </div>
    <div class="followers half">
      <h2>팔로워 목록</h2>
      {% if user.Followers %}
        {% for follower in user.Followers %}
          <div>{{follower.nick}}</div>
        {% endfor %}
      {% endif %}
    </div>
  </div>
{% endblock %}
```

_views/error.html_

```html
{% extends 'layout.html' %}

{% block content %}
  <h1>{{message}}</h1>
  <h2>{{error.status}}</h2>
  <pre>{{error.stack}}</pre>
{% endblock %}
```
> 에러는 콘솔로 봐도 되지만 브라우저 화면으로 보면 좀 더 편리하다. 단, 배포 시에는 에러 내용을 보여주지 않는게 보안 상 좋다.

<br>

_public/main.css_

```css
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; }
.btn {
  display: inline-block;
  padding: 0 5px;
  text-decoration: none;
  cursor: pointer;
  border-radius: 4px;
  background: white;
  border: 1px solid silver;
  color: crimson;
  height: 37px;
  line-height: 37px;
  vertical-align: top;
  font-size: 12px;
}
input[type='text'], input[type='email'], input[type='password'], textarea {
  border-radius: 4px;
  height: 37px;
  padding: 10px;
  border: 1px solid silver;
}
.container { width: 100%; height: 100%; }
@media screen and (min-width: 800px) {
  .container { width: 800px; margin: 0 auto; }
}
.input-group { margin-bottom: 15px; }
.input-group label { width: 25%; display: inline-block; }
.input-group input { width: 70%; }
.half { float: left; width: 50%; margin: 10px 0; }
#join { float: right; }
.profile-wrap {
  width: 100%;
  display: inline-block;
  vertical-align: top;
  margin: 10px 0;
}
@media screen and (min-width: 800px) {
  .profile-wrap { width: 290px; margin-bottom: 0; }
}
.profile {
  text-align: left;
  padding: 10px;
  margin-right: 10px;
  border-radius: 4px;
  border: 1px solid silver;
  background: lightcoral;
}
.user-name { font-weight: bold; font-size: 18px; }
.count { font-weight: bold; color: crimson; font-size: 18px; }
.timeline {
  margin-top: 10px;
  width: 100%;
  display: inline-block;
  border-radius: 4px;
  vertical-align: top;
}
@media screen and (min-width: 800px) { .timeline { width: 500px; } }
#twit-form {
  border-bottom: 1px solid silver;
  padding: 10px;
  background: lightcoral;
  overflow: hidden;
}
#img-preview { max-width: 100%; }
#img-label {
  float: left;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid crimson;
  padding: 0 10px;
  color: white;
  font-size: 12px;
  height: 37px;
  line-height: 37px;
}
#img { display: none; }
#twit { width: 100%; min-height: 72px; }
#twit-btn {
  float: right;
  color: white;
  background: crimson;
  border: none;
}
.twit {
  border: 1px solid silver;
  border-radius: 4px;
  padding: 10px;
  position: relative;
  margin-bottom: 10px;
}
.twit-author { display: inline-block; font-weight: bold; margin-right: 10px; }
.twit-follow {
  padding: 1px 5px;
  background: #fff;
  border: 1px solid silver;
  border-radius: 5px;
  color: crimson;
  font-size: 12px;
  cursor: pointer;
}
.twit-img { text-align: center; }
.twit-img img { max-width: 75%; }
.error-message { color: red; font-weight: bold; }
#search-form { text-align: right; }
#join-form { padding: 10px; text-align: center; }
#hashtag-form { text-align: right; }
footer { text-align: center; }
```

- npm start 로 서버를 실행하고 접속해 보자.