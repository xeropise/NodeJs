import { odd, even } from "./var";

function checkOddOrEven(num) {
  if (num % 2) {
    //홀수면
    return odd;
  }
  return even;
}

export default checkOddOrEven;

/*
    ES2015에서
    require 와 module.exports 가 import, export default 로 바뀌었다.
    노드에서도 9 버전부터 ES2015 모듈을 사용할 수 있으나, 파일 확장자를 mjs로 지정해야 하는 제한이 있다.
    js 확장자를 사용하면서 ES2015 모듈을 사용하려면 5장에서 배울 PACKAGE.JSON 에 type: "module" 속성을 넣으면 된다.
*/
