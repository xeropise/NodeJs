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

_models/users.js_

```javascript
const Sequelize = require("sequelize");

module.exports = class User extends (
  Sequelize.Model
) {
  static init(sequelize) {
    return super.init(
      {
        name: {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true,
        },
        age: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
        },
        married: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
        },
        comment: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      },
      {
        sequelize,
        timestamps: false,
        underscored: false,
        modalName: "User",
        tableName: "users",
        paranoid: false,
        charset: "utf8",
        collate: "utf8_general_ci",
      }
    );
  }
  static associate(db) {}
};
```
> 모델은 크게 static init 메서드와 static associate 메서드로 나뉜다.

- init 메서드에는 테이블에 대한 설정을 하고, associate 메서드에는 다른 모델과의 관계를 적는다.  

- super.init 메서드의 첫 번째 인수가 테이블 컬럼에 대한 설정이고, 두 번째 인수가 테이블 자체에 대한 설정이다.

- 시퀄라이즈는 알아서 id를 기본 키로 연결하므로, id 컬럼은 적어줄 필요가 없다. 나머지 컬럼은 스펙을 입력한다.

- 시퀄라이즈 자료형은 MySql 자료형과 조금 다른데, 
  
  - VARCHAR 는 STRING
  
  - INT 는 INTEGER
  
  - TINYINT 는 BOOLEAN

  - DATETIME 은 DATE

  - INTEGER.UNSIGNED 는 UNSIGNED 옵션이 적용된 INT 를 의미, ZEROFILL 옵션도 사용하고 싶다면 INTEGER.UNSGINED.ZEROFILL 을 적자.

  - allowNull은 NOT NULL 옵션과 동일

  - unique 는 UNIQUE 옵션

  - defaultValue 는 기본값(DEFAULT) 를 의미.


- super.init 메서드의 두 번째 인수는 테이블 옵션이다.

  - sequelize: static init 메서드의 매개변수와 연결되는 옵션으로 db.sequelize 객체를 넣어야 한다. 나중에 mode/index.js 에서 연결한다.

  - timestamps: 현재 false 로 되어 있으며, 이속성 값이 true면 시퀄라이즈는 createdAt과 updateAt 컬름을 추가한다. 각각 로우가 생성될 때와 수정될 때의 시간이 자동으로 입력된다. 예제에서는 created_at 컬럼을 만들었으므로, timestamps 속성이 필요하지 않다. 따라서 false로 자동으로 날짜 컬럼을 추가하는 기능을 해제했다.

  - underscored: 시퀄라이즈는 기본적으로 테이블명과 컬럼명을 카멜 케이스(createdAt)로 만든다. 이를 스네이크 케이스( created_at ) 로 바꾸는 옵션이다.

  - modelName: 모델 이름을 설정할 수 있다. 노드 프로젝트에서 사용한다.

  - tableName: 실제 데이터베이스의 테이블 이름이 된다. 기본적으로 모델 이름을 소문자 및 복수형으로 만든다. 모델 이름이 User 라면 테이블 이름은 users 가 된다.

  - paranoid: true로 설정하면 deletedAt 이라는 컬럼이 생긴다. 로우를 삭제할 때 완전히 지워지지 않고 deletedAt에 지운 시각이 기록된다. 로우를 조회하는 명령을 내렸을 때는 deletedAt의 값이 null인 로우 (삭제 안됨)를 조회한다. 이렇게 하는 이유는 나중에 로우를 복원하기 위함이다.  로우를 복원해야 하는 상황이 생길 것같다면, 미리 true 로 설정해 두자.

  - charset과 collate: 각각 utf8과 utf8_general_ci 로 설정해야 한글이 입력된다. 이모티콘까지 입력할 수 있게 하고 싶다면 utf8m4 와 utf8m4_general_ci 를 입력하자.


  - Comment 모델도 만들어 보자.

_model/comment.js_
```javascript
const Sequelize = require("sequelize");

module.exports = class Comment extends (
  Sequelize.Model
) {
  static init(sequelize) {
    return super.init(
      {
        comment: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: Sequelize.NOW,
        },
      },
      {
        sequelize,
        timestamps: false,
        modelName: "Comment",
        tableName: "comments",
        paranoid: false,
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
      }
    );
  }

  static assosiate(db) {}
};
```
> users 테이블과 연결된 commenter 칼럼이 없다.

- 모델을 정의할 때 commenter 칼럼의 넣어도 되지만, 시퀄라이즈 자체에서 관계를 따로 정의할 수 있다. 조금 뒤에 알아보자.

- 모델을 생성했다면 models/index.js 와 연결하자.

