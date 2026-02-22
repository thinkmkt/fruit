import { useState, useEffect } from 'react'
import { JSEncrypt } from 'jsencrypt'
import './App.css'

const ENDPOINT = '/api/v1/kr/public/nt/hometax/tax-payment-rebate-notice-arrearage'

const CODEF_PUBLIC_KEY =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAj1+YQYyEz1V01m4GIDrn' +
  'sw0BMz6cKiO6g6smRobDxpmPqfet7IgoH09aIud+pvwuEubJ6dbnE9Fzb4+isd0/' +
  'PXYffXSY3sPZB4lNOz1QCJ832SISFrQnpifsSgy5IUWA2tdJMwlKENEbODfa41/+' +
  'v64xMllQO6x6swALpkx8OPT9ArIJU2g/+yBl5HEoNj1AvlpPRIqlzjCdiZzw3Lr' +
  'WZb6slWRptaxq6L5cvAaWt09GRHTQJjge0R/zHKCZ2aanTHzDmZwuJDWBMIdRJR2' +
  'sLNl0RSrHxxKe2AQSCTr62bd38etmvlKinboMW2fh5eMCFaYO9nCrxzWdaJLdIsI' +
  'nlwIDAQAB'

const TELECOM_OPTIONS = [
  { value: '0', label: 'SKT' },
  { value: '1', label: 'KT' },
  { value: '2', label: 'LGU+' },
  { value: '3', label: '알뜰폰(SKT)' },
  { value: '4', label: '알뜰폰(KT)' },
  { value: '5', label: '알뜰폰(LGU+)' },
]

// 금액 필드 목록 (해당 필드는 숫자로 포맷)
const AMT_KEYS = ['resPayAmt', 'resRefundAmt', 'resNoticeAmt', 'resArrearAmt',
  'resTotalAmt', 'resAmount', 'resPaymentAmt', 'resArrearsAmt']

// 필드 한글 라벨 매핑
const FIELD_LABELS = {
  resTaxType: '세목',
  resTaxNm: '세목명',
  resTaxYear: '귀속연도',
  resTaxPeriod: '과세기간',
  resPayDate: '납부일자',
  resPayAmt: '납부금액',
  resPaymentAmt: '납부금액',
  resTotalAmt: '총금액',
  resAmount: '금액',
  resRefundDate: '환급일자',
  resRefundAmt: '환급금액',
  resNoticeDate: '고지일자',
  resPublishDate: '발행일자',
  resNoticeAmt: '고지금액',
  resDueDate: '납부기한',
  resArrearDate: '체납발생일',
  resArrearAmt: '체납금액',
  resArrearsAmt: '체납금액',
  resGovName: '관할기관',
  resOffice: '세무서',
  resDetailContent: '내용',
  resContent: '내용',
  resTaxCode: '세목코드',
  resYear: '연도',
  resYearMonth: '기간',
  resSeq: '순번',
}

function rsaEncrypt(plaintext) {
  const enc = new JSEncrypt()
  enc.setPublicKey(CODEF_PUBLIC_KEY)
  return enc.encrypt(plaintext) || plaintext
}

async function apiPost(body, timeout) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

function fmtAmt(v) {
  if (v === undefined || v === null || v === '') return '-'
  const n = Number(v)
  if (isNaN(n)) return v
  return n.toLocaleString('ko-KR') + '원'
}

