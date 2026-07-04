import { describe, expect, it } from 'vitest';
import { validateHandoffCreate, validateHandoffReply } from './handoff-input.js';

describe('handoff-input', () => {
  it('requires summary and request HO-01', () => {
    expect(() =>
      validateHandoffCreate({
        fromDepartmentId: 'a',
        toDepartmentId: 'b',
      }),
    ).toThrow(/HO-01/);
    expect(
      validateHandoffCreate({
        fromDepartmentId: 'a',
        toDepartmentId: 'b',
        contextSummary: 'Ship notes ready',
        request: 'Write release notes',
      }),
    ).toEqual({ contextSummary: 'Ship notes ready', request: 'Write release notes' });
  });

  it('rejects same department', () => {
    expect(() =>
      validateHandoffCreate({
        fromDepartmentId: 'a',
        toDepartmentId: 'a',
        contextSummary: 'x',
        request: 'y',
      }),
    ).toThrow(/同一部门/);
  });

  it('validates reply', () => {
    expect(validateHandoffReply('Done')).toBe('Done');
  });
});
