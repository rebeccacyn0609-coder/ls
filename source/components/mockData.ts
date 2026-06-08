export type ResourceType = 'group' | 'item';

export type UsageLogType = '消耗' | '充值' | '扣款';

export interface ResourceGroup {
  id: string;
  name: string;
  code: string;
  balance: number | null;
}

export interface ResourceItem {
  id: string;
  name: string;
  code: string;
  groupId: string;
  model: string;
}

export interface UsageLogRow {
  id: string;
  type: UsageLogType;
  time: string;
  groupCode: string;
  resourceCode: string;
  model: string;
  durationMs: number;
  tokens: number;
  costCny: number;
  balanceAfter: number | null;
  remark: string;
}

export const mockResourceGroups: ResourceGroup[] = [
  { id: 'g1', name: 'GPT-4o 均衡组', code: 'BAL-GPT4O-01', balance: 12850.5 },
  { id: 'g2', name: 'Claude 推理组', code: 'BAL-CLAUDE-02', balance: null },
  { id: 'g3', name: '国产模型组', code: 'BAL-CN-03', balance: 3200 },
];

export const mockResourceItems: ResourceItem[] = [
  { id: 'i1', name: 'GPT-4o-mini', code: 'RES-GPT4O-MINI', groupId: 'g1', model: 'gpt-4o-mini' },
  { id: 'i2', name: 'GPT-4o', code: 'RES-GPT4O', groupId: 'g1', model: 'gpt-4o' },
  { id: 'i3', name: 'Claude-3.5-Sonnet', code: 'RES-CLAUDE-35', groupId: 'g2', model: 'claude-3-5-sonnet' },
  { id: 'i4', name: 'Qwen-Max', code: 'RES-QWEN-MAX', groupId: 'g3', model: 'qwen-max' },
];

function recentTime(daysAgo: number, hour: number, minute: number, second: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, second, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export const mockUsageLogs: UsageLogRow[] = [
  {
    id: 'log-1',
    type: '消耗',
    time: recentTime(0, 14, 32, 18),
    groupCode: 'BAL-GPT4O-01',
    resourceCode: 'RES-GPT4O-MINI',
    model: 'gpt-4o-mini',
    durationMs: 1240,
    tokens: 1856,
    costCny: 0.37,
    balanceAfter: 12850.13,
    remark: '对话补全',
  },
  {
    id: 'log-2',
    type: '消耗',
    time: recentTime(0, 13, 58, 2),
    groupCode: 'BAL-GPT4O-01',
    resourceCode: 'RES-GPT4O',
    model: 'gpt-4o',
    durationMs: 3420,
    tokens: 4208,
    costCny: 2.52,
    balanceAfter: 12850.5,
    remark: '代码生成',
  },
  {
    id: 'log-3',
    type: '充值',
    time: recentTime(0, 10, 0, 0),
    groupCode: 'BAL-GPT4O-01',
    resourceCode: '-',
    model: '-',
    durationMs: 0,
    tokens: 0,
    costCny: 5000,
    balanceAfter: 12853.02,
    remark: '运营管理端项目额度充值',
  },
  {
    id: 'log-4',
    type: '扣款',
    time: recentTime(1, 18, 20, 11),
    groupCode: 'BAL-CN-03',
    resourceCode: 'RES-QWEN-MAX',
    model: 'qwen-max',
    durationMs: 890,
    tokens: 960,
    costCny: 0.19,
    balanceAfter: 3200,
    remark: '调用失败扣款',
  },
  {
    id: 'log-5',
    type: '消耗',
    time: recentTime(1, 16, 45, 33),
    groupCode: '-',
    resourceCode: 'RES-CLAUDE-35',
    model: 'claude-3-5-sonnet',
    durationMs: 2100,
    tokens: 3102,
    costCny: 1.86,
    balanceAfter: null,
    remark: '额度无限项目',
  },
  {
    id: 'log-6',
    type: '消耗',
    time: recentTime(2, 9, 12, 44),
    groupCode: 'BAL-GPT4O-01',
    resourceCode: 'RES-GPT4O-MINI',
    model: 'gpt-4o-mini',
    durationMs: 680,
    tokens: 512,
    costCny: 0.1,
    balanceAfter: 7853.02,
    remark: '摘要提取',
  },
];

export const projectBalance = {
  current: 12850.5,
  unlimited: false,
  totalSpent: 24680.32,
};

export function formatCny(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatTokens(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return Math.round(value).toLocaleString('zh-CN');
}

export function formatBalance(value: number | null, unlimited: boolean): string {
  if (unlimited) return '无限';
  if (value === null) return '—';
  return `¥${formatCny(value)}`;
}
