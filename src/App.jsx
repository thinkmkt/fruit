import { useState, useEffect } from 'react'
import { JSEncrypt } from 'jsencrypt'
import './App.css'

const ENDPOINT = '/api/v1/kr/public/nt/tax-invoice/sales-purchase-statistics'

const CODEF_PUBLIC_KEY =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAj1+YQYyEz1V01m4GIDrn' +
  'sw0BMz6cKiO6g6smRobDxpmPqfet7IgoH09aIud+pvwuEubJ6dbnE9Fzb4+isd0/' +
  'PXYffXSY3sPZB4lNOz1QCJ832SISFrQnpifsSgy5IUWA2tdJMwlKENEbODfa41/+' +
  'v64xMllQO6x6swALpkx8OPT9ArIJU2g/+yBl5HEoNj1AvlpPRIqlzjCdiZzw3Lr' +
  'WZb6slWRptaxq6L5cvAaWt09GRHTQJjge0R/zHKCZ2aanTHzDmZwuJDWBMIdRJR2' +
  'sLNl0RSrHxxKe2AQSCTr62bd38etmvlKinboMW2fh5eMCFaYO9nCrxzWdaJLdIsI' +
  'nlwIDAQAB'

function rsaEncrypt(plaintext) {
  const enc = new JSEncrypt()
  enc.setPublicKey(CODEF_PUBLIC_KEY)
  return enc.encrypt(plaintext) || plaintext
}

// ── API ──────────────────────────────────────────────────────────────────────

async function apiPost(body, timeout) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
  })
  const text = await res.text()
  if (!res.ok) {
    let detail = ''
    try {
      const j = JSON.parse(text)
      detail = j.error || j.message || JSON.stringify(j)
    } catch {
      detail = text.slice(0, 200)
    }
    throw new Error(`서버 오류 (HTTP ${res.status}): ${detail}`)
  }
  return JSON.parse(text)
}

// ── StepBar ──────────────────────────────────────────────────────────────────

function StepBar({ step }) {
  const labels = ['인증 요청', '카카오 인증', '결과 확인']
  return (
    <div className="step-bar">
      {labels.map((label, i) => {
        const n = i + 1
        const isDone = step > n
        const isActive = step === n
        return (
          <>
            <div key={`item-${i}`} className={`step-item ${isActive ? 'active' : isDone ? 'done' : ''}`}>
              <div className="step-circle">{isDone ? '✓' : n}</div>
              <span className="step-label">{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div key={`line-${i}`} className={`step-line ${isDone ? 'done' : ''}`} />
            )}
          </>
        )
      })}
    </div>
  )
}

// ── Step 1: Request Form ──────────────────────────────────────────────────────

function RequestForm({ form, onChange, onSubmit, loading, error }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="icon-wrap blue">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="2"/>
            <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2>인증 요청 발송</h2>
        <p>고객 정보를 입력하면 카카오 간편인증을 발송합니다</p>
      </div>

      <div className="form-section">
        <label className="form-label">고객명</label>
        <input
          className="form-input"
          name="userName"
          value={form.userName}
          onChange={onChange}
          placeholder="홍길동"
        />
      </div>

      <div className="form-section">
        <label className="form-label">주민등록번호 앞 9자리</label>
        <input
          className="form-input"
          name="loginIdentity"
          value={form.loginIdentity}
          onChange={onChange}
          placeholder="생년월일 6자리 + 뒷자리 1번째"
          maxLength={9}
        />
      </div>

      <div className="form-section">
        <label className="form-label">휴대폰 번호</label>
        <input
          className="form-input"
          name="phoneNo"
          value={form.phoneNo}
          onChange={onChange}
          placeholder="01012345678"
          maxLength={11}
        />
      </div>

      <div className="form-row">
        <div className="form-section">
          <label className="form-label">조회 유형</label>
          <select className="form-input" name="inquiryType" value={form.inquiryType} onChange={onChange}>
            <option value="01">매출</option>
            <option value="02">매입</option>
          </select>
        </div>
        <div className="form-section">
          <label className="form-label">사업자 유형</label>
          <select className="form-input" name="type" value={form.type} onChange={onChange}>
            <option value="0">법인</option>
            <option value="1">개인</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-section">
          <label className="form-label">시작월</label>
          <input
            className="form-input"
            name="startDate"
            value={form.startDate}
            onChange={onChange}
            placeholder="202401"
            maxLength={6}
          />
        </div>
        <div className="form-section">
          <label className="form-label">종료월</label>
          <input
            className="form-input"
            name="endDate"
            value={form.endDate}
            onChange={onChange}
            placeholder="202412"
            maxLength={6}
          />
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <button className="btn-primary" onClick={onSubmit} disabled={loading}>
        {loading ? <span className="spinner" /> : '카카오 간편인증 발송'}
      </button>
    </div>
  )
}

