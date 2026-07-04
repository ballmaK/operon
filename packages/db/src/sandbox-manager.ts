import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join as posixJoin } from 'node:path/posix';
import { join } from 'node:path';
import type {
  CreateSandboxSessionRequest,
  SandboxSession,
  SkillRuntime,
} from '@operon/shared-types';
import { getSkill } from './skill-registry.js';
import { dockerAvailable, runDockerCode } from './docker-runner.js';
import { captureBrowserScreenshot } from './playwright-runner.js';

export class SandboxManager {
  private readonly sessions = new Map<string, SandboxSession>();

  constructor(private readonly dataDir: string) {}

  create(input: CreateSandboxSessionRequest): SandboxSession {
    if (input.runtimeType === 'docker') {
      assertRuntimeAllowed('docker', dockerAvailable());
    }

    const id = randomUUID();
    const workDirRelative = posixJoin('sandboxes', input.agentRunId, id);
    const absDir = join(this.dataDir, workDirRelative);
    mkdirSync(absDir, { recursive: true });

    const session: SandboxSession = {
      id,
      runtimeType: input.runtimeType,
      workDirRelative,
      status: input.runtimeType === 'docker' ? 'SBX_CREATING' : 'SBX_READY',
      agentRunId: input.agentRunId,
      createdAt: new Date().toISOString(),
    };
    this.sessions.set(id, session);
    session.status = 'SBX_READY';
    return session;
  }

  get(id: string): SandboxSession | undefined {
    return this.sessions.get(id);
  }

  destroy(id: string): boolean {
    const session = this.sessions.get(id);
    if (!session || session.status === 'SBX_DESTROYED') return false;
    const absDir = join(this.dataDir, session.workDirRelative);
    rmSync(absDir, { recursive: true, force: true });
    session.status = 'SBX_DESTROYED';
    return true;
  }

  invokeFileWrite(
    sessionId: string,
    params: { relativePath: string; content: string },
  ): { writtenPath: string; bytes: number } {
    const session = this.requireReadySession(sessionId, ['subprocess', 'playwright', 'docker']);
    session.status = 'SBX_RUNNING';
    const safeRelative = params.relativePath.replace(/^(\.\.(\/|\\|$))+/, '');
    const absPath = join(this.dataDir, session.workDirRelative, safeRelative);
    writeFileSync(absPath, params.content, 'utf8');
    session.status = 'SBX_READY';
    return { writtenPath: safeRelative, bytes: Buffer.byteLength(params.content, 'utf8') };
  }

  async invokeBrowserScreenshot(
    sessionId: string,
    params: { url?: string },
  ): Promise<{ screenshotPath: string; url: string; usedPlaywright: boolean }> {
    const session = this.requireReadySession(sessionId, ['playwright']);
    session.status = 'SBX_RUNNING';
    const url = params.url ?? 'https://example.com';
    const absDir = join(this.dataDir, session.workDirRelative);
    const { screenshotPath, usedPlaywright } = await captureBrowserScreenshot(absDir, url);
    session.status = 'SBX_READY';
    return { screenshotPath, url, usedPlaywright };
  }

  invokeCodeRun(
    sessionId: string,
    params: { code: string; language?: string },
  ): { stdout: string; exitCode: number; outputPath: string; usedDocker: boolean } {
    const session = this.requireReadySession(sessionId, ['docker']);
    session.status = 'SBX_RUNNING';
    const outputPath = 'code_run_output.txt';
    const absDir = join(this.dataDir, session.workDirRelative);
    const absPath = join(absDir, outputPath);

    let stdout: string;
    let exitCode: number;
    let usedDocker = false;

    if (dockerAvailable() && process.env.OPERON_DOCKER_STUB !== '1') {
      const js = params.language === 'javascript' || params.language === 'js'
        ? params.code
        : `console.log(${JSON.stringify(params.code)});`;
      const result = runDockerCode(absDir, js);
      stdout = result.stdout;
      exitCode = result.exitCode;
      usedDocker = true;
      writeFileSync(absPath, stdout, 'utf8');
    } else {
      stdout = `[docker-stub] ${params.code.slice(0, 200)}`;
      exitCode = 0;
      writeFileSync(absPath, stdout, 'utf8');
    }

    session.status = 'SBX_READY';
    return { stdout, exitCode, outputPath, usedDocker };
  }

  private requireReadySession(sessionId: string, allowed: SkillRuntime[]): SandboxSession {
    const session = this.sessions.get(sessionId);
    if (!session || session.status === 'SBX_DESTROYED') {
      throw new Error('Sandbox session not found');
    }
    if (!allowed.includes(session.runtimeType)) {
      throw new Error(`Skill runtime mismatch: expected ${allowed.join('|')}, got ${session.runtimeType}`);
    }
    return session;
  }
}

export function assertRuntimeAllowed(
  runtime: SkillRuntime,
  dockerAvailableFlag: boolean,
): void {
  if (runtime === 'docker' && !dockerAvailableFlag) {
    throw new Error('Docker required for docker runtime (SB-03)');
  }
}

export { dockerAvailable };