_models/index.js_
```javascript
const Sequelize = require("sequelize");
const User = require("./user");
const Comment = require("./comment");

(...)

db.sequelize = sequelize;

db.User = User;
db.Comment = Comment;

User.init(sequelize);
Comment.init(sequelize);

User.associate(db);
Comment.associate(db);

module.exports = db;

```
> db라는 객체에 User 와 Comment 모델을 담았다. 앞으로 db 객체를 require 하여 User 와 Comment 모델에 접근할 수 있다. User.init 과 Comment.init 은 각각의 모델의 static.init 메서드를 호출하는 것이며, init 이 실행되어야 테이블이 모델로 연결된다. 다른 테이블과 관계를 연결하는 associate 메서드도 미리 실행해 두자.

- 이제 users 테이블과 comments 테이블 간의 관게를 설정해 보자.

***

#### 7.6.3 관계 정의하기

- users 테이블과 comments 테이블 간의 관계를 정의해 보자. 사용자 한명은 댓글 여러 개를 작성할 수 있다. 댓글 하나에 사용자가 여러 명일 수는 없다. 이러한 관계를 일대다 관게라고 한다.

- 시퀄라이즈는 JOIN 기능을 알아서 구현하나, 대신 테이블 간에 어떠한 관계가 있는지 시퀄라이즈에 알려야 한다.

***

##### 7.6.3.1 1:N

- 시퀄라이즈에서는 1:N 관계를 hasMany 라는 메서드로 표현한다. users 테이블의 로우 하나를 불러올 때 연결된 comments 테이블의 로우들도 같이 불러올 수 있다. 

- 반대로 belongsTo 메서드도 있다. comments 테이블의 로우를 불러올 때, 연결된 users 테이블의 로우를 가져온다.

- 모델 각각의 static associate 메서드에 넣는다.

_models/user.js_
```javascript
  static associate(db) {
    db.User.hasMany(db.Comment, { foreignKey: "commenter", sourceKey: "id" });
  }
};
```

_models/comment.js_
```javascript
  static assosiate(db) {
    db.Comment.belongTo(db.User, { foreignKey: "commenter", targetKey: "id" });
  }
};
```

