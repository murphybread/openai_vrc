// ES 모듈 방식를 위한 CommonJS 래퍼
import OpenAI from "openai";

// Netlify Functions는 기본적으로 handler 함수를 export해야 합니다
export async function handler(event, context) {
  console.log("Request path:", event.path);
  console.log("Query Params:", event.queryStringParameters); // 수신된 쿼리 파라미터 로그

  // CORS 헤더 설정 (동일)
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };

  // GET 요청에 대한 기본 응답
  if (event.httpMethod === "GET") {
    const pathSegments = event.path.split("/api/");
    const endpoint = pathSegments.length > 1 ? pathSegments[1] : "";

    console.log("Endpoint:", endpoint);

    if (endpoint === "OmoshiroikotoItte") {
      // 또는 새로운 엔드포인트 (예: "AskGPT")를 만들어도 좋습니다.
      try {
        // --- 사용자 입력 처리 시작 ---
        let userMessage = "나만의 특별한 마법 주문을 만들어주세요."; // 기본 메시지
        if (event.queryStringParameters && event.queryStringParameters.userInput) {
          // 'userInput' 이라는 쿼리 파라미터가 있으면 그 값을 사용
          userMessage = decodeURIComponent(event.queryStringParameters.userInput); // URL 디코딩
          console.log("Received user input:", userMessage);
        } else {
          console.log("No user input query parameter found, using default message.");
        }
        // --- 사용자 입력 처리 끝 ---

        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        // 시스템 역할은 그대로 두거나 필요에 따라 조정 가능
        const systemRole = "당신은 고대의 지혜를 지닌 마법사입니다. 마법의 주문과 신비로운 이야기를 통해 사람들에게 영감을 주는 역할을 합니다.";
        // 사용자의 메시지를 API 요청에 사용
        const message = userMessage;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemRole },
            { role: "user", content: message }, // 사용자의 입력으로 설정된 message 변수 사용
          ],
        });

        const responseText = completion.choices[0].message.content;

        // 응답 반환 (동일)
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: responseText }, null, 2),
        };
      } catch (error) {
        // 오류 처리 (동일, 디버그 정보 추가)
        console.error("OpenAI API 오류:", error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: "서버 오류가 발생했습니다: " + error.message,
            debug: { path: event.path, endpoint: endpoint, query: event.queryStringParameters },
          }),
        };
      }
    }

    // 다른 엔드포인트 또는 루트 경로 응답 (동일, 디버그 정보 추가)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Hello Netlify Functions!",
        debug: { path: event.path, endpoint: endpoint, query: event.queryStringParameters },
      }),
    };
  }

  // 지원하지 않는 메서드 (동일)
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({
      error: "Method Not Allowed",
      debug: { path: event.path },
    }),
  };
}