// ── Step 2: Waiting Screen ────────────────────────────────────────────────────

function WaitingScreen({ onConfirm, onCancel, loading, error }) {
  const [seconds, setSeconds] = useState(0)
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    const t1 = setInterval(() => setSeconds(s => s + 1), 1000)
    const t2 = setInterval(() => setBlink(b => !b), 1400)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [])

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <div className="card">
      <div className="card-header">
        <div className={`icon-wrap kakao ${blink ? 'pulse' : ''}`}>
          {/* KakaoTalk bubble icon */}
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3C7.03 3 3 6.36 3 10.5c0 2.64 1.68 4.97 4.22 6.35L6 21l4.35-2.48c.53.07 1.08.11 1.65.11 4.97 0 9-3.36 9-7.5S16.97 3 12 3z"
              fill="#FFE400"
            />
          </svg>
        </div>
        <h2>카카오 간편인증 대기 중</h2>
        <p>고객의 카카오톡으로 인증 요청을 발송했습니다</p>
      </div>

      <div className="auth-status">
        <div className="status-timer">
          <span className="timer-label">경과 시간</span>
          <span className="timer-value">{mm}:{ss}</span>
        </div>

        <div className="status-steps">
          <div className="status-step done">
            <span className="status-dot done" />
            <span>인증 요청 발송 완료</span>
          </div>
          <div className={`status-step ${blink ? 'active' : ''}`}>
            <span className={`status-dot active ${blink ? 'pulse-dot' : ''}`} />
            <span>고객 카카오 인증 진행 중...</span>
          </div>
          <div className="status-step">
            <span className="status-dot" />
            <span>인증 완료 후 결과 조회</span>
          </div>
        </div>

        <div className="info-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#3182F6" strokeWidth="2" />
            <path d="M12 8v4M12 16h.01" stroke="#3182F6" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>고객이 카카오톡 인증을 완료한 후 아래 버튼을 눌러 결과를 조회하세요</span>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <button className="btn-primary" onClick={onConfirm} disabled={loading}>
        {loading ? <span className="spinner" /> : '인증 완료 · 결과 조회'}
      </button>
      <button className="btn-ghost" onClick={onCancel}>취소</button>
    </div>
  )
}

// ── Step 3: Results ───────────────────────────────────────────────────────────

