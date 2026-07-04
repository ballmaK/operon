import { execFileSync, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function dockerAvailable(): boolean {
  if (process.env.OPERON_DOCKER_STUB === '1') return true;
  if (process.env.OPERON_DOCKER_OK === '0') return false;
  try {
    const r = spawnSync('docker', ['info'], { encoding: 'utf8', timeout: 5000 });
    return r.status === 0;
  } catch {
    return false;
  }
}

export function runDockerCode(workDirAbs: string, code: string): { stdout: string; exitCode: number } {
  const scriptPath = join(workDirAbs, '_run.js');
  writeFileSync(scriptPath, code, 'utf8');
  try {
    const out = execFileSync(
      'docker',
      [
        'run',
        '--rm',
        '-v',
        `${workDirAbs}:/work`,
        '-w',
        '/work',
        'node:20-alpine',
        'node',
        '_run.js',
      ],
      { encoding: 'utf8', timeout: 60_000 },
    );
    return { stdout: out.trim(), exitCode: 0 };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return {
      stdout: (e.stdout ?? e.stderr ?? String(err)).trim(),
      exitCode: e.status ?? 1,
    };
  }
}
