#### 7.6.5 쿼리 수행하기

- 배운 쿼리로 CRUD 작업을 해보자. 모델에서 데이터를 받아 페이지를 렌더링하는 방법과 JSON 형식으로 데이터를 가져오는 방법을 알아보자.

- 사용자 정보를 등록하고, 사용자가 등록한 댓글을 가져오는 서버이다.
  views 폴더를 만들고 그 안에 sequelize.html 파일과 error.html 파일을 만든다.

- AJAX를 사용해 서버와 통신할 것이다.

_views/sequelize.html_

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>시퀄라이즈 서버</title>
    <style>
      table { border: 1px solid black; border-collapse: collapse; }
      table th, table td { border: 1px solid black; }
    </style>
  </head>
  <body>
    <div>
      <form id="user-form">
        <fieldset>
          <legend>사용자 등록</legend>
          <div><input id="username" type="text" placeholder="이름"></div>
          <div><input id="age" type="number" placeholder="나이"></div>
          <div><input id="married" type="checkbox"><label for="married">결혼 여부</label></div>
          <button type="submit">등록</button>
        </fieldset>
      </form>
    </div>
    <br>
    <table id="user-list">
      <thead>
      <tr>
        <th>아이디</th>
        <th>이름</th>
        <th>나이</th>
        <th>결혼여부</th>
      </tr>
      </thead>
      <tbody>
        {% for user in users %}
        <tr>
          <td>{{user.id}}</td>
          <td>{{user.name}}</td>
          <td>{{user.age}}</td>
          <td>{{ '기혼' if user.married else '미혼'}}</td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
    <br>
    <div>
      <form id="comment-form">
        <fieldset>
          <legend>댓글 등록</legend>
          <div><input id="userid" type="text" placeholder="사용자 아이디"></div>
          <div><input id="comment" type="text" placeholder="댓글"></div>
          <button type="submit">등록</button>
        </fieldset>
      </form>
    </div>
    <br>
    <table id="comment-list">
      <thead>
      <tr>
        <th>아이디</th>
        <th>작성자</th>
        <th>댓글</th>
        <th>수정</th>
        <th>삭제</th>
      </tr>
      </thead>
      <tbody></tbody>
    </table>
    <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
    <script src="/sequelize.js"></script>
  </body>
