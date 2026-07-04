export const COMPANY_NAME_MIN = 2;
export const COMPANY_NAME_MAX = 80;
export const OBJECTIVE_TITLE_MIN = 5;
export const OBJECTIVE_TITLE_MAX = 200;
export const OBJECTIVE_CONSTRAINTS_MAX = 2000;

export function validateCompanyName(name: unknown): string {
  if (typeof name !== 'string') throw new Error('公司名称必填');
  const trimmed = name.trim();
  if (trimmed.length < COMPANY_NAME_MIN || trimmed.length > COMPANY_NAME_MAX) {
    throw new Error(`公司名称须 ${COMPANY_NAME_MIN}-${COMPANY_NAME_MAX} 字符`);
  }
  return trimmed;
}

export function validateObjectiveTitle(title: unknown): string {
  if (typeof title !== 'string') throw new Error('目标标题必填');
  const trimmed = title.trim();
  if (trimmed.length < OBJECTIVE_TITLE_MIN || trimmed.length > OBJECTIVE_TITLE_MAX) {
    throw new Error(`目标标题须 ${OBJECTIVE_TITLE_MIN}-${OBJECTIVE_TITLE_MAX} 字符（CO-01）`);
  }
  return trimmed;
}

export function validateObjectiveConstraints(constraints: unknown): string | null {
  if (constraints == null || constraints === '') return null;
  if (typeof constraints !== 'string') throw new Error('约束条件格式无效');
  if (constraints.length > OBJECTIVE_CONSTRAINTS_MAX) {
    throw new Error(`约束条件不超过 ${OBJECTIVE_CONSTRAINTS_MAX} 字符`);
  }
  return constraints;
}
