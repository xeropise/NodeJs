### 4.2 REST와 라우팅 사용하기

***

- REST (REpresntational State Transfer) : 서버의 자원을 정의하고, 자원에 대한 주소를 지정하는 방법

- REST 에서는 주소 외에도 HTTP 요청 메서드라는 것을 사용한다.

    - GET: 서버 자원을 가져오고 자 할 때 유용, 요청의 본문에 데이터를 넣지 않는다. 데이터를 서버로 보내야 한다면 쿼리스트링을 사용한다.

    - POST: 서버에 자원을 새로 등록하고자 할 때 사용, 요청의 본문에 새로 등록할 데이터를 넣어 보낸다.

    - PUT: 서버의 자원을 요청에 들어 있는 자원으로 치환하고자 할 때 사용, 요청의 본문에 치환할 데이터를 넣어 보낸다.

    - DELETE: 서버의 자원을 삭제하고자 할 떄 사용, 요청의 본문에 데이터를 넣지 않는다.

    - OPTIONS: 요청을 하기 전에 통신 옵션을 설명하기 위해 사용

- GET 메서드 같은 경우, 브라우저에서 캐싱(기억) 할 수도 있으므로, 같은 주소로 GET 요청을 할 때 서버에서 가져오는 것이 아니라 캐시에서 가져올 수도 있다. 캐싱이 되면 성능이 좋아진다.

- RESTful한 웹 서버를 만들어 보자.

_restFront.css_
```css
a { color: blue; text-decoration: none;}
```

_restFront.html_
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>RESTful SERVER</title>
    <link rel="stylesheet" href="./restFront.css" />
</head>
<body>
    <nav>
        <a href="/">Home</a>
        <a herf="/about">About</a>
    </nav>
    <div>
        <form id="form">
            <input type="text" id="username">
            <button type="submit">등록</button>
        </form>
    </div>
    <div id="list"></div>
    <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
    <script src="./restFront.js"></script>
</body>
</html>
```

_restFront.js_
```javascript
async function getUser() {
  // 로딩 시 사용자 정보를 가져오는 함수
  try {
    const res = await axios.get("/users");
    const users = res.data;
    const list = document.getElementById("list");
    list.innerHTML = "";
    // 사용자마다 반복적으로 화면 표시 및 이벤트 연결
    Object.keys(users).map(function (key) {
      const userDiv = document.createElement("div");
      const span = document.createElement("span");
      span.textContext = users[key];
      const edit = document.createElement("button");
      edit.textContent = "수정";
      edit.addEventListener("click", async () => {
        //수정 버튼 클릭
        const name = prompt("바꿀 이름윽 입력하세요");
        if (!name) {
          return alert("이름을 반드시 입력하여야 합니다");
        }
        try {
          await axios.put("/user" + key, { name });
          getUser();
        } catch (err) {
          console.error(err);
        }
      });
      const remove = document.createElement("button");
      remove.textContext = "삭제";
      remove.addEventListener("click", async () => {
        // 삭제 버튼 클릭
        try {
          await axios.delete("/user" + key);
          getUser();
        } catch (err) {
          console.error(err);
        }
      });
      userDiv.appendChild(span);
      userDiv.appendChild(edit);
      userDiv.appendChild(remove);
      list.appendChild(userDiv);
      console.log(res.data);
    });
  } catch (err) {
    console.error(err);
  }
}

window.onload = getUser; // 화면 로딩시 getuser 호출
document.getElementById("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = e.target.username.value;
  if (!name) {
    return alert("이름을 입력하세요");
  }
  try {
    await axios.post("/user", { name });
    getUser();
  } catch (err) {
    console.error(err);
  }
  e.target.username.value = "";
});
```

_about.html_
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>RESTful SERVER</title>
    <link rel="stylesheet" href="./restFront.css" />
</head>    
<body>
<nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
</nav>
<div>
    <h2>소개 페이지입니다.</h2>
    <p>사용자 이름을 등록하세요!</p>
</div>
</body>
</html>
```

_restServer.js_
```javascript
const http = require("http");
const fs = require("fs").promises;

http
  .createServer(async (req, res) => {
    try {
      console.log(req.method, req.url);
      if (req.method === "GET") {
        if (req.url === "/") {
          const data = await fs.readFile("./restFront.html");
          res.writeHead(200, { "Content-Type": "text/plaing; charset=utf-8" });
          return res.end(data);
        } else if (req.url === "/about") {
          const data = await fs.readFile("./about.html");
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          return res.end(data);
        }
        // 주소가 /도  /about도 아니면
        try {
          const data = await fs.readFile(`.${req.url}`);
          return res.end(data);
        } catch (err) {
          // 주소에 해당하는 라우트를 못 찾았다는 404 Not Found error 발생
        }
      }
      res.writeHead(404);
      return res.end("NOT FOUND");
    } catch (err) {
      console.error(err);
      res.writeHead(500, { "Content-Type": "text/plaing; charset=utf-8" });
    }
  })
  .listen(8082, () => {
    console.log("8082번 포트에서 서버 대기중입니다");
  });
```

