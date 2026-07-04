import { describe, expect, it } from 'vitest';
import {
  validateCompanyName,
  validateObjectiveTitle,
  validateObjectiveConstraints,
} from './company-input.js';

describe('company-input validation', () => {
  it('accepts valid company name', () => {
    expect(validateCompanyName('Acme Corp')).toBe('Acme Corp');
  });

  it('rejects short company name', () => {
    expect(() => validateCompanyName('A')).toThrow(/2-80/);
  });

  it('accepts valid objective title', () => {
    expect(validateObjectiveTitle('Ship MVP by Q3')).toBe('Ship MVP by Q3');
  });

  it('rejects short objective title', () => {
    expect(() => validateObjectiveTitle('Hi')).toThrow(/CO-01/);
  });

  it('allows null constraints', () => {
    expect(validateObjectiveConstraints(null)).toBeNull();
  });
});
