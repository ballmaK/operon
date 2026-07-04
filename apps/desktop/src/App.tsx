import { OPERON_VERSION } from '@operon/shared-types';
import { useSidecarStatus } from './hooks/useSidecarStatus';

export default function App() {
  const { sidecar, environment, paths, isTauri, retry, sidecarStatusLabel } =
    useSidecarStatus();

  const docker = environment.find((e) => e.item === 'docker');
  const sidecarLabel = sidecar
    ? sidecarStatusLabel(sidecar.status)
    : isTauri
      ? '加载中…'
      : '浏览器预览（非 Tauri）';

  return (
    <main className="app">
      <header>
        <h1>Operon</h1>
        <p className="subtitle">0 人 Agent 公司 — 控制室</p>
      </header>

      <section className="status-card">
        <p>
          Sidecar 状态：<span id="sidecar-status">{sidecarLabel}</span>
          {sidecar?.port ? ` (:${sidecar.port})` : null}
        </p>
        {sidecar?.errorMessage ? (
          <p className="error">{sidecar.errorMessage}</p>
        ) : null}
        {sidecar?.status === 'SC_ERROR' && isTauri ? (
          <button type="button" onClick={() => void retry()}>
            重试启动 Sidecar
          </button>
        ) : null}
        <p className="version">v{OPERON_VERSION}</p>
      </section>

      {docker ? (
        <section className="status-card">
          <h2>环境检测</h2>
          <ul>
            <li>
              Docker Desktop：{docker.result}
              {docker.suggestion ? ` — ${docker.suggestion}` : null}
            </li>
          </ul>
        </section>
      ) : null}

      {paths ? (
        <section className="status-card paths">
          <h2>数据目录</h2>
          <dl>
            <dt>DATA_DIR</dt>
            <dd>{paths.dataDir}</dd>
            <dt>LOG_DIR</dt>
            <dd>{paths.logDir}</dd>
            <dt>TEMP_DIR</dt>
            <dd>{paths.tempDir}</dd>
          </dl>
        </section>
      ) : null}
    </main>
  );
}
