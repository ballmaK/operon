import { useEffect, useState } from 'react';
import type { Blocker, RhythmReport, RhythmSchedule } from '@operon/shared-types';
import {
  getRhythmSchedule,
  listBlockers,
  listRhythmReports,
  resolveBlocker,
  triggerRhythmReport,
  updateRhythmSchedule,
} from '../lib/sidecar-api';

interface RhythmCenterProps {
  port: number;
  companyId: string;
}

export function RhythmCenter({ port, companyId }: RhythmCenterProps) {
  const [schedule, setSchedule] = useState<RhythmSchedule | null>(null);
  const [reports, setReports] = useState<RhythmReport[]>([]);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const [sch, reps, blks] = await Promise.all([
        getRhythmSchedule(port, companyId),
        listRhythmReports(port, companyId),
        listBlockers(port, companyId),
      ]);
      setSchedule(sch);
      setReports(reps);
      setBlockers(blks.filter((b) => b.status === 'open'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [port, companyId]);

  const latestDaily = reports.find((r) => r.reportType === 'daily') ?? null;

  const saveSchedule = async (patch: Partial<RhythmSchedule>) => {
    if (!schedule) return;
    const updated = await updateRhythmSchedule(port, { companyId, ...patch });
    setSchedule(updated);
  };

  const runTrigger = async (type: 'daily' | 'weekly') => {
    setBusy(true);
    try {
      await triggerRhythmReport(port, companyId, type);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rhythm-center">
      <div className="section-header">
        <h2>运营节奏中心</h2>
        <div className="wizard-actions">
          <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={() => void runTrigger('daily')}>
            触发日复盘
          </button>
          <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={() => void runTrigger('weekly')}>
            触发周复盘
          </button>
        </div>
      </div>

      {loading ? <p className="hint">加载中…</p> : null}

      {schedule ? (
        <div className="rhythm-schedule-form">
          <label className="wizard-field">
            <span>日复盘时刻</span>
            <input
              type="time"
              value={schedule.dailyTime}
              onChange={(e) => void saveSchedule({ dailyTime: e.target.value })}
            />
          </label>
          <label className="wizard-field">
            <span>周复盘日</span>
            <select
              value={schedule.weeklyDay}
              onChange={(e) => void saveSchedule({ weeklyDay: e.target.value as RhythmSchedule['weeklyDay'] })}
            >
              {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <p className="hint">时区：{schedule.timezone} · Sidecar 内每分钟检查调度（RH-01）</p>
        </div>
      ) : null}

      <div className="rhythm-summary-cards">
        <div className="summary-card">
          <span className="summary-label">待决策</span>
          <strong>{latestDaily?.pendingDecisionsCount ?? 0}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">阻塞</span>
          <strong>{blockers.length}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">已交付证明</span>
          <strong>{latestDaily?.proofsDeliveredCount ?? 0}</strong>
        </div>
      </div>

      {latestDaily ? (
        <div className="rhythm-report">
          <h3>最新日复盘 · {new Date(latestDaily.createdAt).toLocaleString()}</h3>
          {latestDaily.objectiveSummaries.length > 0 ? (
            <ul>
              {latestDaily.objectiveSummaries.map((o) => (
                <li key={o.objectiveId}>{o.summary}</li>
              ))}
            </ul>
          ) : (
            <p className="hint">无 active Objective 摘要。</p>
          )}
        </div>
      ) : (
        <p className="hint">尚无复盘报告，点击「触发日复盘」生成。</p>
      )}

      <div className="blocker-section">
        <h3>阻塞列表</h3>
        {blockers.length === 0 ? (
          <p className="hint">无 open 阻塞项。</p>
        ) : (
          <ul className="blocker-list">
            {blockers.map((b) => (
              <li key={b.id} className="blocker-item">
                <span>{b.description}</span>
                <button type="button" className="btn-secondary btn-sm" onClick={() => void resolveBlocker(port, b.id).then(refresh)}>
                  标记已解决
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
