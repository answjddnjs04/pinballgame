export async function onRequest(context) {
  const targetId = 'ball_tournament';
  const url = `https://www.instagram.com/${targetId}/`;

  try {
    // 1. 인스타그램 프로필 페이지 Fetch (서버 사이드 요청)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!response.ok) throw new Error('인스타그램 접근 실패');

    const html = await response.text();
    
    // 2. 메타 태그에서 팔로워 수 추출 (정규식 사용)
    // 인스타그램은 "<meta content="1,234 Followers..." 형태의 태그를 가집니다.
    const followerMatch = html.match(/"edge_followed_by":{"count":(\d+)}/);
    let followers = 0;

    if (followerMatch) {
      followers = parseInt(followerMatch[1]);
    } else {
      // 대체 패턴 (비로그인 상태 메타 태그)
      const metaMatch = html.match(/content="([\d,.]+[KMB]?) Followers/);
      if (metaMatch) {
        followers = parseFollowers(metaMatch[1]);
      }
    }

    return new Response(JSON.stringify({ followers }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ followers: 0, error: error.message }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 1.2K 등을 숫자로 변환하는 유틸리티
function parseFollowers(str) {
  str = str.replace(/,/g, '');
  if (str.endsWith('K')) return parseFloat(str) * 1000;
  if (str.endsWith('M')) return parseFloat(str) * 1000000;
  return parseInt(str);
}
