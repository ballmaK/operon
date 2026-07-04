import { describe, expect, it } from 'vitest';
import {
  nextWizardStep,
  prevWizardStep,
  validateWizardStep,
  type WizardForm,
} from './company-wizard.js';

const baseForm: WizardForm = {
  companyName: 'Acme Labs',
  objectiveTitle: 'Ship MVP by end of month',
  constraints: '',
  departmentName: 'Product',
};

describe('company-wizard steps', () => {
  it('advances from company to objective', () => {
    expect(nextWizardStep('company')).toBe('objective');
  });

  it('goes back from department to objective', () => {
    expect(prevWizardStep('department')).toBe('objective');
  });

  it('validates company name length', () => {
    expect(
      validateWizardStep('company', { ...baseForm, companyName: 'A' }),
    ).toMatch(/2-80/);
    expect(validateWizardStep('company', baseForm)).toBeNull();
  });

  it('validates objective title CO-01', () => {
    expect(
      validateWizardStep('objective', { ...baseForm, objectiveTitle: 'Hi' }),
    ).toMatch(/CO-01/);
  });
});
