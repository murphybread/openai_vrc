// ES 모듈 방식를 위한 CommonJS 래퍼
import OpenAI from "openai";

// Netlify Functions는 기본적으로 handler 함수를 export해야 합니다
export async function handler(event, context) {
  console.log("Request path:", event.path); // 디버깅을 위한 로그 추가

  // CORS 헤더 설정
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };

  // GET 요청에 대한 기본 응답
  if (event.httpMethod === "GET") {
    // URL에서 /api/ 이후의 경로 추출
    const pathSegments = event.path.split("/api/");
    const endpoint = pathSegments.length > 1 ? pathSegments[1] : "";

    console.log("Endpoint:", endpoint); // 디버깅을 위한 로그 추가

    if (endpoint === "OmoshiroikotoItte") {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const systemRole = "あなたは超一流コメディアンとしてふるまってください。";
        const message = "何か面白いことを言ってください。";

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemRole },
            { role: "user", content: message },
          ],
        });

        const responseText = completion.choices[0].message.content;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(
            {
              message: responseText,
              debug: { path: event.path, endpoint: endpoint },
            },
            null,
            2
          ),
        };
      } catch (error) {
        console.error("OpenAI API 오류:", error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: "서버 오류가 발생했습니다: " + error.message,
            debug: { path: event.path, endpoint: endpoint },
          }),
        };
      }
    }

    // 루트 경로에 대한 응답
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Hello Netlify Functions!",
        debug: { path: event.path, endpoint: endpoint },
      }),
    };
  }

  // 지원하지 않는 HTTP 메서드에 대한 응답
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({
      error: "Method Not Allowed",
      debug: { path: event.path },
    }),
  };
}