function ResultsScreen({ results, onReset }) {
  const fmt = (v) => (v ? Number(v).toLocaleString('ko-KR') : '-')

  const typeLabel = results?.resType === '01' ? '매출' : results?.resType === '02' ? '매입' : results?.resType || '-'

  return (
    <div className="card">
      <div className="card-header">
        <div className="icon-wrap green">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="2" />
            <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2>조회 완료</h2>
        <p>세금계산서 통계 조회 결과입니다</p>
      </div>

      <div className="result-summary">
        <div className="result-row">
          <span className="result-label">유형</span>
          <span className="result-value">{typeLabel}</span>
        </div>
        <div className="result-row">
          <span className="result-label">조회 기간</span>
          <span className="result-value">{results?.resYearMonth || '-'}</span>
        </div>
        <div className="result-row">
          <span className="result-label">거래처 수</span>
          <span className="result-value">{results?.resPartnerCnt ? `${results.resPartnerCnt}개사` : '-'}</span>
        </div>
        <div className="result-row">
          <span className="result-label">발급 건수</span>
          <span className="result-value">{results?.resNumber ? `${results.resNumber}건` : '-'}</span>
        </div>
        <div className="result-row highlight">
          <span className="result-label">공급가액</span>
          <span className="result-value blue">{fmt(results?.resSupplyValue)}원</span>
        </div>
        <div className="result-row">
          <span className="result-label">세액</span>
          <span className="result-value">{fmt(results?.resTaxAmt)}원</span>
        </div>
      </div>

      {results?.resPartnerSpecList?.length > 0 && (
        <div className="partner-list">
          <h3>거래처별 상세</h3>
          <div className="partner-table">
            <div className="table-header">
              <span>사업자번호</span>
              <span>상호</span>
              <span>건수</span>
              <span className="text-right">공급가액</span>
            </div>
            {results.resPartnerSpecList.map((p, i) => (
              <div className="table-row" key={i}>
                <span className="mono">{p.resCompanyIdentityNo || '-'}</span>
                <span>{p.resCompanyNm || '-'}</span>
                <span>{p.resNumber ? `${p.resNumber}건` : '-'}</span>
                <span className="text-right">{fmt(p.resSupplyValue)}원</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="btn-primary" onClick={onReset}>새로운 조회</button>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

const INITIAL_FORM = {
  userName: '',
  loginIdentity: '',
  phoneNo: '',
  inquiryType: '01',
  searchType: '01',
  startDate: '',
  endDate: '',
  type: '0',
}

export default function App() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(INITIAL_FORM)
  const [savedBody, setSavedBody] = useState(null)
  const [twoWayInfo, setTwoWayInfo] = useState(null)
  const [results, setResults] = useState(null)

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  // Step 1 → 2: 최초 인증 요청
  const handleSend = async () => {
    if (!form.userName || !form.loginIdentity || !form.phoneNo || !form.startDate || !form.endDate) {
      setError('모든 항목을 입력해주세요.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const body = {
        organization: '0002',
        loginType: '5',
        loginTypeLevel: '1',
        userName: form.userName,
        loginIdentity: rsaEncrypt(form.loginIdentity),
        phoneNo: form.phoneNo,
        inquiryType: form.inquiryType,
        searchType: form.searchType,
        startDate: form.startDate,
        endDate: form.endDate,
        type: form.type,
        identity: '',
        telecom: '0',
      }
      const res = await apiPost(body, 300_000)
      const twoWay = res.data ?? res   // CODEF wraps in { result, data } or returns flat

      if (twoWay.continue2Way) {
        setSavedBody(body)
        setTwoWayInfo({
          jobIndex: twoWay.jobIndex,
          threadIndex: twoWay.threadIndex,
          jti: twoWay.jti,
          twoWayTimestamp: twoWay.twoWayTimestamp,
        })
        setStep(2)
      } else {
        const code = res.result?.code || ''
        const msg = res.result?.message || '간편인증 요청 응답을 받지 못했습니다.'
        setError(`${msg}${code ? ` (${code})` : ''}`)
      }
    } catch (e) {
      setError(e.message || '요청 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2 → 3: 인증 완료 확인 (스펙: simpleAuth, is2Way, twoWayInfo 만 전송)
  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      const body = {
        simpleAuth: '1',
        is2Way: true,
        twoWayInfo: {
          jobIndex: twoWayInfo.jobIndex,
          threadIndex: twoWayInfo.threadIndex,
          jti: twoWayInfo.jti,
          twoWayTimestamp: Number(twoWayInfo.twoWayTimestamp),
        },
      }
      const res = await apiPost(body, 270_000)
      const resultData = res.data ?? res
      setResults(resultData)
      setStep(3)
    } catch (e) {
      const msg = e.message || ''
      if (msg.includes('401')) {
        setError('고객이 아직 카카오 인증을 완료하지 않았습니다. 인증 완료 후 다시 시도해주세요.')
      } else {
        setError(msg || '인증 확인 중 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep(1)
    setForm(INITIAL_FORM)
    setError('')
    setSavedBody(null)
    setTwoWayInfo(null)
    setResults(null)
  }

  return (
    <div className="app">
      <div className="app-header">
        <span className="logo-text">세금계산서 조회</span>
      </div>

      <StepBar step={step} />

      {step === 1 && (
        <RequestForm
          form={form}
          onChange={handleChange}
          onSubmit={handleSend}
          loading={loading}
          error={error}
        />
      )}
      {step === 2 && (
        <WaitingScreen
          onConfirm={handleConfirm}
          onCancel={handleReset}
          loading={loading}
          error={error}
        />
      )}
      {step === 3 && (
        <ResultsScreen results={results} onReset={handleReset} />
      )}
    </div>
  )
}
