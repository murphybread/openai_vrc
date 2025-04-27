// ES 모듈 방식
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

// ── 모듈 스코프(핫 스타트 시 재사용) ───────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SYSTEM_ROLE = "당신은 고대의 지혜를 지닌 마법사입니다. 마법의 주문과 신비로운 이야기를 통해 사람들에게 영감을 주는 역할을 합니다.";
const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8",
};

// ────────────────────────────────────────────────────────────────

// 인메모리 작업 스토어
const jobs = {};
function generateJobId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

const ItemSchema = z.object({
  spell: z.string(),
  cost: z.number(),
  description: z.string(),
  damage: z.number(),
});

export async function handler(event) {
  // 1) GET 이외는 바로 거절
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: HEADERS,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  // 2) 엔드포인트 추출
  const endpoint = event.path.split("/api/")[1] || "";
  // 2.1) DALL·E3 작업 생성: GET /api/dalle3/create?userInput=...
  if (endpoint === "dalle3/create") {
    const prefix = "Illustrate with a magical, ethereal art style: ";
    const raw = event.queryStringParameters?.userInput;
    if (!raw) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: "Missing userInput parameter" }),
      };
    }
    const prompt = prefix + decodeURIComponent(raw);
    const jobId = generateJobId();
    jobs[jobId] = { status: "pending" };
    // 백그라운드로 이미지 생성 호출
    (async () => {
      try {
        const res = await openai.images.generate({
          model: "dall-e-3",
          prompt,
          quality: "standard",
          n: 1,
        });
        jobs[jobId] = { status: "complete", url: res.data[0].url };
      } catch (e) {
        jobs[jobId] = { status: "error", error: e.message };
      }
    })();
    return {
      statusCode: 202,
      headers: HEADERS,
      body: JSON.stringify({ jobId }),
    };
  }

  // 2.2) DALL·E3 작업 상태 조회: GET /api/dalle3/status?jobId=...
  if (endpoint === "dalle3/status") {
    const jobId = event.queryStringParameters?.jobId;
    const job = jobs[jobId];
    if (!job) {
      return {
        statusCode: 404,
        headers: HEADERS,
        body: JSON.stringify({ error: "Unknown jobId" }),
      };
    } else if (job.status !== "complete") {
      return {
        statusCode: 202,
        headers: HEADERS,
        body: JSON.stringify({ status: job.status }),
      };
    } else if (job.status === "complete") {
      const imageUrl = job.url;
      return {
        statusCode: 302,
        headers: {
          ...HEADERS,
          Location: imageUrl,
        },
      };
    }
  }

  // 3) OmoshiroikotoItte 전용 로직
  if (endpoint === "OmoshiroikotoItte") {
    // 단축: userInput 이 없으면 기본 메시지
    const raw = event.queryStringParameters?.userInput;
    const userMessage = raw ? decodeURIComponent(raw) : "나만의 특별한 마법 주문을 만들어주세요.";

    try {
      // OpenAI 호출
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_ROLE },
          { role: "user", content: userMessage },
        ],
        max_completion_tokens: 350,
      });
      const text = res.choices[0].message.content;

      return {
        statusCode: 200,
        headers: HEADERS,
        // pretty-print 제거 → 바이트·파싱 오버헤드 최소화
        body: JSON.stringify({ message: text }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: HEADERS,
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  // 3.5) Structured Outputs 엔드포인트: /api/structed
  if (endpoint === "structed") {
    const raw = event.queryStringParameters?.userInput;
    const userMessage = raw ? decodeURIComponent(raw) : "나만의 특별한 마법 주문을 만들어주세요.";

    try {
      const completion = await openai.beta.chat.completions.parse({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Please output a JSON object with a single field `spell` containing your magic incantation." },
          { role: "user", content: userMessage },
        ],
        response_format: zodResponseFormat(ItemSchema, "magic"),
      });

      return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify(completion.choices[0].message.parsed),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: HEADERS,
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  // 5) 그 외 엔드포인트 (루트 응답)
  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({ message: "Hello Netlify Functions!" }),
  };
}
