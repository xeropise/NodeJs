## 4장 http 모듈로 서버 만들기

***

### 4.1 요청과 응답 이해하기

- 클라이언트로부터 요청이 왔을 때 어떤 작업을 수행할지 이벤트 리스너를 미리 등록해두어야 한다.

- 이벤트 리스너를 가진 노드 서버를 만들어보자.

_createServer.js_
```javascript
const http = require("http");

http.createServer((req, res) => {
  // 여기에 어떻게 응답할지 적는다.
});
```

- http 모듈에는 createServer 메서드가 있고, 인수로 요청에 대한 콜백 함수를 넣을 수 있으며, 요청이 들어올 때마다 매번 콜백 함수가 실행된다. 이 콜백 함수에 응답을 적으면 된다.

_server1.js_
```javascript
const http = require("http");

http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.write("<h1>hello Node!</h1>");
    res.end("<p>Hello Server!</p>");
  })
  .listen(8080, () => {
    // 서버 연결
    console.log("8080번 포트에서 서버 대기 중입니다!");
  });
```
> 서버를 실행하여 http://localhost:8080 또는 http://127.0.0.1:8080 에 접속하자.

- createServer 메서드 뒤에 listen 메서드를 붙이고, 클라이언트에 공개할 포트 번호와 포트 연결 완료 후 실행될 콜백 함수를 넣는다. 이 파일을 실행하면 서버는 8080 포트에서 요청이 오기를 기다린다.

- res.writeHead 는 응답에 대한 정보를 기록하는 메서드로, 첫 번째 인수로 성공적인 요청임을 의미하는 200, 두 번째 인수로 응답에 대한 정보를 보내는데 콘텐츠의 형식이 HTML 임을 알리고, 한글 표시를 위해 charset 을 utf-8 로 지정했다. 이 정보는 헤더(Header) 에 기록 된다.

- res.write 메서드의 첫 번째 인수는 클라이언트로 보낼 데이터로 문자열을 지금은 보냈지만, 버퍼를 보낼 수도 있다.  여러 번 호출해서 데이터를 여러 개 보내도 된다. 데이터가 기록되는 부분을 본문(Body) 라고 부른다.

- res.end 는 응답을 종료하는 메서드이다. 만약 인수가 있다면, 그 데이터도 클라이언트에 보내고, 응답을 종료한다.

- listen 메서드에 콜백 함수를 넣는 대신, 다음과 같이 서버에 listening 이벤트 리스너를 붙여도 된다. 추가로 error 이벤트 리스너도 붙여보자.

_server1-1.js_
```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.write("<h1>Hello Node!</h1>");
  res.end("<p>Hello Server!</p>");
});

server.listen(8000);

server.on("listening", () => {
  console.log("8080번 포트에서 서버 대기 중입니다!");
});

server.on("error", (error) => {
  console.error(error);
});
```

- 한 번에 여러 서버를 실행할 수도 있다. createServer 를 원하는 만큼 호출하면 된다.

_server1-2.js_
```javascript
const http = require("http");

http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.write("<h1>Hello Node!</h1>");
    res.end("<p>Hello Server!</p>");
  })
  .listen(8080, () => {
    // 서버 연결
    console.log("8080번 포트에서 서버 대기 중입니다!");
  });

http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.write("<h1>Hello Node!</h1>");
    res.end("<p>Hello Server!</p>");
  })
  .listen(8081, () => {
    // 서버 연결
    console.log("8081번 포트에서 서버 대기 중입니다!");
  });
```
> 포트 번호가 달라야 한다는 점에 주의하고, 실무에서는 이런 식으로 서버를 여러 개 띄우는 일은 매우 드물다.


- res.write 와 res.end 에 일일이 HTML 을 적는 것은 비효율적이므로 미리 HTML 파일을 만들어 두고 이를 fs 모듈로 읽어서 전송할 수 있다. 

_server2.html_
```javascript
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Node.js 웹 서버</title>
</head>    
<body>
    <h1>Node.js 웹 서버</h1>
    <p>만들 준비되셨나요?</p>
</body>
</html>
```

_server2.js_
```javascript
const http = require("http");
const fs = require("fs").promises;

http
  .createServer(async (req, res) => {
    try {
      const data = await fs.readFile("./server2.html");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
    } catch (err) {
      console.error(err);
      res.writeHead(500, { "Content-Type": "text/plagin; charset-utf-8" });
      res.end(err.message);
    }
  })
  .listen(8081, () => {
    console.log("8081번 포트에서 서버 대기 중입니다!");
  });
```
> data 변수에 저장된 버퍼를 그대로 클라이언트에 보냈다. 에러 메시지는 문자열이므로 text/plain 을 사용하였다.  

<br>


> HTTP 상태 코드  
- 브라우저는 서버에서 보내주는 상태 코드를 보고, 요청이 성공했는지 실패했는지를 판단한다.
    - 2XX: 성공을 알리는 상태 코드, 200(성공), 201(작성됨)  
    
    - 3XX: 리다이렉션(다른 페이지 이동)을 알리는 상태 코드, 301(영구 이동), 302(임시 이동), 304(수정되지 않음) 은 요청의 응답으로 캐시를 사용했다는 뜻이다.


    - 4XX: 요청 오류를 나타낸다, 요청 자체에 오류가 있을 때 표시된다. 대표적으로 400(잘못된 요청), 401(권한 없음), 403(금지됨), 404(찾을 수 없음)가 있다.


    - 5XX: 서버 오류를 나타내난다. 요청은 제대로 왔지만, 서버에 오류가 생겼을 때 발생한다. 이 오류가 뜨지 않게 주의해서 프로그래밍 해야 한다. 이 오류를 res.writeHead 로 클라이언트에 직접 보내는 경우는 거의 없고, 예기지 못한 에러 발생 시 서버가 알아서 5XX대 코드를 보낸다. 500(내부 서버 오류), 502(불량 게이트웨이), 503(서비스를 사용할 수 없음)이 자주 사용된다.


> 무조건 응답을 보내야 한다!
```
요청 처리 과정 중에 에러가 발생했다고 해서 응답을 보내지 않으면 안된다. 요청이 성공했든 실패했든 응답을 클라이언트로 보내서 요청이 마무리되었음을 알려야 한다. 응답을 보내지 않는다면, 클라이언트는 서버로부터 응답이 오길 하염없이 기다리다가 일정 시간 후, Timeout(시간 초과) 처리 한다.
```