</html>
```

_views/error.html_

```html
<h1>{{message}}</h1>
<h2>{{error.status}}</h2>
<pre>{{error.stack}}</pre>
```

- public 폴더 안에 sequelize.js 파일도 만들자.

_public/sequelize.js_

```javascript
// 사용자 이름 눌렀을 때 댓글 로딩
document.querySelectorAll("#user-list tr").forEach((el) => {
  el.addEventListener("click", function () {
    const id = el.querySelector("td").textContent;
    getComment(id);
  });
});
// 사용자 로딩
async function getUser() {
  try {
    const res = await axios.get("/users");
    const users = res.data;
    console.log(users);
    const tbody = document.querySelector("#user-list tbody");
    tbody.innerHTML = "";
    users.map(function (user) {
      const row = document.createElement("tr");
      row.addEventListener("click", () => {
        getComment(user.id);
      });
      // 로우 셀 추가
      let td = document.createElement("td");
      td.textContent = user.id;
      row.appendChild(td);
      td = document.createElement("td");
      td.textContent = user.name;
      row.appendChild(td);
      td = document.createElement("td");
      td.textContent = user.age;
      row.appendChild(td);
      td = document.createElement("td");
      td.textContent = user.married ? "기혼" : "미혼";
      row.appendChild(td);
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error(err);
  }
}
// 댓글 로딩
async function getComment(id) {
  try {
    const res = await axios.get(`/users/${id}/comments`);
    const comments = res.data;
    const tbody = document.querySelector("#comment-list tbody");
    tbody.innerHTML = "";
    comments.map(function (comment) {
      // 로우 셀 추가
      const row = document.createElement("tr");
      let td = document.createElement("td");
      td.textContent = comment.id;
      row.appendChild(td);
      td = document.createElement("td");
      td.textContent = comment.User.name;
      row.appendChild(td);
      td = document.createElement("td");
      td.textContent = comment.comment;
      row.appendChild(td);
      const edit = document.createElement("button");
      edit.textContent = "수정";
      edit.addEventListener("click", async () => {
        // 수정 클릭 시
        const newComment = prompt("바꿀 내용을 입력하세요");
        if (!newComment) {
          return alert("내용을 반드시 입력하셔야 합니다");
        }
        try {
          await axios.patch(`/comments/${comment.id}`, { comment: newComment });
          getComment(id);
        } catch (err) {
          console.error(err);
        }
      });
      const remove = document.createElement("button");
      remove.textContent = "삭제";
      remove.addEventListener("click", async () => {
        // 삭제 클릭 시
        try {
          await axios.delete(`/comments/${comment.id}`);
          getComment(id);
        } catch (err) {
          console.error(err);
        }
      });
      // 버튼 추가
      td = document.createElement("td");
      td.appendChild(edit);
      row.appendChild(td);
      td = document.createElement("td");
      td.appendChild(remove);
      row.appendChild(td);
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error(err);
  }
}
// 사용자 등록 시
document.getElementById("user-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = e.target.username.value;
  const age = e.target.age.value;
  const married = e.target.married.checked;
  if (!name) {
    return alert("이름을 입력하세요");
  }
  if (!age) {
    return alert("나이를 입력하세요");
  }
  try {
    await axios.post("/users", { name, age, married });
    getUser();
  } catch (err) {
    console.error(err);
  }
  e.target.username.value = "";
  e.target.age.value = "";
  e.target.married.checked = false;
});
// 댓글 등록 시
document
  .getElementById("comment-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = e.target.userid.value;
    const comment = e.target.comment.value;
    if (!id) {
      return alert("아이디를 입력하세요");
    }
    if (!comment) {
      return alert("댓글을 입력하세요");
    }
    try {
      await axios.post("/comments", { id, comment });
      getComment(id);
    } catch (err) {
      console.error(err);
    }
    e.target.userid.value = "";
    e.target.comment.value = "";
  });
```
> script 태그에는 버튼들을 눌렀을 때 서버의 라우터로 AJAX 요청을 보내는 코드가 들어 있다.

- 조금 뒤에 만들 라우터들을 미리 app.js 에 연결하자. 

_app.js_

```javascript
(...)

const { sequelize } = require("./models");
const indexRouter = require("./routes");
const usersRouter = require("./routes/users");
const commentsRouter = require("./routes/comments");

const app = express();
(...)

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/comments", commentsRouter);

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없다.`);
  error.status = 404;
```

_routes/index.js_

```javascript
const express = require("express");
const User = require("../models/user");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const users = await User.findAll();
    res.render("sequelize", { users });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;
```
> GET /로 접속했을 때의 라우터이다. User.findAll 메서드로 모든 사용자를 찾은 후, seqlieze.html 렌더링할 때 결괏값인 users 를 넣는다.

- 시퀄라이즈는 프로미스를 기본적으로 지원하므로 async/await 와 try/catch 문을 사용해서 각각 조회 성공 시와 실패 시의 정보를 얻을 수 있다. 이렇게 미리 데이터베이스에서 데이터를 조회한 후 템플릿 렌더링에 사용할 수 있다.

- 다음은 users.js 이다. router.route 메서드로 같은 라우트 경로는 하나로 묶었다.

_routes/users.js_
```javascript
const express = require("express");
const User = require("../models/user");
const Comment = require("../models/comment");

const router = express.Router();

router
  .route("/")
  .get(async (req, res, next) => {
    try {
      const users = await User.findAll();
      res.json(users);
    } catch (err) {
      console.error(err);
      next(err);
    }
  })
  .post(async (req, res, next) => {
    try {
      const user = await User.create({
        name: req.body.name,
        age: req.body.age,
        married: req.body.married,
      });
      console.log(user);
      res.status(201).json(user);
    } catch (err) {
      console.error(err);
      next(err);
    }
  });

router.get("/:id/comments", async (req, res, next) => {
  try {
    const comments = await Comment.findAll({
      include: {
        model: User,
        where: { id: req.params.id },
      },
    });
    console.log(comments);
    res.json(comments);
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;
```
> GET /users 와 POST /users 주소로 요청이 들어올 때의 라우터이다. 각각 사용자를 조회하는 요청과 등록하는 요청을 처리한다. GET /에서도 사용자 데이터를 조회했지만, GET /users 에서는 데이터를 JSON 형식으로 반환한다는 것에 차이가 있다.

- GET /users/:id/comments 라우터에는 findAll 메서드에 옵션이 추가되어 있다. include 옵션에서 model 속성에는 User 모델을, where 속성에는 :id 로 받은 아이디 값을 넣었다. req.params.id 로 값을 가져올 수 있다. 조회된 댓글 객체에는 include 로 넣어준 사용자 정보도 들어 있으므로, 작성자의 이름이나 나이 등을 조회할 수 있다.

- 다음은 comments.js 이다.

_routes/comments.js_

```javascript
const express = require("express");
const { Comment } = require("../models");

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const comment = await Comment.create({
      commenter: req.body.id,
      comment: req.body.comment,
    });
    console.log(comment);
    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router
  .route("/:id")
  .patch(async (req, res, next) => {
    try {
      const result = await Comment.update(
        {
          comment: req.body.comment,
        },
        {
          where: { id: req.params.id },
        }
      );
      res.json(result);
    } catch (err) {
      console.error(err);
      next(err);
    }
  })
  .delete(async (req, res, next) => {
    try {
      const result = await Comment.destroy({ where: { id: req.params.id } });
      res.json(result);
    } catch (err) {
      console.error(err);
      next(err);
    }
  });

module.exports = router;
```
> POST /comments 라우터는 댓글을 생성하는 라우터. commenter 속성에 사용자 아이디를 넣어 사용자와 댓글을 연결한다.

> PATCH /comments/:id 와 DELETE /comments/:id 라우터는 각각 댓글을 수정, 삭제하는 라우터이다. 수정과 삭제에는 update 와 destory 메서드를 사용한다. 

- 서버를 실행하면 콘솔에 시퀄라이즈가 수행하는 SQL문이 나오므로, 어떤 동작을 하는지 확인할 수 있다.

- Executing 으로 시작하는 SQL 구문을 보고 싶지 않다면 config/config.json 의 dialect 속성 밑에 "logging" : false 를 추가하면 된다.


- 서버를 키고 테스트 해보자.

***

### 7.7 함께 보면 좋은 자료

- 데이터베이스 설명 : https://ko.wikipedia.org/wiki/데이터베이스

- MySQL 메뉴얼 : https://dev.mysql.com/doc/refman/8.0/en

- 워크벤치 메뉴얼 : https://dev.mysql.com/doc/workbench/en

- 시퀄라이즈 문서 : http://docs.sequelizejs.com