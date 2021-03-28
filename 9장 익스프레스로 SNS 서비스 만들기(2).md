sync- 이번 엔 MySQL 과 시퀄라이즈로 데이터베이스를 설정 하자.

- 로그인 기능이 있으므로, 사용자 테이블이 필요하고, 게시글을 저장할 게시글 테이블도 필요하고, 해시태그를 사용하므로 해시테그 태이블도 필요하다. 팔로잉 기능은 조금 있다가 설명

- models 폴더 안에 users.js 와 post.js, hashtag.js 를 생성하자.


_models/user.js_

```javascript
const Sequelize = require("sequelize");

module.exports = class User extends (
  Sequelize.Model
) {
  static init(sequelize) {
    return super.init(
      {
        email: {
          type: Sequelize.STRING(40),
          allowNull: true,
          unique: true,
        },
        nick: {
          type: Sequelize.STRING(15),
          allowNull: false,
        },
        password: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        provider: {
          type: Sequelize.STRING(10),
          allowNull: false,
          defaultValue: "local",
        },
        snsId: {
          type: Sequelize.STRING(30),
          allowNull: true,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: "User",
        tableName: "users",
        paranoid: true,
        charset: "utf8",
        collate: "utf8_general_ci",
      }
    );
  }

  static associate(db) {
    });
  }
};

```
> 사용자 정보를 저장하는 모델로, 이메일, 닉네임, 비밀번호를 저장하고, SNS 로그인을 했을 경우에는 provider 와 snsId 를 저장한다. provider 가 local 이면 로컬 로그인을 한 것이고, kakao 면 카카오 로그인을 한 것이다. 기본적으로 로컬 로그인이라 가정해서 defaultValue를 local로 주었다.

_models/post.js_
```javascript
const Sequelize = require("sequelize");

module.exports = class Post extends (
  Sequelize.Model
) {
  static init(sequelize) {
    return super.init(
      {
        content: {
          type: Sequelize.STRING(140),
          allowNull: false,
        },
        img: {
          type: Sequelize.STRING(200),
          allowNull: true,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: "Post",
        tableName: "posts",
        paranoid: false,
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
      }
    );
  }

  static associate(db) {
  }
};

};
```
- 게시글 모델은 게시글 내용과 이미지 경로를 저장한다. 게시글 등록자의 아이디를 담은 컬럼은 나중에 관계를 설정할 때 시퀄라이즈가 알아서 생성한다.

_models/hashtag.js_
```javascript
const Sequelize = require("sequelize");

module.exports = class Hashtag extends (
  Sequelize.Model
) {
  static init(sequelize) {
    return super.init(
      {
        title: {
          type: Sequelize.STRING(15),
          allowNull: false,
          unique: true,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: "Hashtag",
        tableName: "hashtags",
        paranoid: false,
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
      }
    );
  }

  static associate(db) {
  }
};

```

- 생성한 모델들을 시퀄라이즈에 등록하자. models/index.js 에는 시퀄라이즈가 자동으로 생성한 코도들이 들어 있을 것이다. 그것을 통째로 바꾸자.

_models/index.js_

```javascript
const Sequelize = require("sequelize");
const env = process.env.NODE_ENV || "development";
const config = require("../config/config")[env];
const User = require("./user");
const Post = require("./post");
const Hashtag = require("./hashtag");

const db = {};
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

db.sequelize = sequelize;
db.User = User;
db.Post = Post;
db.Hashtag = Hashtag;

User.init(sequelize);
Post.init(sequelize);
Hashtag.init(sequelize);

User.associate(db);
Post.associate(db);
Hashtag.associate(db);

module.exports = db;
```
> 각 모델들을 시퀄라이즈 객체에 연결했다.

- 이번엔 각 모델 간의 관계를 associate 함수 안에 정의해 보자.

_models/user.js_

```javascript
(...)

  static associate(db) {
    db.User.hasMany(db.Post);
    db.User.belongsToMany(db.User, {
      foreignKey: "followingId",
      as: "Followers",
      through: "Follow",
    });
    db.User.belongsToMany(db.User, {
      foreignKey: "followerId",
      as: "Followings",
      through: "Follow",
    });
  }
};
```
> User 모델과  Post 모델은 1대다 관계에 있으므로 hasMany로 연결, user.getPosts, user.addPosts 같은 관계 메서드 들이 생긴다.

<br>

> 같은 모델끼리도 다대다 관계를 가질 수 있다. 같은 테이블 간 다대다 관계에서는 모델 이름과 컬럼 이름을 따로 정해야 한다. through  옵션을 사용해 모델 이름을 Follow 로 정했다.

<br>

