export async function onRequest(context) {
  const { env } = context

  const clientId = env.CODEF_CLIENT_ID
  const clientSecret = env.CODEF_CLIENT_SECRET

  // env 변수 확인
  const envCheck = {
    CODEF_CLIENT_ID: clientId ? `${clientId.slice(0, 8)}...` : 'MISSING',
    CODEF_CLIENT_SECRET: clientSecret ? `${clientSecret.slice(0, 8)}...` : 'MISSING',
  }

  // 토큰 발급 시도
  let tokenResult = null
  if (clientId && clientSecret) {
    try {
      const credentials = btoa(`${clientId}:${clientSecret}`)
      const res = await fetch('https://oauth.codef.io/oauth/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials&scope=read',
      })
      const text = await res.text()
      tokenResult = {
        status: res.status,
        ok: res.ok,
        preview: text.slice(0, 100),
      }
    } catch (e) {
      tokenResult = { error: e.message }
    }
  }

  return new Response(JSON.stringify({ envCheck, tokenResult }, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
