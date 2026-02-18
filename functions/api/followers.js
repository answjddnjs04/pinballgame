export async function onRequest(context) {
  const targetId = 'ball_tournament';
  const apiKey = 'f21ae81673msh35de0fed8957665p159f67jsn7d6978fee6d3'; // 제공해주신 API 키
  const apiHost = 'instagram-data1.p.rapidapi.com';
  
  const url = `https://${apiHost}/user/info?username=${targetId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': apiHost,
      }
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const data = await response.json();
    
    // API 응답 구조에 맞춰 팔로워 수 추출
    // 보통 instagram-data1 API는 data.follower_count 또는 data.edge_followed_by.count 형식을 사용합니다.
    let followers = 0;
    if (data.follower_count !== undefined) {
      followers = data.follower_count;
    } else if (data.edge_followed_by && data.edge_followed_by.count !== undefined) {
      followers = data.edge_followed_by.count;
    } else if (data.followers !== undefined) {
      followers = data.followers;
    }

    return new Response(JSON.stringify({ followers }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache' // 실시간성 유지
      }
    });
  } catch (error) {
    console.error("RapidAPI Error:", error);
    return new Response(JSON.stringify({ followers: 0, error: error.message }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
