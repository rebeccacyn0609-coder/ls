import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import {
  mockResourceGroups,
  mockResourceItems,
  mockUsageLogs,
  projectBalance,
  type UsageLogRow,
  type UsageLogType,
} from './mockData';

export interface UsageStatsQuery {
  timeRange: [Dayjs, Dayjs] | null;
  groupCode?: string;
  resourceCode?: string;
  model?: string;
  logType?: UsageLogType | 'all';
}

export interface UsageStatsSummary {
  consumeTotal: number;
  rechargeTotal: number;
  deductTotal: number;
}

export interface UsageStatsResult {
  rows: UsageLogRow[];
  summary: UsageStatsSummary;
  balance: {
    current: number;
    unlimited: boolean;
    totalSpent: number;
  };
  fetchedAt: Date;
}

const CONFIGURED_MODELS = new Set(mockResourceItems.map((item) => item.model));
const CONFIGURED_RESOURCE_CODES = new Set(mockResourceItems.map((item) => item.code));
const CONFIGURED_GROUP_CODES = new Set(mockResourceGroups.map((group) => group.code));

function parseLogTime(time: string): Dayjs {
  return dayjs(time.replace(' ', 'T'));
}

function isConfiguredLog(row: UsageLogRow): boolean {
  if (row.type === '充值' && row.resourceCode === '-') return true;
  if (row.model !== '-' && CONFIGURED_MODELS.has(row.model)) return true;
  if (CONFIGURED_RESOURCE_CODES.has(row.resourceCode)) return true;
  if (row.groupCode !== '-' && CONFIGURED_GROUP_CODES.has(row.groupCode)) return true;
  return false;
}

function inTimeRange(row: UsageLogRow, timeRange: [Dayjs, Dayjs] | null): boolean {
  if (!timeRange?.[0] || !timeRange[1]) return true;
  const t = parseLogTime(row.time).valueOf();
  return t >= timeRange[0].valueOf() && t <= timeRange[1].valueOf();
}

function matchesFuzzy(value: string, keyword?: string): boolean {
  if (!keyword?.trim()) return true;
  return value.toLowerCase().includes(keyword.trim().toLowerCase());
}

function matchesLogType(row: UsageLogRow, logType?: UsageLogType | 'all'): boolean {
  if (!logType || logType === 'all') return true;
  return row.type === logType;
}

export function filterUsageLogs(query: UsageStatsQuery): UsageLogRow[] {
  return mockUsageLogs.filter((row) => {
    if (!isConfiguredLog(row)) return false;
    if (!inTimeRange(row, query.timeRange)) return false;
    if (!matchesFuzzy(row.groupCode, query.groupCode)) return false;
    if (!matchesFuzzy(row.resourceCode, query.resourceCode)) return false;
    if (!matchesFuzzy(row.model, query.model)) return false;
    if (!matchesLogType(row, query.logType)) return false;
    return true;
  });
}

export function summarizeUsageLogs(rows: UsageLogRow[]): UsageStatsSummary {
  let consumeTotal = 0;
  let rechargeTotal = 0;
  let deductTotal = 0;

  rows.forEach((row) => {
    const amount = Number(row.costCny) || 0;
    if (row.type === '消耗') consumeTotal += amount;
    if (row.type === '充值') rechargeTotal += amount;
    if (row.type === '扣款') deductTotal += amount;
  });

  return {
    consumeTotal: Number(consumeTotal.toFixed(2)),
    rechargeTotal: Number(rechargeTotal.toFixed(2)),
    deductTotal: Number(deductTotal.toFixed(2)),
  };
}

/** 模拟调用运营管理端接口：默认返回已配置模型的全部日志，支持条件筛选 */
export function fetchUsageStats(query: UsageStatsQuery): Promise<UsageStatsResult> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const rows = filterUsageLogs(query);
      const summary = summarizeUsageLogs(rows);
      resolve({
        rows,
        summary,
        balance: {
          current: Number((projectBalance.current - Math.random() * 0.3).toFixed(2)),
          unlimited: projectBalance.unlimited,
          totalSpent: projectBalance.totalSpent,
        },
        fetchedAt: new Date(),
      });
    }, 280);
  });
}

export const DEFAULT_USAGE_QUERY: UsageStatsQuery = {
  timeRange: null,
  groupCode: undefined,
  resourceCode: undefined,
  model: undefined,
  logType: 'all',
};
