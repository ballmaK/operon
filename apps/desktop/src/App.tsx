import { OPERON_VERSION } from '@operon/shared-types';

export default function App() {
  return (
    <main className="app">
      <header>
        <h1>Operon</h1>
        <p className="subtitle">0 人 Agent 公司 — 控制室</p>
      </header>
      <section className="status-card">
        <p>Sidecar 状态：<span id="sidecar-status">未连接</span></p>
        <p className="version">v{OPERON_VERSION}</p>
      </section>
    </main>
  );
}
