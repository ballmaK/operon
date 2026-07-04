import { useEffect, useState } from 'react';
import type { ApiCredentialView, LlmRole, ModelConfig } from '@operon/shared-types';
import {
  listCredentials,
  listModelConfigs,
  testModelConfig,
  updateModelConfig,
  upsertCredential,
} from '../lib/sidecar-api';

const ROLES: LlmRole[] = [
  'lead_plan',
  'lead_synth',
  'worker_code',
  'worker_research',
  'worker_default',
];

interface SettingsPanelProps {
  port: number;
}

export function SettingsPanel({ port }: SettingsPanelProps) {
  const [tab, setTab] = useState<'credentials' | 'models'>('credentials');
  const [credentials, setCredentials] = useState<ApiCredentialView[]>([]);
  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [testRole, setTestRole] = useState<LlmRole>('lead_plan');

  const refresh = async () => {
    const [creds, cfgs] = await Promise.all([listCredentials(port), listModelConfigs(port)]);
    setCredentials(creds);
    setConfigs(cfgs);
  };

  useEffect(() => {
    void refresh();
  }, [port]);

  const saveCredential = async () => {
    await upsertCredential(port, provider, apiKey);
    setApiKey('');
    setMessage('API Key 已保存（掩码展示）');
    await refresh();
  };

  const saveModel = async (role: LlmRole, cfg: ModelConfig) => {
    await updateModelConfig(port, role, {
      provider: cfg.provider,
      modelName: cfg.modelName,
      apiBaseUrl: cfg.apiBaseUrl,
    });
    setMessage(`${role} 路由已更新`);
    await refresh();
  };

  const testConnection = async () => {
    try {
      const r = await testModelConfig(port, testRole);
      setMessage(r.ok ? `连接成功：${r.message}` : r.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '测试失败');
    }
  };

  return (
    <section className="settings-panel">
      <div className="section-header">
        <h2>设置</h2>
        <nav className="settings-tabs">
          <button
            type="button"
            className={tab === 'credentials' ? 'active' : ''}
            onClick={() => setTab('credentials')}
          >
            API 密钥
          </button>
          <button
            type="button"
            className={tab === 'models' ? 'active' : ''}
            onClick={() => setTab('models')}
          >
            模型路由
          </button>
        </nav>
      </div>

      {message ? <p className="hint">{message}</p> : null}

      {tab === 'credentials' ? (
        <div className="settings-block">
          <h3>已保存凭据</h3>
          <ul>
            {credentials.map((c) => (
              <li key={c.id}>
                {c.provider} — {c.maskedKey}
              </li>
            ))}
          </ul>
          <label className="wizard-field">
            <span>提供商</span>
            <select value={provider} onChange={(e) => setProvider(e.target.value)}>
              <option value="openai">openai</option>
              <option value="anthropic">anthropic</option>
              <option value="deepseek">deepseek</option>
              <option value="ollama">ollama</option>
            </select>
          </label>
          <label className="wizard-field">
            <span>API Key</span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
          </label>
          <button type="button" className="btn-primary btn-sm" onClick={() => void saveCredential()}>
            保存
          </button>
        </div>
      ) : (
        <div className="settings-block">
          {configs.map((cfg) => (
            <ModelConfigRow key={cfg.id} cfg={cfg} onSave={(c) => void saveModel(cfg.role, c)} />
          ))}
          <div className="model-test">
            <label>
              测试角色
              <select value={testRole} onChange={(e) => setTestRole(e.target.value as LlmRole)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="btn-secondary btn-sm" onClick={() => void testConnection()}>
              测试连接
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function ModelConfigRow({
  cfg,
  onSave,
}: {
  cfg: ModelConfig;
  onSave: (cfg: ModelConfig) => void;
}) {
  const [draft, setDraft] = useState(cfg);
  useEffect(() => setDraft(cfg), [cfg]);

  return (
    <div className="model-config-row">
      <strong>{cfg.role}</strong>
      <input
        value={draft.provider}
        onChange={(e) => setDraft({ ...draft, provider: e.target.value })}
        placeholder="provider"
      />
      <input
        value={draft.modelName}
        onChange={(e) => setDraft({ ...draft, modelName: e.target.value })}
        placeholder="model"
      />
      <button type="button" className="btn-secondary btn-sm" onClick={() => onSave(draft)}>
        保存
      </button>
    </div>
  );
}