> Follow 모델에서 사용자 아이디를 저장하는 컬럼 이름이 둘 다 UserId면 누가 팔로워고 누가 팔로잉 인지 구분되지 않으므로 따로 설정해야 한다. foreignKey 옵션에 각각 followerId, followingId 를 넣어줘서 두 사용자 아이디를 구별했다.

<br>

> 같은 테이블 간의 다대다 관계에서는 as 옵션도 넣어야한다. 둘다 User 모델이라 구분되지 않기 떄문이다. 주의할 점은 as 는 foreignKey 와 반대되는 모델을 가리킨다는 것이다. foreignKey가 followerId 면 as 는 Followings 고, foreignKey가 followingId 면 as는 Followers 여야 한다. Followers 를 찾으려면 먼저 팔로잉하는 사람의 아이디(followerId)를 찾아야 하는 것이라고 생각하면 된다.

- as에 특정한 이름을 지정했으니 use.getFollowers, user.getFollowings 같은 관계 메서드를 사용할 수 있다. include 시에도 as에 같은 값을 넣으면 관계 쿼리가 작동한다.

<br>

- Post 모델도 작성해 보자.

_models/post.js_
```javascript
(...)

  static associate(db) {
    db.Post.belongsTo(db.user);
    db.post.belongsToMany(db.Hashtag, { through: "PostHashtag" });
  }

(...)  
```
> User 모델과 Post 모델은 1 (User) 대 다 (Post) 관계이므로 belongsTo로 연결되어 있다. 시퀄라이즈는 Post 모델에 User 모델의 id를 가리키는 UserId 컬럼을 추가한다. 어디에 컬럼이 추가되는 것인지 관계를 생각해보면 쉽다. 사용자가 한 명이고, 그에 속한 게시글이 여러 개이므로 각각의 게시글의 주인이 누구인지 넣어야 한다. belongsTo 는 게시글에 붙는다. post.getUser, post.addUser 같은 관계 메서드가 생성된다.

- Post 모델과 Hasgtag 모델은 다 대 다 관계이다. PostHashtag 라는 중간 모델이 생기고, 각각 postId와 hashtagId 라는 foreignKey 도 추가 된다. as는 따로 지정하지 않았으니  post.getHasgtags, post.addHasgtags, hasgtags.getPosts 같은 기본 이름이 관계 메서드들이 생성된다.

_models/hashtag.js_
```javascript
(...)

  static associate(db) {
    db.HashTag.belongsToMany(db.Post, { through: "PostHashtag" });
  }

(...)  
```

- NodeBird 의 모델은 총 다섯 개, 직접 생성한 User, Hasgtag, Post 와 시퀄라이즈가 관계를 파악하여 생성한 PostHashtag, Follow 가지 이다.

- 자동 생성된 모델도 다음과 같이 접근할 수 있다. 다음 모델을 통해 쿼리 호출이나 관계 메서드 사용도 가능하다.

```javascript
db.sequelize.models.PostHasgtag
de.sequelize.models.Follow
```

- 이제 생성한 모델을 데이터베이스 및 서버와 연결하자. 아직 데이터베이스를 만들지 않았으므로 데이터베이스부터 만들자. 데이터베이스의 이름은 nodebird 이다.

- 7장에서는 MySQL 프롬프트를 통해 SQL 문으로 데이터베이스를 만들었지만, 시퀄라이즈는 config.json 을 읽어 데이터베이스를 생성해주는 기능이 있다. config.json 을 먼저 수정하자. MySQL 비밀번호를 password 에 넣고, 데이터베이스 이름을 nodebird로 바꾸자. 자동 생성한 config.json 에 operatorAliases 속성이 들어 있다면 삭제하자.

_config/config.json_
```json
{
  "development": {
    "username": "root",
    "password": "0000",
    "database": "nodebird",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
}
```

- 콘솔에서 npx sequlieze db:create 명령어를 입력하면 데이터베이스가 생성된다.

```
$ npx sequlieze db:create
```

> 명령어를 실행하였지만, 내 생각대로 경로를 찾이 못했다.. 일단 폴더를 옮겨서 진행했다. 나중에 전문적으로 쓰게 되면찹아보자. 

- 데이터베이스를 생성했으니, 모델을 서버와 연결하자.

_app.js_

```javascript
(...)

const { sequelize } = require("./models");

const app = express();
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

(...)
```

- 서버 쪽 세팅이 완료되었으니 서버를 실행해 보자. 시퀄라이즈는 테이블 생성 쿼리문에 IF NOT EXISTS 를 넣어주므로, 테이블이 없을 때 테이블을 자동으로 생성한다.

- 데이터베이스 세팅이 완료되었으므로, 사용자 정보를 저장할 수 있다. 이제 로그인을 구현하자.