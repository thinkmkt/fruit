export async function onRequest(context) {
  const { env } = context

  const clientId = env.CODEF_CLIENT_ID
  const clientSecret = env.CODEF_CLIENT_SECRET

  // 1. env 변수 확인
  const envCheck = {
    CODEF_CLIENT_ID: clientId ? `${clientId.slice(0, 8)}...` : 'MISSING',
    CODEF_CLIENT_SECRET: clientSecret ? `${clientSecret.slice(0, 8)}...` : 'MISSING',
  }

  // 2. 토큰 발급
  let token = null
  let tokenError = null
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
    const data = JSON.parse(text)
    token = data.access_token
  } catch (e) {
    tokenError = e.message
  }

  // 3. 실제 CODEF API 호출 테스트
  let codefResult = null
  if (token) {
    try {
      const res = await fetch(
        'https://development.codef.io/v1/kr/public/nt/tax-invoice/sales-purchase-statistics',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            organization: '0002',
            loginType: '5',
            loginTypeLevel: '1',
            userName: '홍길동',
            loginIdentity: 'dGVzdA==',
            phoneNo: '01012345678',
            inquiryType: '01',
            searchType: '01',
            startDate: '202401',
            endDate: '202401',
            type: '0',
            identity: '',
            telecom: '0',
          }),
        }
      )
      const text = await res.text()
      let decoded = text
      try { decoded = decodeURIComponent(text) } catch {}
      codefResult = { httpStatus: res.status, body: decoded.slice(0, 300) }
    } catch (e) {
      codefResult = { error: e.message }
    }
  }

  return new Response(
    JSON.stringify({ envCheck, tokenOk: !!token, tokenError, codefResult }, null, 2),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}
