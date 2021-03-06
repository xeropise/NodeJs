### 4.3 쿠기와 세션 이해하기 

***
- 클라이언트에서 보내는 요청에는 한 가지 큰 단점이 있다. __누가 요청을 보내는지 모른다__

- 로그인을 구현하면 되지 않느냐? 로그인을 구혀하려면 쿠키와 세션에 대해 알고 있어야 한다.

- 서버는 미리 클라이언트에 요청자를 추정할 만한 정보를 쿠키로 만들어 보내고, 그 다음부터는 칼리언트로부터 쿠키를 받아 요청자를 파악한다.

- 쿠키는 요청의 헤더(Cookie) 에 담겨 전송된다. 브라우저의 응답의 헤더(Set-Cookie) 에 따라 쿠키를 저장한다.

_cookie.js_
```javascript
const http = require("http");

http
  .createServer((req, res) => {
    console.log(req.url, req.headers.cookie);
    res.writeHead(200, { "Set-Cookie": "mycookie=test" });
    res.end("Hello Cookie");
  })
  .listen(8083, () => {
    console.log("8083번 포트에서 서버 대기 중입니다!");
  });
```
> createServer 메서드의 콜백에서는 req 객체에 담겨 있는 쿠키를 가져온다. 쿠키는 read.headers.cookie 에 들어 있는데, req.headers 는 요청의 헤더를 의미한다.

<br>
<br>

> 응답의 헤더에 쿠키를 기록해야 하므로 res.writeHead 메서드를 사용했다. Set-Cookie 는 브라우저한테 다음과 같은 쿠키를 저장하라는 의미이다.

<br>

