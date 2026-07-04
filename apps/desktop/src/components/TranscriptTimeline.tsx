import { useCallback, useEffect, useState } from 'react';
import type { TranscriptEntry } from '@operon/shared-types';
import { correctTranscript, listTranscripts } from '../lib/sidecar-api';
import { transcriptSummary } from '../lib/m02-m03';

interface TranscriptTimelineProps {
  port: number;
  companyId: string;
  compact?: boolean;
}

const ACTORS = ['owner', 'lead', 'worker', 'system'] as const;

export function TranscriptTimeline({ port, companyId, compact = false }: TranscriptTimelineProps) {
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [actorFilter, setActorFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listTranscripts(port, companyId, {
        limit: compact ? 5 : 50,
        actor: actorFilter || undefined,
      });
      setEntries(list);
    } finally {
      setLoading(false);
    }
  }, [port, companyId, actorFilter, compact]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleCorrect = () => {
    const message = window.prompt('Owner 纠正（追加 Transcript，TR-01）：');
    if (!message?.trim()) return;
    void correctTranscript(port, { companyId, message: message.trim() }).then(() => refresh());
  };

  return (
    <section className={`transcript-timeline ${compact ? 'compact' : ''}`}>
      {!compact ? (
        <div className="section-header">
          <h2>转录时间线</h2>
          <div className="timeline-filters">
            <select value={actorFilter} onChange={(e) => setActorFilter(e.target.value)}>
              <option value="">全部主体</option>
              {ACTORS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <button type="button" className="btn-secondary btn-sm" onClick={() => void handleCorrect()}>
              Owner 纠正
            </button>
          </div>
        </div>
      ) : (
        <h2>最近动态</h2>
      )}

      {loading ? <p className="hint">加载中…</p> : null}

      {entries.length === 0 && !loading ? (
        <p className="hint">暂无 Transcript 记录。</p>
      ) : (
        <ul className="timeline-list">
          {entries.map((t) => (
            <li key={t.id} className="timeline-item">
              <button
                type="button"
                className="timeline-row"
                onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
              >
                <span className="transcript-time">
                  {new Date(t.timestamp).toLocaleString()}
                </span>
                <span className="transcript-actor">{t.actor}</span>
                <span className="transcript-action">{t.actionType}</span>
                <span className="transcript-summary">{transcriptSummary(t.payload)}</span>
              </button>
              {expandedId === t.id ? (
                <pre className="timeline-payload">{JSON.stringify(t.payload, null, 2)}</pre>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
