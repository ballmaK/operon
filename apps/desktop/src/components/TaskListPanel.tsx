import type { Task } from '@operon/shared-types';
import { TASK_STATUS_LABEL, isTaskRunning } from '../lib/m02-m03';

interface TaskListPanelProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelect: (taskId: string) => void;
}

export function TaskListPanel({ tasks, selectedTaskId, onSelect }: TaskListPanelProps) {
  if (tasks.length === 0) {
    return <p className="hint">该部门暂无任务。启动 Objective 控制循环后会自动生成。</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li key={task.id}>
          <button
            type="button"
            className={`task-row ${selectedTaskId === task.id ? 'selected' : ''}`}
            onClick={() => onSelect(task.id)}
          >
            <span className={`task-status-dot ${isTaskRunning(task.status) ? 'running' : ''}`} />
            <span className="task-brief">{task.brief.slice(0, 80)}</span>
            <span className={`badge status-${task.status}`}>{TASK_STATUS_LABEL[task.status]}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
