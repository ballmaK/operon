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

/** Minimal 1x1 PNG for browser_screenshot stub */
const STUB_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

export class SandboxManager {
  private readonly sessions = new Map<string, SandboxSession>();

  constructor(private readonly dataDir: string) {}

  create(input: CreateSandboxSessionRequest, dockerAvailable = true): SandboxSession {
    if (input.runtimeType === 'docker') {
      assertRuntimeAllowed('docker', dockerAvailable);
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

    if (input.runtimeType === 'docker') {
      session.status = 'SBX_READY';
    }

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
    const session = this.requireReadySession(sessionId, ['subprocess']);
    const skill = getSkill('file_write');
    if (!skill) throw new Error('file_write skill not registered');

    session.status = 'SBX_RUNNING';
    const safeRelative = params.relativePath.replace(/^(\.\.(\/|\\|$))+/, '');
    const absPath = join(this.dataDir, session.workDirRelative, safeRelative);
    writeFileSync(absPath, params.content, 'utf8');
    session.status = 'SBX_READY';

    return { writtenPath: safeRelative, bytes: Buffer.byteLength(params.content, 'utf8') };
  }

  invokeBrowserScreenshot(
    sessionId: string,
    params: { url?: string },
  ): { screenshotPath: string; url: string } {
    const session = this.requireReadySession(sessionId, ['playwright']);
    session.status = 'SBX_RUNNING';
    const url = params.url ?? 'about:blank';
    const screenshotPath = 'screenshot.png';
    const absPath = join(this.dataDir, session.workDirRelative, screenshotPath);
    writeFileSync(absPath, STUB_PNG);
    session.status = 'SBX_READY';
    return { screenshotPath, url };
  }

  invokeCodeRun(
    sessionId: string,
    params: { code: string; language?: string },
  ): { stdout: string; exitCode: number; outputPath: string } {
    const session = this.requireReadySession(sessionId, ['docker']);
    session.status = 'SBX_RUNNING';
    const outputPath = 'code_run_output.txt';
    const absPath = join(this.dataDir, session.workDirRelative, outputPath);
    const stdout = `[docker-stub] executed ${params.language ?? 'shell'} (${params.code.length} chars)`;
    writeFileSync(absPath, stdout, 'utf8');
    session.status = 'SBX_READY';
    return { stdout, exitCode: 0, outputPath };
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
  dockerAvailable: boolean,
): void {
  if (runtime === 'docker' && !dockerAvailable) {
    throw new Error('Docker required for docker runtime (SB-03)');
  }
}