![캡처](https://user-images.githubusercontent.com/50399804/110192378-05e17d00-7e71-11eb-8d7d-be1bac487f2d.JPG)

- 요청은 분명 한 번만 보냈는데 두개가 기록되어 있다. 첫 번째 요청(/) 에서는 쿠키에 대한 정보가 없다고 나오며, 두 번째 요청(/favicon.ico) 에서는 쿠키가 기록되어 있다.

<br>

![제목 없음](https://user-images.githubusercontent.com/50399804/110192421-62449c80-7e71-11eb-85dd-296225ce8c40.png)
> 파비콘이라 다음과 같이 웹 사이트 탭에 보이는 이미지를 뜻한다. 브라우저는 파비콘이 뭔지 HTML에서 유추할 수 없으면, 서버에 파비콘 정보에 대한 요청을 보낸다. 위의 예제에서는 HTML 에 파비콘에 대한 정보를 넣어두지 않았으므로, 브라우저가 추가로 /faviocon.ico 를 요청한 것이다.


- 요청 두 개를 통해, 서버가 제대로 쿠키를 심었음을 확인할 수 있다. 첫 번째 요청(/) 에서는 브라우저가 어떠한 쿠키 정보를 가지고 있지 않았고, 서버는 응답의 헤더에 mycookie=test 라는 쿠키를 심으라고 브라우저에게 명령 했다. 따라서 브라우저는 쿠키를 심었고, 두 번쨰 요청(/favicon.ico)의 헤더에 쿠키가 들어 있음을 확인할 수 있다.

- 아직은 쿠키만 심었을 뿐, 그 쿠키카 나인지를 식별해주지는 못하므로, 사용자를 식별하는 방법을 알아보자.

_cookie2.html_
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>쿠키&세션 이해하기</title>
</head>
<form action="/login">
    <input id="name" name="name" placeholder="이름을 입력하세요" />
    <button id="login">로그인</button>
</form>
</html>
```

_cookie2.js_
```javascript
const http = require("http");
const fs = require("fs").promises;
const url = require("url");
const qs = require("querystring");

const parseCookies = (cookie = "") =>
  cookie
    .split(";")
    .map((v) => v.split("="))
    .reduce((acc, [k, v]) => {
      acc[k.trim()] = decodeURIComponent(v);
      return acc;
    }, {});

http
  .createServer(async (req, res) => {
    const cookies = parseCookies(req.headers.cookie);

    // 주소가 /login 으로 시작하는 경우
    if (req.url.startsWith("/login")) {
      const { query } = url.parse(req.url);
      const { name } = qs.parse(query);
      const expires = new Date();
      // 쿠키 유효 시간을 현재 시간 + 5분으로 설정
      expires.setMinutes(expires.getMinutes + 5);
      res.writeHead(302, {
        Location: "/",
        "Set-Cookie": `name=${encodeURIComponent(
          name
        )}; Expires=${expires.toGMTString()}; HttpOnly; Path=/`,
      });
      res.end();

      // name 이라는 쿠키가 있는 경우
    } else if (cookies.name) {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`${cookies.name}님 안녕하세요`);
    } else {
      try {
        const data = await fs.readFile("./cookie2.html");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(data);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(err.message);
      }
    }
  })
  .listen(8084, () => {
    console.log("8084번 포트에서 서버 대기 중입니다!");
  });
```

- Set-Cookie 로 쿠키를 설정할 때 만료 시간(Expires)와 HttpOnyl, Path 같은 옵션을 부여할 수 있다. 옵션 사이에 세미콜론(;)을 써서 구분하면 된다. 쿠키에는 들어가면 안 되는 글자들이 있는데, 대표적으로 한글과 줄바꿈이 있다. 한글은 encodeURIComponent 로 감싸서 넣는다. 

    - Expires=날짜 : 만료 기한, 이 기한이 지나면 쿠키가 제거 된다. 기본값은 클라이언트가 종료될 때 까지이다.

    - Max-age=초 : Expires 와 비슷하지만, 날짜 대신 초를 입력할 수 있다. 해당 초가 지나면 쿠키가 제거된다. Expires 보다 우선한다.

    - Dommain=도메인명 : 쿠키가 전송될 도메인은 특정할 수 있다. 기본값은 현재 도메인이다.

    - Path=URL : 쿠키가 전송될 URL 을 특정할 수 있다. 기본값을 '/' 이고, 이 경우 모든 URL 에서 쿠키를 전송할 수 있다.

    - Secure : HTTPS 일 경우에만 쿠키가 전송된다.

    - HttpOnly : 설정 시, 자바스크립트에서 쿠키에 접근할 수 없다. 쿠키 조작을 방지하기 위해 설정하는 것이 좋다.


- 서버를 기동하면, 새로고침을 해도 로그인이 유지되는 것을 볼 수 있다. 원하는 대로 동작하기는 하지만, Application 탭에서 보이는 것처럼 쿠키가 노출되어 있고, (나는 안되어 있던데..) 또한, 쿠키가 조작될 위험도 있다. 따라서 이름 같은 민감한 개인정보를 쿠키에 넣어두는 것은 적절하지 않다.

_session.js_
```javascript
const http = require("http");
const fs = require("fs").promises;
const url = require("url");
const qs = require("querystring");

const parseCookies = (cookie = "") =>
  cookie
    .split(";")
    .map((v) => v.split("="))
    .reduce((acc, [k, v]) => {
      acc[k.trim()] = decodeURIComponent(v);
      return acc;
    }, {});

const session = {};

http
  .createServer(async (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    if (req.url.startsWith("/login")) {
      const { query } = url.parse(req.url);
      const { name } = qs.parse(query);
      const expires = new Date();
      expires.setMinutes(expires.getMinutes() + 5);
      const uniqueInt = Date.now();
      session[uniqueInt] = {
        name,
        expires,
      };
      res.writeHead(302, {
        Location: "/",
        'Set-Cookie': `session=${uniqueInt};Expires=${expires.toGMTString()};HttpOnly;Path=/`,
      });
      res.end();
      // 세션 쿠키가 존재하고, 만료 기간이 지나지 않았다면
    } else if (
      cookies.session &&
      session[cookies.session].expires > new Date()
    ) {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`${session[cookies.session].name}님 안녕하세요`);
    } else {
      try {
        const data = await fs.readFile("./cookie2.html");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(data);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(err.message);
      }
    }
  })
  .listen(8085, () => {
    console.log("8085번 포트에서 서버 대기 중입니다!");
  });
```
> 쿠키에 이름을 담아서 보내는 대신, uniqueInt 라는 숫자 값을 보냈다. 사용자의 이름과 만료 시간은 uniqueInt 속성명 아래에 있는 session 이라는 객체에 대신 저장한다. cookie.session 이 있고, 만료 기한을 넘기지 않았다면 session 변수에서 사용자 정보를 가져와 사용한다.

- 서버에 사용자 정보를 저장하고, 클라이언트와는 세션 아이디로만 소통한다. 세션 아이디는 꼭 쿠키를 사용해서 주고받지 않아도 된다.

- 실제 배포용 서버에서는 세션을 위와 같이 변수에 저장하지 않는다. 서버가 멈추거나 재시작되면, 메모리에 저장된 변수가 초기화되기 때문이다. 또한, 서버의 메모리가 부족하면 세션을 저장하지 못하는 문제도 생기므로, 보통은 레디스(Redis)나 멤캐시드(memcached) 같은 데이터베이스에 넣어 둔다.

- 위와 같은 코드는 세션 아이디 값및 여러 가지 위협을 방어하지 못하므로 절대 사용하면 안되며, 안전하게 사용하기 위해서는 다른 사람들이 만든 검증된 코드를 사용하는 것이 좋다.


[Zerocho 블로그를 참조하여 쿠키 세션에 대해 더 알아보자](https://www.zerocho.com/category/HTTP/post/5b594dd3c06fa2001b89feb9)