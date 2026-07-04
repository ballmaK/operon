import { useState } from 'react';
import type { Company } from '@operon/shared-types';
import { runCompanyWizard } from '../lib/sidecar-api';
import {
  DEFAULT_DEPARTMENTS,
  nextWizardStep,
  prevWizardStep,
  validateWizardStep,
  wizardStepLabel,
  type WizardForm,
  type WizardStep,
} from '../lib/company-wizard';

interface CompanyWizardProps {
  port: number;
  onComplete: (company: Company) => void;
  onCancel?: () => void;
}

const initialForm: WizardForm = {
  companyName: '',
  objectiveTitle: '',
  constraints: '',
  departmentName: DEFAULT_DEPARTMENTS[0],
};

export function CompanyWizard({ port, onComplete, onCancel }: CompanyWizardProps) {
  const [step, setStep] = useState<WizardStep>('company');
  const [form, setForm] = useState<WizardForm>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fieldError = validateWizardStep(step, form);

  const goNext = () => {
    const err = validateWizardStep(step, form);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    const next = nextWizardStep(step);
    if (next) setStep(next);
  };

  const goBack = () => {
    setError(null);
    const prev = prevWizardStep(step);
    if (prev) setStep(prev);
  };

  const submit = async (launchLoop: boolean) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await runCompanyWizard(port, {
        companyName: form.companyName.trim(),
        objectiveTitle: form.objectiveTitle.trim(),
        constraints: form.constraints.trim() || undefined,
        departmentName: form.departmentName.trim(),
        launchLoop,
      });
      setStep('done');
      onComplete(result.company);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'done') {
    return (
      <section className="wizard-card">
        <h2>公司已创建</h2>
        <p className="wizard-success">
          「{form.companyName}」已就绪，首个目标「{form.objectiveTitle}」已写入。
        </p>
      </section>
    );
  }

  return (
    <section className="wizard-card">
      <header className="wizard-header">
        <h2>创建公司</h2>
        <p className="wizard-step-indicator">
          步骤 {['company', 'objective', 'department', 'confirm'].indexOf(step) + 1} / 4 —{' '}
          {wizardStepLabel(step)}
        </p>
      </header>

      {step === 'company' ? (
        <label className="wizard-field">
          <span>公司名称</span>
          <input
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            placeholder="2-80 字符，本地唯一"
            maxLength={80}
            autoFocus
          />
        </label>
      ) : null}

      {step === 'objective' ? (
        <>
          <label className="wizard-field">
            <span>首个目标标题</span>
            <input
              value={form.objectiveTitle}
              onChange={(e) => setForm({ ...form, objectiveTitle: e.target.value })}
              placeholder="可衡量的终点（5-200 字符）"
              maxLength={200}
              autoFocus
            />
          </label>
          <label className="wizard-field">
            <span>约束条件（选填）</span>
            <textarea
              value={form.constraints}
              onChange={(e) => setForm({ ...form, constraints: e.target.value })}
              placeholder="预算、时间、范围限制…"
              maxLength={2000}
              rows={3}
            />
          </label>
        </>
      ) : null}

      {step === 'department' ? (
        <fieldset className="wizard-field">
          <legend>初始部门</legend>
          <div className="dept-options">
            {DEFAULT_DEPARTMENTS.map((name) => (
              <label key={name} className="dept-option">
                <input
                  type="radio"
                  name="department"
                  checked={form.departmentName === name}
                  onChange={() => setForm({ ...form, departmentName: name })}
                />
                {name}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {step === 'confirm' ? (
        <dl className="wizard-summary">
          <dt>公司</dt>
          <dd>{form.companyName.trim()}</dd>
          <dt>目标</dt>
          <dd>{form.objectiveTitle.trim()}</dd>
          {form.constraints.trim() ? (
            <>
              <dt>约束</dt>
              <dd>{form.constraints.trim()}</dd>
            </>
          ) : null}
          <dt>部门</dt>
          <dd>{form.departmentName}</dd>
        </dl>
      ) : null}

      {error ? <p className="error">{error}</p> : null}
      {fieldError && step !== 'confirm' ? (
        <p className="hint">{fieldError}</p>
      ) : null}

      <div className="wizard-actions">
        {onCancel ? (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            取消
          </button>
        ) : null}
        {step !== 'company' ? (
          <button type="button" className="btn-secondary" onClick={goBack} disabled={submitting}>
            上一步
          </button>
        ) : null}
        {step === 'confirm' ? (
          <>
            <button
              type="button"
              onClick={() => void submit(false)}
              disabled={submitting}
            >
              {submitting ? '创建中…' : '创建（暂不启动）'}
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => void submit(true)}
              disabled={submitting}
            >
              {submitting ? '启动中…' : '创建并启动控制循环'}
            </button>
          </>
        ) : (
          <button type="button" className="btn-primary" onClick={goNext}>
            下一步
          </button>
        )}
      </div>
    </section>
  );
}
