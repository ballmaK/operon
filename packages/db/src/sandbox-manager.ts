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

export class SandboxManager {
  private readonly sessions = new Map<string, SandboxSession>();

  constructor(private readonly dataDir: string) {}

  create(input: CreateSandboxSessionRequest): SandboxSession {
    const id = randomUUID();
    const workDirRelative = posixJoin('sandboxes', input.agentRunId, id);
    const absDir = join(this.dataDir, workDirRelative);
    mkdirSync(absDir, { recursive: true });

    const session: SandboxSession = {
      id,
      runtimeType: input.runtimeType,
      workDirRelative,
      status: 'SBX_READY',
      agentRunId: input.agentRunId,
      createdAt: new Date().toISOString(),
    };
    this.sessions.set(id, session);
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
    const session = this.sessions.get(sessionId);
    if (!session || session.status === 'SBX_DESTROYED') {
      throw new Error('Sandbox session not found');
    }
    const skill = getSkill('file_write');
    if (!skill) throw new Error('file_write skill not registered');

    session.status = 'SBX_RUNNING';
    const safeRelative = params.relativePath.replace(/^(\.\.(\/|\\|$))+/, '');
    const absPath = join(this.dataDir, session.workDirRelative, safeRelative);
    writeFileSync(absPath, params.content, 'utf8');
    session.status = 'SBX_READY';

    return { writtenPath: safeRelative, bytes: Buffer.byteLength(params.content, 'utf8') };
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
