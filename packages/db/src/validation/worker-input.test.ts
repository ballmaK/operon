import { describe, expect, it } from 'vitest';
import { validateWorkerSpawn, assertSkillAllowed } from './worker-input.js';

describe('validateWorkerSpawn', () => {
  it('rejects brief over 3000 chars', () => {
    expect(() =>
      validateWorkerSpawn({
        taskId: 't1',
        brief: 'x'.repeat(3001),
        minimalMemory: '',
        allowedSkills: ['file_write'],
      }),
    ).toThrow(/3000/);
  });

  it('rejects minimalMemory over 2KB', () => {
    expect(() =>
      validateWorkerSpawn({
        taskId: 't1',
        brief: 'ok',
        minimalMemory: 'x'.repeat(2049),
        allowedSkills: ['file_write'],
      }),
    ).toThrow(/2048/);
  });
});

describe('assertSkillAllowed', () => {
  it('blocks disallowed skill', () => {
    expect(() => assertSkillAllowed('code_run', ['file_write'])).toThrow(/WK-01/);
  });
});
