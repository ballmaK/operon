import {
  COMPANY_NAME_MIN,
  COMPANY_NAME_MAX,
  OBJECTIVE_TITLE_MIN,
  OBJECTIVE_TITLE_MAX,
  OBJECTIVE_CONSTRAINTS_MAX,
} from '@operon/shared-types';

export type WizardStep = 'company' | 'objective' | 'department' | 'confirm' | 'done';

export const WIZARD_STEPS: WizardStep[] = [
  'company',
  'objective',
  'department',
  'confirm',
];

export const DEFAULT_DEPARTMENTS = ['Product', 'Engineering', 'Marketing'] as const;

export interface WizardForm {
  companyName: string;
  objectiveTitle: string;
  constraints: string;
  departmentName: string;
}

export function wizardStepIndex(step: WizardStep): number {
  return WIZARD_STEPS.indexOf(step);
}

export function nextWizardStep(step: WizardStep): WizardStep | null {
  const idx = wizardStepIndex(step);
  if (idx < 0 || idx >= WIZARD_STEPS.length - 1) return null;
  return WIZARD_STEPS[idx + 1];
}

export function prevWizardStep(step: WizardStep): WizardStep | null {
  const idx = wizardStepIndex(step);
  if (idx <= 0) return null;
  return WIZARD_STEPS[idx - 1];
}

export function validateWizardStep(
  step: WizardStep,
  form: WizardForm,
): string | null {
  switch (step) {
    case 'company': {
      const name = form.companyName.trim();
      if (name.length < COMPANY_NAME_MIN || name.length > COMPANY_NAME_MAX) {
        return `公司名称须 ${COMPANY_NAME_MIN}-${COMPANY_NAME_MAX} 字符`;
      }
      return null;
    }
    case 'objective': {
      const title = form.objectiveTitle.trim();
      if (title.length < OBJECTIVE_TITLE_MIN || title.length > OBJECTIVE_TITLE_MAX) {
        return `目标标题须 ${OBJECTIVE_TITLE_MIN}-${OBJECTIVE_TITLE_MAX} 字符（CO-01）`;
      }
      if (form.constraints.length > OBJECTIVE_CONSTRAINTS_MAX) {
        return `约束条件不超过 ${OBJECTIVE_CONSTRAINTS_MAX} 字符`;
      }
      return null;
    }
    case 'department': {
      if (!form.departmentName.trim()) return '请选择或填写部门名称';
      return null;
    }
    case 'confirm':
      return null;
    default:
      return null;
  }
}

export function wizardStepLabel(step: WizardStep): string {
  const labels: Record<WizardStep, string> = {
    company: '公司名称',
    objective: '首个目标',
    department: '初始部门',
    confirm: '确认创建',
    done: '完成',
  };
  return labels[step];
}
