// ES 모듈 방식를 위한 CommonJS 래퍼
import OpenAI from "openai";

// Netlify Functions는 기본적으로 handler 함수를 export해야 합니다
export async function handler(event, context) {
  // CORS 헤더 설정
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };

  // GET 요청에 대한 기본 응답
  if (event.httpMethod === "GET") {
    // 경로에서 마지막 부분만 추출
    const pathParts = event.path.split("/");
    const endpoint = pathParts[pathParts.length - 1];

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

        // 응답 데이터에서 일본어 텍스트를 올바르게 처리하기 위해 JSON을 명시적으로 처리
        const responseText = completion.choices[0].message.content;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(
            {
              message: responseText,
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
          body: JSON.stringify({ error: "서버 오류가 발생했습니다: " + error.message }),
        };
      }
    }

    // 루트 경로에 대한 응답
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Hello Netlify Functions!",
        path: event.path,
        endpoint: endpoint,
      }),
    };
  }

  // 지원하지 않는 HTTP 메서드에 대한 응답
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: "Method Not Allowed" }),
  };
}