![326](https://user-images.githubusercontent.com/50399804/110319610-7c89a080-8052-11eb-8e39-6ed0b7085804.jpg)

> foreignKey를 따로 지정하지 않는다면, 이름이 모델명+기본 키인 컬럼이 모델에 생성된다. 예를 들어 commneter 를 foreignKey 로 넣어주지 않는다면 user(모델명)+ 기본 키(id) 가 합쳐진 UserId가 foreignKey 로 생성된다.

- 서버를 시작하면 시퀄라이즈가 스스로 실행하는 SQL문을 볼 수 있다.

![캡처](https://user-images.githubusercontent.com/50399804/110319963-f1f57100-8052-11eb-8807-9393ea7eeefe.JPG)


***

##### 7.6.3.2 1:1

- 1:1 관계에서는 hasMany 메서드 대신, hasOne 메서드를 사용한다. 사용자 정보를 담고 있는 가상의 Info 모델이 있다고 하면 다음과 같이 표현할 수 있다.

```
db.User.hasOne(db.Info, { foreignKey: 'UserId', sourceKey: 'id'})
db.Info.belongsTo(db.user, { foreignKey: 'UserId', targetKey: 'id'})
```
> belongsTo 와 hasOne 이 반대면 안된다.

***

##### 7.6.3.3 N:M

- 시퀄라이즈는 N:M 관계를 표현하기 위한 belongsToMany 메서드가 있다.

- 게시글 정보를 담고 있는 가상의 Post 모델과 해시태그 정보를 담고 있는 가상의 Hashtag 모델이 있다고 하면 다음과 같이 표현할 수 있다.

```
db.Post.belongsToMany(db.Hashtag, { through: 'PostHasgtag'});
db.Hashtag.belongsToMany(db.Post, { through: 'PostHashtag'});
```

- N:M 관계의 특성상 새로운 모델이 생성 된다. through 속성에 그 이름을 적으면 된다.  
  새로 생성된 모델에는 게시글과 해시태그의 아이디가 저장된다.

![278_2](https://user-images.githubusercontent.com/50399804/110320509-c030da00-8053-11eb-8aba-40c5d3804757.jpg)

- N:M 에서 데이터를 조회할 때는 여러 단계를 거쳐야 하는데. #노드 해시태그를 사용한 게시물을 조회한다고 가정하면, 먼저 #노드 해시태그를 Hashtag 모델에서 조회하고, 가져온 태그의 아이디(1)를 바탕으로 PostHashtag 모델에서 hashtagId가 1인 postId들을 찾아 Post 모델에서 정보를 가져오면 된다.

- 자동으로 만들어진 모델들도 다음과 같이 접근할 수 있다.

```
db.sequelize.models.PostHashtag
```

***

### 7.6.4 쿼리 알아보기

- 시퀄라이즈로 CRUD 작업을 하려면 시퀄라이즈 쿼리를 알아야 하는데, SQL 문을 자바스크립트로 생성하는 것이라, 시퀄라이즈만의 방식이 있다.

- 쿼리는 프로미스를 반환하므로 then을 붙여 결괏값을 받을 수도 있고, async/await 문법과 같이 사용할 수도 있다.
  
- 로우를 생성하는 쿼리부터 알아보자. 첫 줄이 SQL문이고, 그 아래는 시퀄라이즈 쿼리이다.

```javascript
INSERT INTO nodejs.users (name, age, married, comment) VALUES ('xeropise', 32, 0, '자기소개1');

const { User } = require('../models');
User.create({
  name: 'xeropise',
  age: 32,
  married: false,
  comment: '자기소개1',
});
```
> models 모듈에서 User 모델을 불러와 create 메서드를 사용하면 된다.

- 한 가지 주의할 점은 데이터를 넣을 때 MySQL의 자료형이 아니라 시퀄라이즈 모델에 정의한 자료형대로 넣어야 한다는 것이다. 이것이 married 가 0이 아니라 false 인 이유이다.

- 시퀄라이즈가 알아서 MySQL 자료형으로 바꾸며, 자료형이나 옵션에 부합하지않는 데이터를 넣었을 때는 시퀄라이즈가 에러를 발생시킨다.

- 이번엔 로우를 조회하는 쿼리들이다.

```javascript
SELECT * FROM nodejs.users;
User.findAll({});
```
> findAll 메서드를 사용하면 된다. 데이터를 하나만 가져올 때는 findOne 메서드를, 여러 개 가져올 때는 findAll 메서드를 사용한다고 생각하면 된다.

```javascript
SELECT * FROM nodejs.users LIMIT 1;
User.fineOne({});
```

- attributes 옵션을 사용해서 원하는 컬럼만 가져올수도 있다.

```javascript
SELECT name, married FROM nodejs.users; 
User.findAll({
  attributes: ['name', 'married'],
});
```

- where 옵션이 조건들을 나열하는 옵션이다.

```javascript
SELECT name, age FROM nodejs.users WHERE married = 1 AND age > 30;
const { Op } = require('sequelize');
const { User } = require('../models');
User.fineAll({
  attributes: ['name', 'age'],
  where: {
    married: true,
    age: { [Op.gt]: 30},
  }
});
```

- MySQL 에서는 undefined 라는 자료형을 지원하지 않으므로, where 옵션에는 undefined 가 들어가면 안된다. 빈 값을 넣고자 하면 null 을 대신 사용하자.

- age 부분이 조금 특이한데, 시퀄라이즈는 자바스크립트 객체를 사용해서 쿼리를 생성해야 하므로 Op.gt 같은 특수한 연산자들이 사용된다. Sequelize 객체 내부의 Op 객체를 불러와 사용한다. 

> 자주 쓰이는 연산자로는 Op.gt(초과), Op.gte(이상), Op.lt(미만), Op.lte(이하), Op.ne(같지 않음), Op.or(또는), Op.in(배열 오소 중 하나), Op.notIn(배열 요소와 모두 다름) 등이 있다.

- Op.or 를 한번 사용해 보자.

```javascript
SELECT id, name from users WHERE married = 0 OR age > 30;
const { Op } = require('sequelize');
const { User } = require('../models');
User.findAll({
  attribute: ['id', 'name'],
  where: {
    [Op.or]: [{ married: false}, { age: { [Op.gt]: 30 }}],
  }
})
```
> Op.or 속성에 OR 연산을 적용할 쿼리들을 배열로 나열하면 된다.

```javascript
SELECT id, name FROM users ORDER BY age DESC;
User.findAll({
  attributes: ['id', 'name'],
  order: [['age', 'DESC']],
})
```
> 시퀄라이즈의 정렬 방식은 order 옵션으로 가능하며, 배열 안에 배열이 있다는 점에 주의하자.

- 다음은 조회할 로우 개수를 설정하는 방법이다.

```javascript
SELECT id, name FROM users ORDER BY age DESC LIMIT 1;
User.findAll({
  attributes: ['id', 'name'],
  order: [['age', 'DESC']];
  limit: 1,
});
```

- OFFSET도 역시 offset 속성으로 구현 할 수 있다.

```javascript
SELECT id, name FROM users ORDER BY age DESC LIMIT 1 OFFSET 1;
User.findAll({
  attributes: ['id', 'name'],
  order: [['age', 'DESC']];
  limit: 1,
  offset: 1,
});
```

- 이번에는 로우를 수정하는 쿼리이다.

```javascript
UPDATE nodejs.users SET comment = '바꿀 내용' WHERE id = 2;
user.update({
  comment: '바꿀 내용',
}, {
  where: { id: 2 },
})
```
> 첫 번째 인수는 수정할 내용ㅇ, 두 번쨰 인수는 어떤 로우를 수정할지에 대한 조건으로, where 옵션에 조건들을 적는다.

- 로우를 삭제하는 쿼리는 다음과 같다.

```javascript
DELETE FROM nodejs.users WHERE id = 2;
User.destroy({
  where: { id: 2},
});
```
> destory 메서드로 삭제한다. where 옵션에 조건들을 적는다.


***

##### 7.6.4.1 관계 쿼리

- findOne 이나 findAll 메서드는 호출할 떄 프로미스의 결과 모델을 반환한다.

- findAll은 모두 찾는 것이므로, 모델의 배열을 반환
  
```javascript
const user = await User.fineOne({});
console.log(user.nick); // 사용자 닉네임
```

- User 모델의 정보에도 바로 접근할 수 있지만, 더 편리한 점은 관계 쿼리를 지원한다는 것이다. (JOIN) hasMany-belongsTo 인 일대다 관계까 맺어져있는데, 특정 사용자를 가져오면서 그 사람의 댓글까지 모두 가져오고 싶다면 include 속성을 사용한다.

```javascript
const user = await User.findOne({
  include: [{
    model: Comment,
  }]
});
console.log(user.Comments);
```
> 어떤 모델과 관계가 있는지를 include 배열에 넣어주면 된다. 배열인 이유는 다양한 모델과 관계가 있을 수 있기 때문이다.  댓글은 여러 개일 수 있으므로(hasMany), user.Comments 로 접근 가능하다. 또는 다음과 같이 댓글에 접근할 수도 있다.

```javascript
const user = await user.fineOne({});
const comments = await user.getComments();
console.log(comments); // 사용자 댓글
```
> 관계를 설정했다면 getComments(조회) 외에도 setComments(수정), addComment(하나 생성), addComments(여러 개 생성), removeComments(삭제) 메서드를 지원한다. 동사 뒤에 모델의 이름이 붙는 형식이다.

- 동사 뒤의 모델 이름을 바꾸고 싶다면 관계 설정 시 as 옵션을 사용할 수 있다.

```javascript
// 관계를 설정할 때 as로 등록
db.User.hasMany(db.Comment, { foreignKey: 'commenter', sourceKey: 'id', as: 'Answers'});
// 쿼리할 때는
const user = await User.findOne({});
const comments = await user.getAnswers(); 
console.log(comments); // 사용자 댓글
```
> as 를 설정하면 include 시 추가되는 댓글 객체도 user.Answer 로 바뀐다.

- include나 관계 쿼리 메서드에도 where 이나 attributes 같은 옵션을 사용할 수 있다.

```javascript
const user = await User.fineOne({
  include: [{
    model: Comment,
    where: {
      id: 1,
    },
    attributes: ['id'], // id 컬럼만 가져온다.
  }]
});

// 또는
const comments = await user.getComments({
  where: {
    id: 1,
  },
  attributes: ['id'],
})
```
> 댓글을 가져올 때는 id가 1인 댓글만 가져오고, 컬럼도 id 컬럼만 가져오도록 하고 있다.

- 관계 쿼리 시 조회는 위와 같이 하지만 수정, 생성, 삭제 때는 조금 다른점이 있다.

```javascript
const user = await User.fineOne({});
const comment = await Comment.create();
await user.addComment(comment);
// 또는
await user.addComment(comment.id);
```

- 여러 개를 추가할 때는 배열로 추가할 수 있다.

```javascript
const user = await User.fineOne({});
const comment1 = await Comment.create();
const comment2 = await Comment.create();
await user.addComment([comment1, comment2]);
```
> 관계 쿼리 메서드의 인수로 추가할 댓글 모델을 넣거나 댓글의 아이디를 넣으면 된다. 수정이나 삭제도 마찬가지이다. 

***

##### 7.6.4.2 SQL 쿼리하기

- 시퀄라이즈의 쿼리를 사용하기 싫거나, 어떻게 해야할지 모르겠다면 직접 SQL 문을 통해 쿼리할 수도 있다.

```JAVASCRIPT
const [result, metadata] = await sequelize.query('SELECT * from comments');
console.log(result);
```

> 웬만하면 시퀄라이즈의 쿼리를 사용하는 것을 추천하지만, 시퀄라이즈 쿼리로 할 수 없는 경우에는 위와 같이 하면 된다.

***

