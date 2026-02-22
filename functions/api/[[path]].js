const CODEF_BASE = 'https://development.codef.io'
const OAUTH_URL = 'https://oauth.codef.io/oauth/token'

async function getAccessToken(clientId, clientSecret) {
  const credentials = btoa(`${clientId}:${clientSecret}`)
  const res = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=read',
  })
  if (!res.ok) throw new Error(`OAuth 토큰 발급 실패 (${res.status})`)
  const data = await res.json()
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

  // OAuth 토큰 자동 발급
  let token
  try {
    token = await getAccessToken(
      env.CODEF_CLIENT_ID,
      env.CODEF_CLIENT_SECRET
    )
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  // /api/v1/... → https://development.codef.io/v1/...
  const pathSegments = params.path ?? []
  const targetUrl = `${CODEF_BASE}/${pathSegments.join('/')}`

  const body = await request.text()

  const codefRes = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body,
  })

  const resText = await codefRes.text()

  // CODEF API는 응답을 URL인코딩으로 반환 → 디코딩 후 JSON으로 전달
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
