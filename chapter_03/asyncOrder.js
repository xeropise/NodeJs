const fs = require("fs");

console.log("시작");
fs.readFile("./readMe2.txt", (err, data) => {
  if (err) {
    throw err;
  }
  console.log("1번", data.toString());
  fs.readFile("./readMe2.txt", (err, data) => {
    if (err) {
      throw err;
    }
    console.log("3번", data.toString());
    console.log("끝");
  });
});
