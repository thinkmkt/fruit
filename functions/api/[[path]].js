const CODEF_BASE = 'https://development.codef.io'
const OAUTH_URL = 'https://oauth.codef.io/oauth/token'

async function getAccessToken(clientId, clientSecret) {
  if (!clientId || !clientSecret) {
    throw new Error('CODEF 인증 정보가 설정되지 않았습니다. (env: CODEF_CLIENT_ID, CODEF_CLIENT_SECRET)')
  }

  const credentials = btoa(`${clientId}:${clientSecret}`)
  const res = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=read',
  })

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`OAuth 토큰 발급 실패 (HTTP ${res.status})`)
  }

  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`OAuth 응답 파싱 실패: ${text.slice(0, 100)}`)
  }

  if (!data.access_token) {
    throw new Error(`access_token 없음: ${JSON.stringify(data).slice(0, 200)}`)
  }

  return data.access_token
}

export async function onRequest(context) {
  const { request, env, params } = context

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // OAuth 토큰 발급
  let token
  try {
    token = await getAccessToken(env.CODEF_CLIENT_ID, env.CODEF_CLIENT_SECRET)
  } catch (e) {
    return new Response(JSON.stringify({ error: `[토큰 오류] ${e.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  // /api/v1/... → https://development.codef.io/v1/...
  const pathSegments = params.path ?? []
  const targetUrl = `${CODEF_BASE}/${pathSegments.join('/')}`

  const body = await request.text()

  let codefRes
  try {
    codefRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body,
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: `[CODEF 요청 오류] ${e.message}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  const resText = await codefRes.text()

  // CODEF API는 응답을 URL인코딩으로 반환 → 디코딩
  let decoded
  try {
    decoded = decodeURIComponent(resText)
  } catch {
    decoded = resText
  }

  return new Response(decoded, {
    status: codefRes.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