function fmtDate(v) {
  if (!v || v.length < 8) return v || '-'
  return `${v.slice(0, 4)}.${v.slice(4, 6)}.${v.slice(6, 8)}`
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
            <path d="M9 12h6M9 16h6M9 8h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z"
              stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h2>세금 조회 요청</h2>
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
        <label className="form-label">주민등록번호 (13자리)</label>
        <input
          className="form-input"
          name="identity"
          value={form.identity}
          onChange={onChange}
          placeholder="8501011234567"
          maxLength={13}
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
          <label className="form-label">통신사</label>
          <select className="form-input" name="telecom" value={form.telecom} onChange={onChange}>
            {TELECOM_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="form-section">
          <label className="form-label">조회연도</label>
          <input
            className="form-input"
            name="year"
            value={form.year}
            onChange={onChange}
            placeholder="2024"
            maxLength={4}
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

// ── DataTable: 목록 테이블 ──────────────────────────────────────────────────

function DataTable({ items, emptyMsg }) {
  if (!items || items.length === 0) {
    return <div className="empty-msg">{emptyMsg || '조회된 내역이 없습니다.'}</div>
  }

  // 첫 번째 아이템에서 표시할 키 목록 추출 (resSeq, res로 시작하는 필드들)
  const allKeys = Object.keys(items[0]).filter(k => k !== 'resSeq')

  return (
    <div className="data-list">
      {items.map((item, idx) => (
        <div className="data-item" key={idx}>
          <div className="data-item-index">{idx + 1}</div>
          <div className="data-item-fields">
            {allKeys.map(k => {
              const raw = item[k]
              if (raw === undefined || raw === null || raw === '') return null
              const label = FIELD_LABELS[k] || k
              const isAmt = AMT_KEYS.includes(k)
              const isDate = k.toLowerCase().includes('date') || k.toLowerCase().includes('dt')
              const display = isAmt ? fmtAmt(raw) : isDate ? fmtDate(raw) : raw
              return (
                <div className="data-field" key={k}>
                  <span className="data-field-label">{label}</span>
                  <span className={`data-field-value ${isAmt ? 'amt' : ''}`}>{display}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Step 3: Results ───────────────────────────────────────────────────────────

const TABS = [
  { key: 'resPaymentSpecList', label: '납부내역', color: 'blue' },
  { key: 'resRefundList',       label: '환급내역', color: 'green' },
  { key: 'resNoticeDetailList', label: '고지내역', color: 'orange' },
  { key: 'resArrearsList',      label: '체납내역', color: 'red' },
]

function ResultsScreen({ results, onReset }) {
  const [activeTab, setActiveTab] = useState(0)

  const counts = TABS.map(t => (results?.[t.key]?.length ?? 0))

  return (
    <div className="card">
      <div className="card-header">
        <div className="icon-wrap green">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke="white" strokeWidth="2" />
            <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2>조회 완료</h2>
        <p>세금 납부·환급·고지·체납 내역입니다</p>
      </div>

      {/* 요약 카드 */}
      <div className="summary-grid">
        {TABS.map((t, i) => (
          <button
            key={t.key}
            className={`summary-card ${t.color} ${activeTab === i ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            <span className="summary-count">{counts[i]}</span>
            <span className="summary-label">{t.label}</span>
          </button>
        ))}
      </div>

      {/* 탭 */}
      <div className="tab-bar">
        {TABS.map((t, i) => (
          <button
            key={t.key}
            className={`tab-btn ${activeTab === i ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {t.label}
            {counts[i] > 0 && <span className="tab-badge">{counts[i]}</span>}
          </button>
        ))}
      </div>

      <DataTable
        items={results?.[TABS[activeTab].key]}
        emptyMsg={`${TABS[activeTab].label}이 없습니다.`}
      />

      <details className="raw-data">
        <summary>원본 데이터 (디버그)</summary>
        <pre>{JSON.stringify(results, null, 2)}</pre>
      </details>

      <button className="btn-primary" onClick={onReset}>새로운 조회</button>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

const INITIAL_FORM = {
  userName: '',
  identity: '',
  phoneNo: '',
  telecom: '0',
  year: new Date().getFullYear().toString(),
}

export default function App() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(INITIAL_FORM)
  const [twoWayInfo, setTwoWayInfo] = useState(null)
  const [results, setResults] = useState(null)

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  // Step 1 → 2: 최초 인증 요청
  const handleSend = async () => {
    if (!form.userName || !form.identity || !form.phoneNo || !form.year) {
      setError('모든 항목을 입력해주세요.')
      return
    }
    if (form.identity.length !== 13) {
      setError('주민등록번호 13자리를 정확히 입력해주세요.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const body = {
        organization: '0004',
        loginType: '5',
        loginTypeLevel: '1',
        userName: form.userName,
        identity: form.identity,
        phoneNo: form.phoneNo,
        telecom: form.telecom,
        year: form.year,
        id: '',
      }
      const res = await apiPost(body, 300_000)
      const twoWay = res.data ?? res

      if (twoWay.continue2Way) {
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

  // Step 2 → 3: 인증 완료 확인
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
      console.log('[CODEF 전체 응답]', JSON.stringify(res, null, 2))
      console.log('[resultData]', JSON.stringify(resultData, null, 2))
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
    setTwoWayInfo(null)
    setResults(null)
  }

  return (
    <div className="app">
      <div className="app-header">
        <span className="logo-text">세금 납부·환급 조회</span>
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
