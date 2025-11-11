import { useMemo, useState } from 'react'
import './App.css'

type LighthouseCategory = {
  title?: string
  score?: number | null
}

type LighthouseAudit = {
  id?: string
  title?: string
  description?: string
  score?: number | null
  scoreDisplayMode?: string
  numericValue?: number
  numericUnit?: string
  displayValue?: string
  details?: {
    type?: string
    data?: string
    overallSavingsMs?: number
    items?: Array<Record<string, unknown>>
  }
}

type PageSpeedResponse = {
  lighthouseResult?: {
    fetchTime?: string
    categories?: Record<string, LighthouseCategory>
    audits?: Record<string, LighthouseAudit>
    fullPageScreenshot?: {
      screenshot?: { data?: string; mimeType?: string }
    }
  }
  loadingExperience?: {
    overall_category?: string
    metrics?: Record<string, { category?: string; percentile?: number }>
  }
  originLoadingExperience?: {
    overall_category?: string
    metrics?: Record<string, { category?: string; percentile?: number }>
  }
  analysisUTCTimestamp?: string
}

type FormState = {
  url: string
  strategy: 'mobile' | 'desktop'
  categories: string[]
  locale: string
  captchaToken: string
}

const CATEGORY_OPTIONS = [
  { value: 'performance', label: 'Performance' },
  { value: 'seo', label: 'SEO' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'best-practices', label: 'Best Practices' },
  { value: 'pwa', label: 'PWA' },
]

const STRATEGY_OPTIONS: Array<{ value: FormState['strategy']; label: string }> = [
  { value: 'mobile', label: '모바일' },
  { value: 'desktop', label: '데스크톱' },
]

const LAB_METRICS = [
  { id: 'first-contentful-paint', label: 'First Contentful Paint' },
  { id: 'largest-contentful-paint', label: 'Largest Contentful Paint' },
  { id: 'total-blocking-time', label: 'Total Blocking Time' },
  { id: 'cumulative-layout-shift', label: 'Cumulative Layout Shift' },
  { id: 'speed-index', label: 'Speed Index' },
  { id: 'interactive', label: 'Time to Interactive' },
]

const FIELD_METRIC_LABELS: Record<string, string> = {
  FIRST_CONTENTFUL_PAINT_MS: 'First Contentful Paint',
  FIRST_INPUT_DELAY_MS: 'First Input Delay',
  LARGEST_CONTENTFUL_PAINT_MS: 'Largest Contentful Paint',
  CUMULATIVE_LAYOUT_SHIFT_SCORE: 'Cumulative Layout Shift',
  INTERACTION_TO_NEXT_PAINT_MS: 'Interaction to Next Paint',
  EXPERIMENTAL_TIME_TO_FIRST_BYTE_MS: 'Time to First Byte',
}

const FIELD_CATEGORY_LABELS: Record<string, string> = {
  FAST: 'FAST',
  AVERAGE: 'AVERAGE',
  SLOW: 'SLOW',
  UNSPECIFIED: '데이터 부족',
}

const FIELD_CATEGORY_CLASS: Record<string, string> = {
  FAST: 'fast',
  AVERAGE: 'average',
  SLOW: 'slow',
}

