const CODEF_BASE = 'https://development.codef.io'

export async function onRequest(context) {
  const { request, env, params } = context

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // /api/v1/... → https://development.codef.io/v1/...
  const pathSegments = params.path ?? []
  const targetUrl = `${CODEF_BASE}/${pathSegments.join('/')}`

  let body
  try {
    body = await request.text()
  } catch {
    body = ''
  }

  const codefRes = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.CODEF_TOKEN ?? ''}`,
    },
    body,
  })

  const resText = await codefRes.text()

  return new Response(resText, {
    status: codefRes.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
