import type { Skill } from '@operon/shared-types';

/** MVP skill registry — M10 PRD table */
export const MVP_SKILLS: Skill[] = [
  {
    code: 'web_search',
    name: '网页搜索',
    riskLevel: 'low',
    runtime: 'playwright',
    platforms: ['win32', 'darwin', 'linux'],
  },
  {
    code: 'web_extract',
    name: '页面提取',
    riskLevel: 'low',
    runtime: 'playwright',
    platforms: ['win32', 'darwin', 'linux'],
  },
  {
    code: 'browser_screenshot',
    name: '浏览器截图',
    riskLevel: 'low',
    runtime: 'playwright',
    platforms: ['win32', 'darwin', 'linux'],
  },
  {
    code: 'file_write',
    name: '写本地文件',
    riskLevel: 'medium',
    runtime: 'subprocess',
    platforms: ['win32', 'darwin', 'linux'],
  },
  {
    code: 'code_run',
    name: '执行代码',
    riskLevel: 'high',
    runtime: 'docker',
    platforms: ['win32', 'darwin', 'linux'],
  },
  {
    code: 'doc_generate',
    name: '生成文档',
    riskLevel: 'low',
    runtime: 'subprocess',
    platforms: ['win32', 'darwin', 'linux'],
  },
];

export function getSkill(code: string): Skill | undefined {
  return MVP_SKILLS.find((s) => s.code === code);
}
