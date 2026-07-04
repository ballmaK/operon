export const HANDOFF_CONTEXT_MAX = 2000;
export const HANDOFF_REQUEST_MAX = 1000;
export const HANDOFF_REPLY_MAX = 2000;

export function validateHandoffCreate(input: {
  contextSummary?: unknown;
  request?: unknown;
  fromDepartmentId?: unknown;
  toDepartmentId?: unknown;
}): { contextSummary: string; request: string } {
  const contextSummary =
    typeof input.contextSummary === 'string' ? input.contextSummary.trim() : '';
  const request = typeof input.request === 'string' ? input.request.trim() : '';
  const fromId =
    typeof input.fromDepartmentId === 'string' ? input.fromDepartmentId.trim() : '';
  const toId = typeof input.toDepartmentId === 'string' ? input.toDepartmentId.trim() : '';

  if (!fromId || !toId) throw new Error('发起/接收部门必填');
  if (fromId === toId) throw new Error('不能向同一部门交接');
  if (!contextSummary) throw new Error('上下文摘要必填（HO-01）');
  if (contextSummary.length > HANDOFF_CONTEXT_MAX) {
    throw new Error(`上下文摘要不超过 ${HANDOFF_CONTEXT_MAX} 字符`);
  }
  if (!request) throw new Error('明确请求必填（HO-01）');
  if (request.length > HANDOFF_REQUEST_MAX) {
    throw new Error(`明确请求不超过 ${HANDOFF_REQUEST_MAX} 字符`);
  }

  return { contextSummary, request };
}

export function validateHandoffReply(reply: unknown): string {
  const text = typeof reply === 'string' ? reply.trim() : '';
  if (!text) throw new Error('回复摘要必填');
  if (text.length > HANDOFF_REPLY_MAX) {
    throw new Error(`回复摘要不超过 ${HANDOFF_REPLY_MAX} 字符`);
  }
  return text;
}
