### 4.4 https 와 http2

- https 모듈은 웹 서버에 SSL 암호화를 추가합니다. GET 이나 POST 요청을 할 때 오가는 데이터를 암호화해서 중간에 다른 사람이 요청을 가로채더라도 내용을 확인할 수 없게 합니다. 로그인이나 결제가 필요한 창에서 https 적용이 필수가 되는 추세입니다.

- SSL 이 적용된 웹 사이트에 방문하면, 브라우저 주소창에 자물쇠 표시가 나옵니다.

![캡처](https://user-images.githubusercontent.com/50399804/110194951-b86c0c80-7e7e-11eb-9e4b-e9671cfeab39.JPG)
> https 적용 화면

-  서버에 암호화를 적용하려면 https 모듈을 사용해야 하는데. 아무나 사용할수 있는 것은 아니다. 암호화를 적용하는 만큼, 그것을 인증해줄 수 있는 기관이 필요한데, 인증서는 인증 기관에서 구입해야 하며, Let's Encrypt 같은 기관에서 무료로 발급해주기도 한다.

- 발급받은 인증서가 있다면 다음과 같이 적용하면 된다.

_server1-3.js_
```javascript
const https = require("https");
const fs = require("fs");

https
  .createServer(
    {
      cert: fs.readFileSync("도메인 인증서 경로"),
      key: fs.readFileSync("도메인 비밀키 경로"),
      ca: [
        fs.readFileSync("상위 인증서 경로"),
        fs.readFileSync("상위 인증서 경로"),
      ],
    },
    (req, res) => {
      res.writeHead(20, { "Content-Type": "text/html; charset=utf-8" });
      res.write("<h1>Hello Node!</h1>");
      res.end("<p>Hello Server!</p>");
    }
  )
  .listen(443, () => {
    console.log("443번 포트에서 서버 대기 중입니다!");
  });
```
> createServer 메서드가 인수를 두 개를 받는데, 두 번쨰 인수는 모듈과 같이 서버 로직이고, 첫 번째 인수는 인증서에 관련된 옵션 객체이다. 인증서를 구입하면 pem이나 crt, 또는 key 확장자를 가진 파일들을 제공한다. 파일들을 fs.readFileSync 메서드로 읽어서 cert, key, ca 옵션에 알맞게 넣으면 된다. 실제 서버에는 80 포트 대신 443 포트를 사용하면 된다.

- 노드의 http2 모듈은 SSL 암호화와 더불어 최신 HTTP 프로토콜인 http/2 를 사용할 수 있게 한다.  
  http/2 는 요청 및 응답 방식이 기존 http/1.1 보다 개선되어 훨씬 효율적으로 요청을 보낸다. http/2 를 사용하면 웹의 속도도 많이 개선된다.

 [HTTP/1.1 과 HTTP/2 의 간단 비교](https://medium.com/@shlee1353/http1-1-vs-http2-0-%EC%B0%A8%EC%9D%B4%EC%A0%90-%EA%B0%84%EB%8B%A8%ED%9E%88-%EC%82%B4%ED%8E%B4%EB%B3%B4%EA%B8%B0-5727b7499b78)


- http2 를 적용해 보자.

_server1-4.js_
```javascript
const http2 = require("http2");
const fs = require("fs");

http2
  .createSecureServer(
    {
      cert: fs.readFileSync("도메인 인증서 경로"),
      key: fs.readFileSync("도메인 비밀키 경로"),
      ca: [
        fs.readFileSync("상위 인증서 경로"),
        fs.readFileSync("상위 인증서 경로"),
      ],
    },
    (req, res) => {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.write("<h1>Hello Node!</h1>");
      res.end("<p>Hello Server!</p>");
    }
  )
  .listen(443, () => {
    console.log("443번 포트에서 서버 대기 중입니다!");
  });
```
> https 모듈과 거의 유사한데, https 모듈을 http2로, createServer 메서드를 createSecureServer 메서드로 바꾸면 된다.

***

### 4.5 cluster

- cluster 모듈은 기본적으로 싱글 프로세스로 동작하는 노드가 CPU 코어를 모두 사용할 수 있게 해주는 모듈이다. 포트를 공유하는 노드 프로세스를 여러 개 둘 수도 있으므로, 요청이 많이 들어왔을 때 병렬로 실행되니 서버의 개숨나큼 요청이 분산되게 할 수 있다. 서버에 무리가 덜가게 한다.

- 코어가 여덟 개인 서버가 있다고 한다면, 노드는 보통 코어를 하나만 활용한다. 하지만, cluster 모듈을 설정하여 코어 하나당 노드 프로세스 하나가 돌아가게 할 수 있다. 성능이 꼭 여덟 배가 되는 것은 아니지만, 코어를 하나만 사용할 때에 비해 성능이 개선된다. 장점만 있는것은 아니며, 메모리를 공유하지 못하는 등의 단점도 있고 세션을 메모리에 저장하는 경우 문제가 될 수 있다. 이는 레디스 등의 서버를 도입하여 해결할 수 있다.

_cluster.js_
```javascript
const cluster = require("cluster");
const http = require("http");

const numCPUs = require("os").cpus().length;

if (cluster.isMaster) {
  console.log(`마스터 프로세스 아이디: ${process.pid}`);
  // CPU 개수만큼 워커를 생산
  for (let i = 0; i < numCPUs; i += 1) {
    cluster.fork();
  }
  // 워커가 종료되었을 때
  cluster.on("exit", (worker, code, signal) => {
    console.log(`${worker.process.pid}번 워커가 종료되었습니다.`);
    console.log("code", code, "signal", signal);
  });
} else {
  // 워커들이 포트에서 대기
  http
    .createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.write("<h1>Hello Node!</h1>");
      res.end("<p>Hello Cluster!</p>");
    })
    .listen(8086);

  console.log(`${process.pid} 번 워커 실행`);
}
```
> worker_threads 의 예제와 모양이 비슷하다. 스레드가 아니라 프로세스라는 점에 유의하자. 클러스터에는 마스터 프로세스와 워커 프로세스가 있고, 마스터 프로세스는 CPU 개수 만큼 워커 프로세스를 만들고, 8086 번 포트에서 대기한다. 요청이 들어오면 만들어진 워커 프로세스에 요청을 분배한다.

<br>

![202](https://user-images.githubusercontent.com/50399804/110195634-de46e080-7e81-11eb-9dc1-b9b615808f15.jpg)

<br>

- 워커 프로세스가 실질적인 일을 하는 프로세스이다. 실제로 몇개가 생성되는지 확인해 보자. 코드를 수정하자.

_cluster.js_

```javascript
(..)

} else {
  // 워커들이 포트에서 대기
  http
    .createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.write("<h1>Hello Node!</h1>");
      res.end("<p>Hello Cluster!</p>");
      setTimeout(() => {
        // 워커가 존재하는지 확인하기 위해 1초마다 강제 종료
        process.exit(1);
      }, 1000);
    })
    .listen(8086);

  console.log(`${process.pid} 번 워커 실행`);
}
```
> 요청이 들어올때 마다 1초 후에 서버가 종료되도록 설정 했다. 서버를 실행 해보자. prcoess.pid 는 실행할 때마다 달라진다. 코어 수 만큼 새로고침을 하면 모든 워커가 종료되어, 서버가 더 이상 응답하지 않는다.

<br>

![캡처](https://user-images.githubusercontent.com/50399804/110195698-88266d00-7e82-11eb-9d3c-5d0a4a8d1afd.JPG)
> 코드(code) 는 process.exit 의 인수로 넣어준 코드가 출력되고, 신호(signal) 은 존재하는 경우, 프로세스를 종료한 신호의 이름이 출력된다.
<br>

- 워커 프로세스가 존재하기에 코어수 만큼 오류가 발생해도, 서버가 정상 작동할 수 있다는 뜻인데, 종료된 워커를 다시 켜면 오류가 발생해도 계속 버틸 수 있다. 다음과 같이 워커 프로세스가 종료되었을 때 새로 하나를 생성해보자.

_cluter.js_

```javascript
(..)

  // 워커가 종료되었을 때
  cluster.on("exit", (worker, code, signal) => {
    console.log(`${worker.process.pid}번 워커가 종료되었습니다.`);
    console.log("code", code, "signal", signal);
    cluster.fork();
  });

(..)  
```
> 이제 워커 하나가 종료될 때마다 새로운 워커하나가 생성된다. 하지만 이러한 방식으로 오류를 처리하는 것은 좋은 방법이다 아니며, 오류 자체의 원인을 찾아 해결해야 한다. 그래도 예기치 못한 에러로 인해 서버가 종료되는 현상을 방지할 수 있어, 클러스터링을 적용해두는 것이 좋다.

- 직접 cluster 모듈로 클러스터링을 구현할 수도 있지만, 실무에서는 pm2 등의 모듈로 cluster 기능을 사용하곤 한다. (15.1.5 절에서 설명)

- 다시 REST와 라우팅으로 돌아가자. 지금까지 설명한 웹 서버 주소는 정적 파일을 요청하는 주소와 서버의 자원을 요청하는 주소로 크게 나뉘어져 있었는데, 만약 파일이나 자원의 수가 늘어나면 그에 따라 주소의 종류도 많아져야 한다. 

- 그런데 if 문이 많아 이미 코드가 상당히 길어져서 보기도 어렵고, 관리하기도 어려운데, 주소의 수가 많아질수록 코드는 계속 길어질 것이다. 여기에 쿠키와 세션을 추가하게 되면 더 복잡해질 것이므로, __Express 모듈__ 을 적용해, 이를 편리하게 만들어줄 수 있다. 

- 다음장은 일단 npm 먼저, npm 에서 모듈을 설치하고 내가 직접 만들어서 배포하는 방법도 알아보자.

***

### 4.6 함께 보면 좋은 자료 

- https 모듈 소개 : https://nodejs.org/dist/latest-v14.x/docs/api/http.html

- 쿠키 설명 : https://developer.mozilla.org/ko/docs/Web/HTTP/Cookies

- 세션 설명 : https://developer.mozilla.org/ko/docs/Web/HTTP/Session

- https 모듈 소개 : https://nodejs.org/dist/latest-v14.x/docs/api/https.html

- http2 모듈 소개 : https://nodejs.org/dist/latest-v14.x/docs/api/http2.html

- cluster 모듈 소개 : https://nodejs.org/dist/latest-v14.x/docs/api/cluster.html