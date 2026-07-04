import {
  MAX_MINIMAL_MEMORY_BYTES,
  MAX_WORKER_BRIEF_CHARS,
  type SpawnWorkerRequest,
} from '@operon/shared-types';

export function validateWorkerSpawn(input: SpawnWorkerRequest): void {
  if (!input.taskId) throw new Error('taskId required');
  if (!input.brief?.trim()) throw new Error('brief required');
  if (input.brief.length > MAX_WORKER_BRIEF_CHARS) {
    throw new Error(`brief exceeds ${MAX_WORKER_BRIEF_CHARS} chars (WK brief limit)`);
  }
  const memBytes = Buffer.byteLength(input.minimalMemory ?? '', 'utf8');
  if (memBytes > MAX_MINIMAL_MEMORY_BYTES) {
    throw new Error(`minimalMemory exceeds ${MAX_MINIMAL_MEMORY_BYTES} bytes (LE-01)`);
  }
  if (!input.allowedSkills?.length) {
    throw new Error('allowedSkills required (WK-01)');
  }
}

export function assertSkillAllowed(skillCode: string, allowed: string[]): void {
  if (!allowed.includes(skillCode)) {
    throw new Error(`Skill not allowed: ${skillCode} (WK-01)`);
  }
}
