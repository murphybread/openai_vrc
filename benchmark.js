import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const URL = "https://openaivrctest.netlify.app/api/OmoshiroikotoItte?userInput=abcd";
const ROUNDS = 10;
const LOG_PATH = path.resolve(process.cwd(), "log");

async function measure(url, rounds = ROUNDS) {
  const times = [];
  const charSpeeds = [];

  // 1) 로그 초기화
  fs.writeFileSync(LOG_PATH, `Benchmark started at ${new Date().toISOString()}\n`, "utf-8");

  // 2) 곧바로 측정 시작
  for (let i = 0; i < rounds; i++) {
    const start = Date.now();

    // 요청 및 JSON 파싱
    const res = await fetch(url);
    const data = await res.json(); // { message: "..." }
    const elapsed = Date.now() - start; // ms
    const length = data.message.length; // 문자 수
    const speedPerChar = elapsed / length; // ms/문자

    times.push(elapsed);
    charSpeeds.push(speedPerChar);

    // 3) 로그에 한 줄씩 기록
    fs.appendFileSync(LOG_PATH, `Request ${i + 1}: ${elapsed} ms | length: ${length} chars | ${speedPerChar.toFixed(2)} ms/char\n`, "utf-8");
  }

  // 4) 전체 평균 계산
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const avgSpeed = charSpeeds.reduce((a, b) => a + b, 0) / charSpeeds.length;

  // 5) 요약 로그
  const summary =
    [
      `\n=== Summary over ${rounds} runs ===`,
      `Average response time: ${avgTime.toFixed(2)} ms`,
      `Average speed per char: ${avgSpeed.toFixed(2)} ms/char`,
    ].join("\n") + "\n";

  fs.appendFileSync(LOG_PATH, summary, "utf-8");

  // 6) 콘솔 출력
  console.log(summary);
}

measure(URL).catch((err) => {
  console.error(err);
  fs.appendFileSync(LOG_PATH, `Error: ${err.message}\n`, "utf-8");
});