> restServer.js 가 핵심, req.method 로 HTTP 요청 메서드를 구분하고, 메서드가 GET이면 다시 req.url 로 요청 주소를 구분한다. 주소가 /일 때는 restFront.html 을 제공, 주소가 /about 이면 about.html 파일을 제공, 이외의 경우에는 주소에 적힌 파일을 제공, /restFront.js 라면 restFront.js 파일을 제공할 것이고, /restFront.css 라면 restFront.css 파일을 제공할 것이다. 만약 존재하지 않는 파일을 요청했거나 GET 메서드 요청이 아닌 경우라면 404 NOT FOUND 에러가 응답으로 전송된다. 응답 과정 중에서 예기지 못한 에러가 발생한 경우에는 500에러가 응답으로 전송된다.

<br>

> res.end 앞에 return 을 붙이는 이유
```
res.end 를 호출하면 함수가 종료되지 않는다. 노드도 일반적인 자바스크립트 문법을 따르므로 return 을 붙이지 않는 한 함수가 종료되지 않는다. 
```

<br>

_restServer.js_
```javascript
const http = require("http");
const fs = require("fs").promises;

const users = {}; // 데이터 저장용

http
  .createServer(async (req, res) => {
    try {
      console.log(req.method, req.url);
      if (req.method === "GET") {
        if (req.url === "/") {
          const data = await fs.readFile("./restFront.html");
          res.writeHead(200, { "Content-Type": "text/plaing; charset=utf-8" });
          return res.end(data);
        } else if (req.url === "/about") {
          const data = await fs.readFile("./about.html");
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          return res.end(data);
        } else if (req.url === "/users") {
          res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
          return res.end(JSON.stringify(users));
        }
        // 주소가 /도  /about도 아니면
        try {
          const data = await fs.readFile(`.${req.url}`);
          return res.end(data);
        } catch (err) {
          // 주소에 해당하는 라우트를 못 찾았다는 404 Not Found error 발생
        }
      } else if (req.method === "POST") {
        if (req.url === "/user") {
          let body = "";
          // 요청을 body를 stream 형식으로 받음
          req.on("data", (data) => {
            body += data;
          });
          // 요청의 body를 다 받은 후 실행됨
          return req.on("end", () => {
            console.log("POST 본문(Body):", body);
            const { name } = JSON.parse(body);
            const id = Date.now();
            users[id] = name;
            res.writeHead(201);
            res.end("등록 성공");
          });
        }
      } else if (req.method === "PUT") {
        if (req.url.startsWith("/user/")) {
          const key = req.url.split("/")[2];
          let body = "";
          req.on("data", (data) => {
            body += data;
          });
          return req.on("end", () => {
            console.log("PUT 본문(Body):", body);
            users[key] = JSON.parse(body).name;
            return res.end(JSON.stringify(users));
          });
        }
      } else if (req.method === "DELETE") {
        if (req.url.startsWith("/user")) {
          const key = req.url.split("/")[2];
          delete users[key];
          return res.end(JSON.stringify(users));
        }
      }
      res.writeHead(404);
      return res.end("NOT FOUND");
    } catch (err) {
      console.error(err);
      res.writeHead(500);
      res.end(err);
    }
  })
  .listen(8082, () => {
    console.log("8082번 포트에서 서버 대기중입니다");
  });
```
> 다른 HTTP 요청 메서드들을 추가하고, 데이터베이스 대용으로 users 라는 객체를 선언하여, 사용자 정보를 젖아했다. POST /user 요청에서는 사용자를 새로 젖아하고 있으며, PUT /users/아이디 요청에서만 해당 아이디의 사용자 데이터를 수정하고 있다. DELETE /user/아이디 요청 에서는 해당 아이디 사용자를 제거 한다.

> POST 와 PUT 요청을 처리할 때 조금 특이한 것을 볼 수 있는데, 바로 req.on('data') 와 req.on('end') 의 사용이다. 요청의 본문에 들어 있는 데이터를 꺼내기 위한 작업이라고 보면 된다. req와 res도 내부적으로 스트림(각각 readStream과 writeStream)으로 되어 있으므로 요청 응답의 데이터가 스트림 형식으로 전달된다. 또한 on 에서 볼 수 있듯이 이벤트도 달려 있다. 받은 데이터가 문자열이므로 JSON 으로 만드는 JSON.parse 과정이 필요하다.

