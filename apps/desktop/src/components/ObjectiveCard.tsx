import { useState } from 'react';
import type { Objective, ControlLoop } from '@operon/shared-types';
import {
  OBJECTIVE_STATUS_LABEL,
  CONTROL_LOOP_PHASE_LABEL,
  objectiveActions,
  controlLoopProgress,
} from '../lib/control-room';

interface ObjectiveCardProps {
  objective: Objective;
  controlLoop: ControlLoop | null;
  busy: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onMessage: (message: string) => void;
  onEdit: (input: { title: string; constraints: string }) => void;
}

export function ObjectiveCard({
  objective,
  controlLoop,
  busy,
  onStart,
  onPause,
  onResume,
  onComplete,
  onMessage,
  onEdit,
}: ObjectiveCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(objective.title);
  const [constraints, setConstraints] = useState(objective.constraints ?? '');
  const actions = objectiveActions(objective.status);
  const progress = controlLoopProgress(controlLoop?.phase ?? null);

  const saveEdit = () => {
    onEdit({ title: title.trim(), constraints: constraints.trim() });
    setEditing(false);
  };

  return (
    <article className="objective-card">
      <header className="objective-card-header">
        <div>
          <h3>{objective.title}</h3>
          <div className="objective-meta">
            <span className={`badge status-${objective.status}`}>
              {OBJECTIVE_STATUS_LABEL[objective.status]}
            </span>
            {objective.priority ? (
              <span className="badge priority">{objective.priority}</span>
            ) : null}
          </div>
        </div>
        <button type="button" className="btn-secondary btn-sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? '收起' : '详情'}
        </button>
      </header>

      {controlLoop ? (
        <div className="loop-progress">
          <div className="loop-progress-bar" style={{ width: `${progress}%` }} />
          <span className="loop-progress-label">
            控制循环：{CONTROL_LOOP_PHASE_LABEL[controlLoop.phase]} ({controlLoop.status})
          </span>
        </div>
      ) : null}

      {expanded ? (
        <div className="objective-detail">
          {editing ? (
            <>
              <label className="wizard-field">
                <span>标题</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
              </label>
              <label className="wizard-field">
                <span>约束</span>
                <textarea
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  rows={2}
                  maxLength={2000}
                />
              </label>
              <div className="wizard-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
                  取消
                </button>
                <button type="button" className="btn-primary" disabled={busy} onClick={saveEdit}>
                  保存
                </button>
              </div>
            </>
          ) : (
            <>
              {objective.constraints ? <p className="objective-constraints">{objective.constraints}</p> : null}
              {(objective.status === 'draft' || objective.status === 'paused') ? (
                <button type="button" className="btn-secondary btn-sm" onClick={() => setEditing(true)}>
                  编辑
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <div className="objective-actions">
        {actions.includes('start') ? (
          <button type="button" disabled={busy} onClick={onStart}>
            启动
          </button>
        ) : null}
        {actions.includes('pause') ? (
          <button type="button" disabled={busy} onClick={onPause}>
            暂停
          </button>
        ) : null}
        {actions.includes('resume') ? (
          <button type="button" disabled={busy} onClick={onResume}>
            恢复
          </button>
        ) : null}
        {actions.includes('complete') ? (
          <button type="button" className="btn-primary" disabled={busy} onClick={onComplete}>
            完成
          </button>
        ) : null}
        {actions.includes('message') ? (
          <button
            type="button"
            className="btn-secondary"
            disabled={busy}
            onClick={() => {
              const message = window.prompt('发送消息给 Lead：');
              if (message?.trim()) onMessage(message.trim());
            }}
          >
            发消息
          </button>
        ) : null}
      </div>
    </article>
  );
}