const formatMilliseconds = (value?: number) => {
  if (value === undefined || Number.isNaN(value)) return '—'
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}초`
  }
  return `${Math.round(value)}ms`
}

const formatScore = (score?: number | null) => {
  if (score === undefined || score === null) return '—'
  return Math.round(score * 100)
}

const getScoreBand = (score?: number | null) => {
  if (score === undefined || score === null) return 'neutral'
  if (score >= 0.9) return 'good'
  if (score >= 0.5) return 'average'
  return 'poor'
}

const ensureDataUri = (raw?: string | null) => {
  if (!raw) return null
  return raw.startsWith('data:') ? raw : `data:image/jpeg;base64,${raw}`
}

function App() {
  const [form, setForm] = useState<FormState>({
    url: '',
    strategy: 'mobile',
    categories: ['performance'],
    locale: 'ko-KR',
    captchaToken: '',
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PageSpeedResponse | null>(null)
  const [showScreenshotModal, setShowScreenshotModal] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!form.url.trim()) {
      setError('분석할 URL을 입력해주세요.')
      return
    }

    const params = new URLSearchParams()
    params.append('url', form.url.trim())
    params.append('strategy', form.strategy)

    form.categories.forEach((category) => params.append('category', category))

    if (form.locale.trim()) {
      params.append('locale', form.locale.trim())
    }

    if (form.captchaToken.trim()) {
      params.append('captchaToken', form.captchaToken.trim())
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch(`/.netlify/functions/pagespeed?${params.toString()}`)
      const payload = await response.json()

      if (!response.ok) {
        const message =
          payload?.error ??
          payload?.message ??
          'PageSpeed Insights 호출에 실패했습니다. 잠시 후 다시 시도해주세요.'
        throw new Error(message)
      }

      setResult(payload as PageSpeedResponse)
    } catch (fetchError) {
      if (fetchError instanceof Error) {
        setError(fetchError.message)
      } else {
        setError('요청 중 알 수 없는 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const screenshotSrc = useMemo(() => {
    if (!result?.lighthouseResult) return null
    const audits = result.lighthouseResult.audits ?? {}
    const finalScreenshot = ensureDataUri(
      audits['final-screenshot']?.details?.data as string | undefined,
    )
    if (finalScreenshot) return finalScreenshot

    const thumbnail = ensureDataUri(
      audits['screenshot-thumbnails']?.details?.items?.[0]?.data as string | undefined,
    )
    if (thumbnail) return thumbnail

    const fullPage = ensureDataUri(
      result.lighthouseResult.fullPageScreenshot?.screenshot?.data as string | undefined,
    )
    return fullPage
  }, [result])

  const categoryScores = useMemo(() => {
    const categories = result?.lighthouseResult?.categories
    if (!categories) return []
    return Object.entries(categories).map(([key, info]) => ({
      id: key,
      title: info.title ?? key,
      score: info.score ?? null,
    }))
  }, [result])

  const labMetrics = useMemo(() => {
    const audits = result?.lighthouseResult?.audits
    if (!audits) return []
    return LAB_METRICS.map((metric) => {
      const audit = audits[metric.id]
      return {
        id: metric.id,
        label: audit?.title ?? metric.label,
        displayValue:
          audit?.displayValue ??
          (audit?.numericValue !== undefined
            ? audit.id === 'cumulative-layout-shift'
              ? audit.numericValue.toFixed(2)
              : formatMilliseconds(audit.numericValue)
            : '—'),
        score: audit?.score ?? null,
      }
    })
  }, [result])

  const fieldMetrics = useMemo(() => {
    const metrics = result?.loadingExperience?.metrics ?? result?.originLoadingExperience?.metrics
    if (!metrics) return []

    return Object.entries(metrics)
      .filter(([key]) => FIELD_METRIC_LABELS[key])
      .map(([key, value]) => {
        const categoryRaw = value.category ?? 'UNSPECIFIED'
        const categoryClass = FIELD_CATEGORY_CLASS[categoryRaw] ?? 'neutral'
        const categoryLabel = FIELD_CATEGORY_LABELS[categoryRaw] ?? categoryRaw
        const displayValue =
          key === 'CUMULATIVE_LAYOUT_SHIFT_SCORE'
            ? ((value.percentile ?? 0) / 100).toFixed(2)
            : formatMilliseconds(value.percentile)

        return {
          id: key,
          label: FIELD_METRIC_LABELS[key],
          value: displayValue,
          categoryLabel,
          categoryClass,
        }
      })
  }, [result])

  const opportunities = useMemo(() => {
    const audits = result?.lighthouseResult?.audits
    if (!audits) return []

    return Object.values(audits)
      .filter((audit) => audit?.details?.type === 'opportunity')
      .sort((a, b) => (b.details?.overallSavingsMs ?? 0) - (a.details?.overallSavingsMs ?? 0))
      .slice(0, 6)
      .map((audit, index) => ({
        id: audit.id ?? `${audit.title ?? 'opportunity'}-${index}`,
        title: audit.title ?? '기회',
        description: audit.description ?? '',
        savings: audit.details?.overallSavingsMs ?? 0,
      }))
  }, [result])

  const fetchTime =
    result?.lighthouseResult?.fetchTime ?? result?.analysisUTCTimestamp ?? undefined

  return (
    <div className="insights-app">
      <div className="insights-app__container">
        <header className="insights-header">
          <div>
            <p className="insights-header__eyebrow">Google PageSpeed Insights</p>
            <h1 className="insights-header__title">URL 성능 분석 & 스크린샷 뷰어</h1>
            <p className="insights-header__subtitle">
              GOOGLE_CLOUD_API_KEY를 통해 서버리스 프록시가 요청을 처리합니다. 분석 옵션을
              조정하고, 주요 성능 지표와 전체 페이지 스크린샷을 한 번에 확인하세요.
            </p>
          </div>
        </header>

        <section className="card">
          <form className="form" onSubmit={handleSubmit}>
            <div className="form__grid">
              <label className="form__control form__control--wide">
                <span>분석할 URL *</span>
                <input
                  type="url"
                  required
                  placeholder="https://example.com"
                  value={form.url}
                  onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
                />
              </label>

              <fieldset className="form__control">
                <legend>전략</legend>
                <div className="form__segment">
                  {STRATEGY_OPTIONS.map((option) => (
                    <label key={option.value} className="form__option">
                      <input
                        type="radio"
                        name="strategy"
                        value={option.value}
                        checked={form.strategy === option.value}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            strategy: event.target.value as FormState['strategy'],
                          }))
                        }
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="form__control form__control--wide">
                <legend>카테고리</legend>
                <div className="form__segment form__segment--wrap">
                  {CATEGORY_OPTIONS.map((option) => (
                    <label key={option.value} className="form__option form__option--chip">
                      <input
                        type="checkbox"
                        value={option.value}
                        checked={form.categories.includes(option.value)}
                        onChange={(event) => {
                          const { checked, value } = event.target
                          setForm((prev) => ({
                            ...prev,
                            categories: checked
                              ? Array.from(new Set([...prev.categories, value]))
                              : prev.categories.filter((item) => item !== value),
                          }))
                        }}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <button type="button" className="form__advanced-toggle" onClick={() => setShowAdvanced((prev) => !prev)}>
              {showAdvanced ? '고급 옵션 닫기' : '고급 옵션 열기'}
            </button>

            {showAdvanced && (
              <div className="form__grid form__grid--advanced">
                <label className="form__control">
                  <span>Locale</span>
                  <input
                    type="text"
                    placeholder="예: ko-KR, en-US"
                    value={form.locale}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        locale: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="form__control">
                  <span>Captcha Token</span>
                  <input
                    type="text"
                    value={form.captchaToken}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        captchaToken: event.target.value,
                      }))
                    }
                    placeholder="필요한 경우에만 입력"
                  />
                </label>
              </div>
            )}

            <div className="form__actions">
              <button type="submit" className="button button--primary" disabled={loading}>
                {loading ? '분석 중...' : 'PageSpeed 분석 실행'}
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => {
                  setForm({
                    url: '',
                    strategy: 'mobile',
                    categories: ['performance'],
                    locale: 'ko-KR',
                    captchaToken: '',
                  })
                  setResult(null)
                  setError(null)
                }}
                disabled={loading}
              >
                초기화
              </button>
            </div>
          </form>
        </section>

        {error && <p className="status status--error">{error}</p>}
        {loading && !error && <p className="status">Google Lighthouse 분석을 불러오는 중입니다...</p>}

        {result && !loading && (
          <section className="results">
            {fetchTime && (
              <p className="results__meta">
                최근 분석 시각: {new Date(fetchTime).toLocaleString()} (UTC 기준)
              </p>
            )}

            {screenshotSrc && (
              <article className="card card--inline">
                <div className="screenshot-panel">
                  <div className="screenshot-panel__preview" role="img" aria-label="페이지 스크린샷 미리보기">
                    <img src={screenshotSrc} alt="Google PageSpeed Insights 캡처" />
                  </div>
                  <div className="screenshot-panel__body">
                    <h2>전체 페이지 스크린샷</h2>
                    <p>
                      썸네일은 1600:900 비율에 맞춰 잘라서 보여줍니다. {' '}
                      전체 이미지는 버튼을 눌러 모달에서 세로 스크롤로 확인할 수 있어요.
                    </p>
                    <button
                      type="button"
                      className="button button--secondary"
                      onClick={() => setShowScreenshotModal(true)}
                    >
                      전체 보기
                    </button>
                  </div>
                </div>
              </article>
            )}

              {categoryScores.length > 0 && (
                <article className="card">
                  <h2>카테고리 점수</h2>
                  <div className="score-grid">
                    {categoryScores.map((category) => (
                      <div
                        key={category.id}
                        className={`score-card score-card--${getScoreBand(category.score)}`}
                      >
                        <p className="score-card__label">{category.title}</p>
                        <p className="score-card__value">{formatScore(category.score)}</p>
                        <span className="score-card__suffix">점</span>
                      </div>
                    ))}
                  </div>
                </article>
              )}

              {labMetrics.length > 0 && (
                <article className="card">
                  <h2>실험실 데이터</h2>
                  <div className="metric-grid">
                    {labMetrics.map((metric) => (
                      <div
                        key={metric.id}
                        className={`metric metric--${getScoreBand(metric.score)}`}
                      >
                        <p className="metric__label">{metric.label}</p>
                        <p className="metric__value">{metric.displayValue}</p>
                      </div>
                    ))}
                  </div>
                </article>
              )}

              {fieldMetrics.length > 0 && (
                <article className="card">
                  <h2>실제 사용자 데이터 (CrUX)</h2>
                  <div className="metric-grid metric-grid--field">
                    {fieldMetrics.map((metric) => (
                      <div
                        key={metric.id}
                        className={`metric metric--field metric--${metric.categoryClass}`}
                      >
                        <p className="metric__label">{metric.label}</p>
                        <p className="metric__value">{metric.value}</p>
                        <span className="metric__chip">{metric.categoryLabel}</span>
                      </div>
                    ))}
                  </div>
                </article>
              )}

              {opportunities.length > 0 && (
                <article className="card">
                  <h2>개선 기회</h2>
                  <div className="opportunity-list">
                    {opportunities.map((item) => (
                      <div key={item.id} className="opportunity">
                        <div>
                          <p className="opportunity__title">{item.title}</p>
                          {item.description && (
                            <p className="opportunity__description">{item.description}</p>
                          )}
                        </div>
                        <p className="opportunity__savings">
                          예상 절약: {formatMilliseconds(item.savings)}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              )}
          </section>
        )}
      </div>

      {showScreenshotModal && screenshotSrc && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="전체 페이지 스크린샷">
          <div className="modal__backdrop" onClick={() => setShowScreenshotModal(false)} />
          <div className="modal__content">
            <button
              type="button"
              className="modal__close"
              aria-label="닫기"
              onClick={() => setShowScreenshotModal(false)}
            >
              ×
            </button>
            <div className="modal__image-wrapper">
              <img src={screenshotSrc} alt="전체 페이지 스크린샷" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
