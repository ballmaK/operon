import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

export class MemoryRepo {
  constructor(private readonly dataDir: string) {}

  private memoryPath(companyId: string, departmentId: string): string {
    return join(
      this.dataDir,
      'companies',
      companyId,
      'memories',
      departmentId,
      'Memory.md',
    );
  }

  read(companyId: string, departmentId: string): string {
    const path = this.memoryPath(companyId, departmentId);
    if (!existsSync(path)) return '';
    return readFileSync(path, 'utf8');
  }

  /** DP-03: backup before write; LE-02: append-only delta */
  appendWithBackup(
    companyId: string,
    departmentId: string,
    delta: string,
  ): { content: string; version: number } {
    const path = this.memoryPath(companyId, departmentId);
    mkdirSync(dirname(path), { recursive: true });

    let version = 1;
    let existing = '';
    if (existsSync(path)) {
      existing = readFileSync(path, 'utf8');
      const match = existing.match(/<!-- v(\d+) -->/);
      version = match ? parseInt(match[1], 10) + 1 : 2;
      copyFileSync(path, `${path}.bak.${version - 1}`);
    }

    const content = `${existing}\n\n${delta}\n<!-- v${version} -->`.trim();
    writeFileSync(path, content, 'utf8');
    return { content, version };
  }
}
