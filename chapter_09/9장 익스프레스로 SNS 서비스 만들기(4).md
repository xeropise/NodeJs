## 9.4 multer 패키지로 이미지 업로드 구현하기

- SNS 서비스인 만큼 이미지 업로드도 중요하다. multer 모듈을 사용해 멀티 파트 형식의 이미지 업로드를 해보자.

- 패키지를 먼저 설치하자.

```
$ npm i multer
```

- 이미지를 어떻게 저장할 것인지는 서비스의 특성에 따라 달라진다. NodeBird 서비스는 input 태그를 통해 이미지를 선택할 때, 바로 업로드를 진행하고, 업로드 된 사진 주소를 다시 클라이언트에 알릴 것이다. 게시글을 저장할 때는 데이터베이스에 직접 이미지 데이터를 넣는 대신 이미지 경로만 저장한다. 이미지는 서버 디스크에 저장된다.

- post 라우터를 작성해 보자.

_routes/post.js_

```javascript
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { Path, Hashtag, Post } = require("../models");
const { isLoggedIn } = require("./middlewares");

const router = express.Router();

try {
  fs.readFileSync("uploads");
} catch (error) {
  console.error("uploads 폴더가 없어 uploads 폴더를 생성한다.");
  fs.mkdirSync("uploads");
}

const uplaod = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, "/uploads/");
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/img", isLoggedIn, upload.single("img"), (req, res) => {
  console.log(req.file);
  res.json({ url: `/img/${req.file.filename}` });
});

const uploads2 = multer();

router.post("/", isLoggedIn, uploads2.none(), async (req, res, next) => {
  try {
    const post = await Post.create({
      content: req.body.content,
      img: req.body.url,
      UserId: req.user.id,
    });

    const hashtags = req.body.content.match(/#[^\s#]+/g);
    if (hashtags) {
      const result = await Promise.all(
        hashtags.map((tag) => {
          return Hashtag.findOrCreate({
            where: { title: tag.slice(1).toLowerCase() },
          });
        })
      );
      await post.addHashtags(result.map((r) => r[0]));
    }
    res.redirect("/");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
```

- POST /post/img 라우터에서는 이미지 하나를 업로드 받은 뒤, 이미지의 저장 경로를 클라이언트로 응답한다. static 미들웨어가 /img 경로의 정적 파일을 제공하므로 클라이언트에서 업로드한 이미지에 접근할 수 있다.

- POST /post 라우터는 게시글 업로드를 처리하는 라우터이다. 이전 라우터에서 이미지를 업로드 했다면, 이미지 주소도 req.body.url 로 전송된다. 비록 데이터 형식이 multipart 이지만, 이미지 데이터가 들어 있지 않으므로 none 메서드를 사용했다.

- 이미지 주소가 온 것일 뿐, 이미지 데이터 자체가 오지는 않았다. 이미지는 이미 POST /post/img 라우터에서 저장되었다.

- 게시글을 데이터베이스에 저장한 후, 게시글 내용에서 해시태그를 정규표현식으로 추출해 낸다. 추출한 해시태그는 데이터베이스에 저장하는데, 먼저 slice(1).toLowerCase() 를 사용해 해시태그에서 #을 떼어내고 소문자로 바꾼다. 저장할 때는 findOrCrate 메서드를 사용하였다. (해시태그가 존재하면 가져오고, 존재하지 않으면 생성) 결과값으로 [모델, 생성 여부] 를 반환하는데 map 으로 모델만 추출해 냈다. 마지막으로 해시태그 모델들을 post.addHasgtags 메서드로 게시글과 연결하였다.

> 실제 서버 운영시 multer 사용
```
현재 multer 패키지는 이미지를 서버 디슼에 저장하는데, 디스크에 저장하면 간단하기는 하지만 서버에 문제가 생겼을 때 이미지가 제공되지 않거나 손실될 수도 있다. 따라서 AWS S3이나 클라우드 스토리지 같은 정적 파일 제공 서비스를 사용하여 이미지를 따로 저장하고 제공하는 것이 좋다. 16장에서 알아 보자.
```

- 게시글 작성 기능이 추가되었으므로, 메인 페이지 로딩 시 메인 페이지와 게시글을 함께 로딩하도록 하자

_routes/page.js_

```javascript
const express = require("express");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");
const { Post, User } = require("../models");

const router = express.Router();

(...)

router.get("/", (req, res, next) => {
  try {
    const posts = await Post.findAll({
      include: {
        model: User,
        attribute: ['id', 'nick'],
      },
      order: [['cratedAt', 'DESC']],
    });
    res.render("main", {
      title: "NodeBird",
      twits: posts,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;
```

- 데이터베이스에서 게시글을 조회한 뒤 결과를 twits 에 넣어 렌더링한다. 조회할 때 게시글 작성자와 아이디와 닉네임을 JOIN 해서 제공하고, 게시글의 순서는 최신순으로 정렬했다. 

