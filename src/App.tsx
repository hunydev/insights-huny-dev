import './App.css'

function App() {
  return (
    <main className="landing">
      <section className="landing__content">
        <p className="landing__eyebrow">Insights Dashboard</p>
        <h1 className="landing__title">
          데이터 기반 인사이트를 한눈에
        </h1>
        <p className="landing__subtitle">
          향후 제공될 대시보드를 통해 지표를 빠르게 파악하고, 팀의 의사결정을 도와줄
          예정입니다. 현재는 초기 화면만 공개되어 있으며 빠르게 업데이트될 예정입니다.
        </p>
        <div className="landing__actions">
          <a className="landing__primary" href="#!" aria-label="서비스 준비 알림">
            준비 중
          </a>
          <a
            className="landing__secondary"
            href="mailto:contact@example.com"
            aria-label="문의하기"
          >
            문의하기
          </a>
        </div>
      </section>
      <section className="landing__panel" aria-hidden="true">
        <div className="landing__card">
          <div className="landing__metric">
            <span className="landing__metric-label">예상 사용자</span>
            <span className="landing__metric-value">1.2k+</span>
          </div>
          <div className="landing__metric">
            <span className="landing__metric-label">알파 피드백</span>
            <span className="landing__metric-value">87%</span>
          </div>
          <div className="landing__metric">
            <span className="landing__metric-label">출시 예정</span>
            <span className="landing__metric-value">2025 Q1</span>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
