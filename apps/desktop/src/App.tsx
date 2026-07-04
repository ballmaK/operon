import { useEffect, useState } from 'react';
import { OPERON_VERSION } from '@operon/shared-types';
import { useSidecarStatus } from './hooks/useSidecarStatus';
import { useCompanies } from './hooks/useCompanies';
import { CompanyWizard } from './components/CompanyWizard';
import { ControlRoom } from './components/ControlRoom';

export default function App() {
  const { sidecar, environment, paths, isTauri, retry, sidecarStatusLabel } =
    useSidecarStatus();
  const sidecarRunning = sidecar?.status === 'SC_RUNNING';
  const { companies, loading, error, refresh } = useCompanies(
    sidecar?.port ?? null,
    sidecarRunning,
  );
  const [showWizard, setShowWizard] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

  const docker = environment.find((e) => e.item === 'docker');
  const sidecarLabel = sidecar
    ? sidecarStatusLabel(sidecar.status)
    : isTauri
      ? '加载中…'
      : '浏览器预览（非 Tauri）';

  const handleWizardComplete = () => {
    setShowWizard(false);
    void refresh();
  };

  return (
    <main className={`app ${companies.length > 0 ? 'app-wide' : ''}`}>
      {!companies.length && !showWizard ? (
        <header className="app-header">
          <div>
            <h1>Operon</h1>
            <p className="subtitle">0 人 Agent 公司 — 控制室</p>
          </div>
        </header>
      ) : null}

      {sidecarRunning && sidecar?.port && companies.length > 0 && !showWizard ? (
        <ControlRoom
          port={sidecar.port}
          companies={companies}
          selectedCompanyId={selectedCompanyId || companies[0].id}
          onSelectCompany={setSelectedCompanyId}
          onCreateCompany={() => setShowWizard(true)}
        />
      ) : null}

      {sidecarRunning && sidecar?.port && (showWizard || companies.length === 0) ? (
        <section className="workspace-section">
          {showWizard ? (
            <CompanyWizard
              port={sidecar.port}
              onComplete={handleWizardComplete}
              onCancel={() => setShowWizard(false)}
            />
          ) : companies.length === 0 && !loading ? (
            <div className="empty-state">
              <h2>欢迎使用 Operon</h2>
              <p>还没有公司。创建第一家 Agent 公司，设定目标并启动控制循环。</p>
              <button type="button" className="btn-primary" onClick={() => setShowWizard(true)}>
                开始创建向导
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {!companies.length ? (
        <section className="status-card compact">
          <p>
            Sidecar：<span id="sidecar-status">{sidecarLabel}</span>
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
      ) : null}

      {loading && companies.length === 0 ? <p className="hint">加载公司列表…</p> : null}
      {error && companies.length === 0 ? <p className="error">{error}</p> : null}

      {docker && !companies.length ? (
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

      {paths && !companies.length ? (
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
