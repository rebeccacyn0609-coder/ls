import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import {
  mockResourceGroups,
  mockResourceItems,
  type ResourceType,
} from './mockData';

export interface ResourceDashboardQuery {
  resourceType: ResourceType;
  resourceId: string;
  dateRange: [Dayjs, Dayjs] | null;
}

export interface ResourceDashboardStats {
  totalTokens: number | null;
  totalCost: number | null;
  balance: number | null;
  balanceUnlimited: boolean;
  totalCalls: number | null;
}

export interface TokenTrendPoint {
  date: string;
  tokens: number;
  costCny: number;
}

export interface CallTrendPoint {
  date: string;
  [model: string]: string | number;
}

export interface ResourceDashboardResult {
  stats: ResourceDashboardStats;
  tokenTrend: TokenTrendPoint[];
  callTrend: CallTrendPoint[];
  availableModels: string[];
}

interface DailyUsageRecord {
  at: Dayjs;
  groupId: string;
  itemId: string;
  model: string;
  tokens: number;
  costCny: number;
  calls: number;
}

/** 覆盖「近 30 天」快捷筛选，按当前日期动态生成 */
const DAY_COUNT = 35;

const ITEM_DAILY_PROFILE: Record<string, { tokenBase: number; costBase: number; callBase: number; wave: number }> = {
  i1: { tokenBase: 9200, costBase: 17.4, callBase: 52, wave: 1.0 },
  i2: { tokenBase: 6400, costBase: 12.1, callBase: 28, wave: 1.15 },
  i3: { tokenBase: 4800, costBase: 9.2, callBase: 18, wave: 0.9 },
  i4: { tokenBase: 3600, costBase: 6.8, callBase: 12, wave: 1.05 },
};

function buildDailyRecords(): DailyUsageRecord[] {
  const records: DailyUsageRecord[] = [];
  const today = dayjs().startOf('day');

  mockResourceItems.forEach((item) => {
    const profile = ITEM_DAILY_PROFILE[item.id] ?? { tokenBase: 5000, costBase: 9.5, callBase: 20, wave: 1 };
    for (let offset = DAY_COUNT - 1; offset >= 0; offset -= 1) {
      const at = today.subtract(offset, 'day').hour(12);
      const dayIndex = DAY_COUNT - 1 - offset;
      const factor = 1 + (dayIndex % 3) * 0.12 + (dayIndex % 2) * 0.08;
      records.push({
        at,
        groupId: item.groupId,
        itemId: item.id,
        model: item.model,
        tokens: Math.round(profile.tokenBase * factor * profile.wave),
        costCny: Number((profile.costBase * factor * profile.wave).toFixed(2)),
        calls: Math.round(profile.callBase * factor),
      });
    }
  });

  return records;
}

const DAILY_RECORDS = buildDailyRecords();

function inQueryDateRange(at: Dayjs, dateRange: [Dayjs, Dayjs] | null): boolean {
  if (!dateRange?.[0] || !dateRange[1]) return true;
  const recordDay = at.startOf('day').valueOf();
  const rangeStart = dateRange[0].startOf('day').valueOf();
  const rangeEnd = dateRange[1].endOf('day').valueOf();
  return recordDay >= rangeStart && recordDay <= rangeEnd;
}

function filterRecords(query: ResourceDashboardQuery): DailyUsageRecord[] {
  if (!query.resourceId) return [];

  return DAILY_RECORDS.filter((record) => {
    if (!inQueryDateRange(record.at, query.dateRange)) return false;
    if (query.resourceType === 'group') {
      return record.groupId === query.resourceId;
    }
    return record.itemId === query.resourceId;
  });
}

function resolveBalance(query: ResourceDashboardQuery): Pick<ResourceDashboardStats, 'balance' | 'balanceUnlimited'> {
  if (query.resourceType === 'group') {
    const group = mockResourceGroups.find((item) => item.id === query.resourceId);
    if (!group) return { balance: null, balanceUnlimited: false };
    return { balance: group.balance, balanceUnlimited: group.balance === null };
  }
  return { balance: null, balanceUnlimited: true };
}

function formatChartDate(at: Dayjs): string {
  return at.format('MM-DD');
}

export function computeResourceDashboard(query: ResourceDashboardQuery): ResourceDashboardResult {
  const records = filterRecords(query);
  const balanceInfo = resolveBalance(query);

  if (!query.resourceId) {
    return {
      stats: {
        totalTokens: null,
        totalCost: null,
        balance: null,
        balanceUnlimited: false,
        totalCalls: null,
      },
      tokenTrend: [],
      callTrend: [],
      availableModels: [],
    };
  }

  if (records.length === 0) {
    return {
      stats: {
        totalTokens: 0,
        totalCost: 0,
        balance: balanceInfo.balance,
        balanceUnlimited: balanceInfo.balanceUnlimited,
        totalCalls: 0,
      },
      tokenTrend: [],
      callTrend: [],
      availableModels: [],
    };
  }

  const totalTokens = records.reduce((sum, row) => sum + row.tokens, 0);
  const totalCost = Number(records.reduce((sum, row) => sum + row.costCny, 0).toFixed(2));
  const totalCalls = records.reduce((sum, row) => sum + row.calls, 0);

  const dayMap = new Map<string, { at: Dayjs; tokens: number; costCny: number; models: Record<string, number> }>();

  records.forEach((record) => {
    const key = record.at.format('YYYY-MM-DD');
    const bucket = dayMap.get(key) ?? {
      at: record.at,
      tokens: 0,
      costCny: 0,
      models: {},
    };
    bucket.tokens += record.tokens;
    bucket.costCny = Number((bucket.costCny + record.costCny).toFixed(2));
    bucket.models[record.model] = (bucket.models[record.model] ?? 0) + record.calls;
    dayMap.set(key, bucket);
  });

  const sortedDays = [...dayMap.values()].sort((a, b) => a.at.valueOf() - b.at.valueOf());
  const availableModels = [...new Set(records.map((row) => row.model))].sort();

  const tokenTrend: TokenTrendPoint[] = sortedDays.map((day) => ({
    date: formatChartDate(day.at),
    tokens: day.tokens,
    costCny: day.costCny,
  }));

  const callTrend: CallTrendPoint[] = sortedDays.map((day) => {
    const point: CallTrendPoint = { date: formatChartDate(day.at) };
    availableModels.forEach((model) => {
      point[model] = day.models[model] ?? 0;
    });
    return point;
  });

  return {
    stats: {
      totalTokens,
      totalCost,
      balance: balanceInfo.balance,
      balanceUnlimited: balanceInfo.balanceUnlimited,
      totalCalls,
    },
    tokenTrend,
    callTrend,
    availableModels,
  };
}
