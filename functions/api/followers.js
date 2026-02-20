export async function onRequest(context) {
  // ---------------------------------------------------------
  // [수동 업데이트 설정] 
  // 팔로워 수를 직접 수정하려면 아래 숫자를 바꾸세요 (예: 500)
  // 0으로 두면 실시간 API 연동을 시도합니다.
  const MANUAL_COUNT = 3; 
  // ---------------------------------------------------------

  if (MANUAL_COUNT > 0) {
    return new Response(JSON.stringify({ followers: MANUAL_COUNT }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const targetId = 'ball_tournament';
  const apiKey = 'f21ae81673msh35de0fed8957665p159f67jsn7d6978fee6d3';
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

    if (!response.ok) throw new Error('API Fail');
    const data = await response.json();
    
    let followers = data.follower_count || (data.edge_followed_by && data.edge_followed_by.count) || 0;

    return new Response(JSON.stringify({ followers }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ followers: 0, error: error.message }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
