import { useEffect, useState } from 'react';
import type { KeyResult, Objective } from '@operon/shared-types';
import { completeKeyResult, createKeyResult, listKeyResults } from '../lib/sidecar-api';

interface OkrTreePanelProps {
  port: number;
  objectives: Objective[];
}

export function OkrTreePanel({ port, objectives }: OkrTreePanelProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [target, setTarget] = useState('');

  useEffect(() => {
    if (objectives.length > 0 && !selectedId) {
      setSelectedId(objectives[0].id);
    }
  }, [objectives, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    void listKeyResults(port, selectedId).then(setKeyResults);
  }, [port, selectedId]);

  const objective = objectives.find((o) => o.id === selectedId);

  const addKr = async () => {
    if (!selectedId || newTitle.trim().length < 3) return;
    await createKeyResult(port, selectedId, {
      title: newTitle.trim(),
      targetValue: target ? Number(target) : null,
    });
    setNewTitle('');
    setTarget('');
    setKeyResults(await listKeyResults(port, selectedId));
  };

  return (
    <section className="okr-tree">
      <div className="section-header">
        <h2>OKR 树</h2>
        <span className="hint">P1 — Objective → Key Results（C05）</span>
      </div>

      <label className="wizard-field">
        <span>Objective</span>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          {objectives.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title}
            </option>
          ))}
        </select>
      </label>

      {objective ? (
        <div className="okr-objective-node">
          <h3>O — {objective.title}</h3>
          <ul className="okr-kr-list">
            {keyResults.map((kr) => (
              <li key={kr.id} className={`okr-kr ${kr.status}`}>
                <span>KR — {kr.title}</span>
                <span className="hint">
                  {kr.currentValue}
                  {kr.targetValue != null ? ` / ${kr.targetValue}` : ''}
                  {kr.unit ? ` ${kr.unit}` : ''}
                </span>
                {kr.status === 'open' ? (
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() =>
                      void completeKeyResult(port, kr.id).then(() =>
                        listKeyResults(port, selectedId).then(setKeyResults),
                      )
                    }
                  >
                    完成
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="okr-add">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="新 Key Result 标题"
            />
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="目标值（选填）"
            />
            <button type="button" className="btn-primary btn-sm" onClick={() => void addKr()}>
              + KR
            </button>
          </div>
        </div>
      ) : (
        <p className="hint">请先创建 Objective。</p>
      )}
    </section>
  );
}
