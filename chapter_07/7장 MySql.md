## 7장 MySql

***

- 지금까진 모든 데이터를 변수에 저장했다. 변수에 저장했다는 것은 컴퓨터 메모리에 저장 했다는 뜻인데, 서버가 종료되면 메모리가 정리되면서 저장했던 데이터도 사라져 버린다. 이를 방지하기 위해서는 데이터베이스가 필요하다.

- RDBMS 의 MySQL, NoSQL 의 MongoDB 를 이용해 보자.

***

### 7.1 데이터베이스란?

- 생략

***

### 7.2 mySQL 설치하기

- 다운받고 설치하는 과정 생략, 그냥 책을 참조하거나 인터넷 하나 참조하자.

### 7.3 ~ 7.5 사용법 생략

***

### 7.6 시퀄라이즈 사용하기

- 노드에서 MySQL 데이터베이스에 접속해보자. MySQL 작업을 쉽게 할 수 있도록 도와주는 라이브러리가 있는데, 바로 __시퀄라이즈(Sequelize)__ 이다.

![다운로드](https://user-images.githubusercontent.com/50399804/110250923-5831b380-7fc1-11eb-9b55-26c64b762119.png)

- 시퀄라이즈는 ORM(Object-relational Mapping) 으로 분류된다. ORM 은 자바스크립트 객체와 데이터베이스의 릴레이션을 매핑해주는 도구이다.

- 시퀄라이즈를 오로지 MySQL과 같이 써야만 하는 것은 아니다. MariaDB, PostgreSQL, SQLite, MSSQL 등 다른 데이터베이스도 같이 쓸 수 있다. 문법이 어느 정도 호환되므로 프로젝트를 다른 SQL 데이터베이스로 전환할 때도 편리하다.

- 시퀄라이즈를 쓰는 이유는 자바스크립트 구문을 알아서 SQL로 바꿔주기 때문이다. SQL을 모르는채로 쓰는 것은 권장하지는 않는다.

- 시퀄라이즈 실습을 위한 새 프로젝트를 생성하자. learn-sequelize 폴더를 생성하자.

_package.json_
```json
{
  "name": "learn-sequelize",
  "version": "0.0.1",
  "description": "시퀄라이즈를 배우자",
  "main": "app.js",
  "scripts": {
    "start": "nodemon app"
  },
  "author": "xeropise",
  "license": "MIT"
}
```

- 이제 시퀄라이즈에 필요한 sequelize 와 sequelize-cli, mysql2 패키지를 설치하자.

_콘솔_
```
$ npm i express morgan nunjucks sequelize sequelize-cli mysql2
$ npm i -D nodemon
```

- sequelize-cli 는 시퀄라이즈 명령어를 실행하기 위한 패키지

- mysql2 는 MYSQL과 시퀄라이즈를 이어주는 드라이버, mysql2 자체가 데이터베이스 프로그램은 아니므로 오해하면 안된다.

- 설치 완료 후, sequlieze init 명령어를 호출하자. 전역 설치 없이 명령어로 사용하려면 앞에 npx 를 붙이면 된다.

```
$ npx sequelize init
```
> config, migrations, seeders 폴더가 생성되었다. models 폴더 안의 index.js 가 생성되었는지 확인이 필요하다.

- sequelize-cli 가 자동으로 생성해주는 코드는 그대로 사용할 때 에러가 발생하고, 필요 없는 부분도 많으므로 다음과 같이 수정한다.

_models/index.js_
```javascript
const Sequelize = require("sequelize");

const env = process.env.NODE_ENV || "development";
const config = require("../config/config")[env];
const db = {};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

db.sequelize = sequelize;

module.exports = db;
```
> Sequelize 는 시퀄라이즈 패키지이자 생성자이다. config/config.json 에서 데이트베이스 연결을 불러온 후, new Sequelize 를 통해 MySQL 연결 객체를 생성한다. 연결 객체를 나중에 재사용하기 위해 db.sequelize에 넣어뒀다.

***

#### 7.6.1 MySQL 연결하기

- 이제 시퀄라이즈를 통해 express 앱과 MySQL 을 연결해야 한다. app.js 를 생성하고 express 와 시퀄라이즈 연결 코드를 작성해보자.

_app.js_

```javascript
const express = require("express");
const path = require("path");
const morgan = require("morgan");
const nunjucks = require("nunjucks");

const { sequelize } = require("./models");

const app = express();
app.set("port", process.env.PORT || 3001);
app.set("view engine", "html");
nunjucks.configure("views", {
  expres: app,
  watch: true,
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

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없다.`);
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
> require('./modals')는 require('./modals/index.js') 와 같다.   
> db.sequelize 를 불러와서, sync 메서드를 사용해 서버 실행 시 MySQL과 연동되도록 했다.  
> 내부에 force: false 옵션이 있는데, 이 옵션을 true 로 설정하면 서버 실행 시마다 테이블을 재 생성한다. 테이블을 잘못 만든 경우에 true로 설정하면 된다.

- MySQL 과 연동할 때는 config 폴더 안의 config.json 정보가 사용된다. 다음과 같이 수정하자. 자동 생성된 config.json 에 operatorAliases 속성이 들어 있따면 삭제하자.

_config/config.json_
```json
{
  "development": {
    "username": "root",
    "password": "0000",  // 데이터베이스 비밀번호 String 으로 입력해야함
    "database": "nodejs", // 데이터베이스 명
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  ...
}
```
> test 와 production 쪽은 각각 테스트 용도와 배포 용도로 접속하기 위해 사용되는 것이므로 여기서는 설정하지 않는다.  

> 위 설정은 process.env.NODE_ENV 가 development 일 때 적용된다. (기본적으로 development) 이다. 나중에 배포할 때는 process.env.NODE_ENV 를 production 으로 설정해둔다. 배포 환경을 위해 데이터베이스를 설정할 때는 config/config.json 의 production 속성을 수정하면 된다. 마찬가지로 테스트 환경(process.env.NODE_ENV가 test)일 때는 test 속성을 수정한다.

- 서버를 실행 후, 데이터베이스 연결 성공이 로깅되면 연결에 성공한 것이다. 연결에 실패한 경우, 에러 메시지가 로깅됐을 것이다.

***

#### 7.6.2 모델 정의하기

- MySQL 에서 정의한 테이블을 시퀄라이즈에서도 정의해야 한다. MySQL 테이블으 시퀄라이즈의 모델과 대응되는데 시퀄라이즈는 모델과 MySQL의 테이블을 연결해주는 역할을 한다. User와 Comment 모델을 만들어, users 테이블과 comments 테이블에 연결해 보자. 시퀄라이즈는 기본적으로 단수형, 테이블 이름은 복수형으로 사용한다.
