import { describe, expect, it } from 'vitest';
import { inferAssetType } from './proof-query.js';

describe('proof-query asset type', () => {
  it('detects markdown', () => {
    expect(inferAssetType('notes/readme.md')).toBe('markdown');
  });

  it('detects code', () => {
    expect(inferAssetType('src/app.ts')).toBe('code');
  });
});
