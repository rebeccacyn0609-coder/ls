import type { Dayjs } from 'dayjs';

import {
  mockChannels,
  mockModels,
  mockProjects,
  mockUsageLogs,
  type UsageLogItem
} from './mockData';

export interface DashboardStats {
  totalTokens: number;
  totalRecharge: number;
  totalConsumption: number;
  totalChannelCost: number;
  totalProfit: number;
  totalCallCount: number;
}

export interface ChannelDashboardStats {
  totalTokens: number;
  totalChannelCost: number;
  totalConsumption: number;
  totalProfit: number;
  totalCallCount: number;
}

export interface DashboardTrendSeries {
  dates: string[];
  tokenUsage: number[];
  callCount: number[];
  consumption: number[];
  channelCost: number[];
  profit: number[];
  recharge: number[];
}

export interface DashboardQuery {
  projectId: string;
  dateRange?: [Dayjs, Dayjs] | null;
}

export interface ChannelDashboardQuery {
  channelId: string;
  dateRange?: [Dayjs, Dayjs] | null;
}

function parseLogTime(time: string): Date {
  return new Date(time.replace(' ', 'T'));
}

function formatChartDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}-${day}`;
}

function inDateRange(log: UsageLogItem, dateRange?: [Dayjs, Dayjs] | null): boolean {
  if (!dateRange?.[0] || !dateRange[1]) return true;
  const t = parseLogTime(log.time).getTime();
  const start = dateRange[0].startOf('day').valueOf();
  const end = dateRange[1].endOf('day').valueOf();
  return t >= start && t <= end;
}

/** 仅统计「项目管理」中的项目（排除渠道测试「灵数运营平台」） */
export function isManagedProjectLog(log: UsageLogItem): boolean {
  if (log.projectName === '灵数运营平台') return false;
  return mockProjects.some((p) => p.id === log.projectId);
}

/** 渠道侧成本：按模型渠道价估算（CNY） */
export function estimateChannelCost(log: UsageLogItem): number {
  if (log.type !== '消耗') return 0;
  const tokens = log.inputTokens + log.outputTokens;
  if (tokens <= 0) return 0;

  const model = mockModels.find((m) => m.modelName === log.model);
  if (!model) return Math.max(0, log.cost * 0.62);

  const channel = mockChannels.find((c) => c.name === log.channel);
  const channelPrice =
    model.channelPrices.find((p) => channel && p.channelId === channel.id) ||
    model.channelPrices[0];

  const inputUnit = (channelPrice?.inputPrice ?? model.inputPrice) / 1_000_000;
  const outputUnit =
    (channelPrice?.completionPrice ?? model.completionPrice ?? model.inputPrice) / 1_000_000;

  return log.inputTokens * inputUnit + log.outputTokens * outputUnit;
}

export function filterUsageLogs(
  logs: UsageLogItem[],
  { projectId, dateRange }: DashboardQuery
): UsageLogItem[] {
  return logs.filter((log) => {
    if (projectId !== 'all' && log.projectId !== projectId) return false;
    return inDateRange(log, dateRange);
  });
}

export function filterUsageLogsByChannel(
  logs: UsageLogItem[],
  { channelId, dateRange }: ChannelDashboardQuery
): UsageLogItem[] {
  return logs.filter((log) => {
    if (channelId !== 'all') {
      const ch = mockChannels.find((c) => c.id === channelId);
      if (!ch || log.channel !== ch.name) return false;
    }
    return inDateRange(log, dateRange);
  });
}

export function aggregateDashboardStats(logs: UsageLogItem[]): DashboardStats {
  let totalTokens = 0;
  let totalRecharge = 0;
  let totalConsumption = 0;
  let totalChannelCost = 0;
  let totalCallCount = 0;

  for (const log of logs) {
    const tokens = log.inputTokens + log.outputTokens;
    if (log.type === '消耗') {
      totalTokens += tokens;
      totalConsumption += log.cost;
      totalChannelCost += estimateChannelCost(log);
      totalCallCount += 1;
    } else if (log.type === '扣款' && !log.projectBalanceOp) {
      totalTokens -= tokens;
      totalConsumption += log.cost;
      totalChannelCost -= estimateChannelCost({ ...log, type: '消耗', cost: Math.abs(log.cost) });
    } else if (log.type === '充值' && log.projectBalanceOp === true) {
      totalRecharge += log.cost;
    }
  }

  return {
    totalTokens: Math.max(0, totalTokens),
    totalRecharge,
    totalConsumption: Math.max(0, totalConsumption),
    totalChannelCost: Math.max(0, totalChannelCost),
    totalProfit: Math.max(0, totalConsumption) - Math.max(0, totalChannelCost),
    totalCallCount
  };
}

export function aggregateChannelDashboardStats(logs: UsageLogItem[]): ChannelDashboardStats {
  let totalTokens = 0;
  let totalChannelCost = 0;
  let totalConsumption = 0;
  let totalCallCount = 0;

  for (const log of logs) {
    const tokens = log.inputTokens + log.outputTokens;
    if (log.type === '消耗') {
      totalTokens += tokens;
      totalConsumption += log.cost;
      totalChannelCost += estimateChannelCost(log);
      totalCallCount += 1;
    } else if (log.type === '扣款' && !log.projectBalanceOp) {
      totalTokens -= tokens;
      totalConsumption += log.cost;
      totalChannelCost -= estimateChannelCost({ ...log, type: '消耗', cost: Math.abs(log.cost) });
    }
  }

  const consumption = Math.max(0, totalConsumption);
  const channelCost = Math.max(0, totalChannelCost);

  return {
    totalTokens: Math.max(0, totalTokens),
    totalChannelCost: channelCost,
    totalConsumption: consumption,
    totalProfit: consumption - channelCost,
    totalCallCount
  };
}

function buildDateBuckets(logs: UsageLogItem[]): string[] {
  const set = new Set<string>();
  for (const log of logs) {
    set.add(formatChartDate(parseLogTime(log.time)));
  }
  return [...set].sort((a, b) => {
    const [am, ad] = a.split('-').map(Number);
    const [bm, bd] = b.split('-').map(Number);
    return am !== bm ? am - bm : ad - bd;
  });
}

type BucketRow = {
  tokenUsage: number;
  callCount: number;
  consumption: number;
  channelCost: number;
  recharge: number;
};

function emptyBucket(): BucketRow {
  return { tokenUsage: 0, callCount: 0, consumption: 0, channelCost: 0, recharge: 0 };
}

function applyLogToBucket(b: BucketRow, log: UsageLogItem, modelFilter?: string) {
  if (modelFilter && modelFilter !== 'all' && log.model !== modelFilter) return;
  const tokens = log.inputTokens + log.outputTokens;

  if (log.type === '消耗') {
    b.tokenUsage += tokens;
    b.callCount += 1;
    b.consumption += log.cost;
    b.channelCost += estimateChannelCost(log);
  } else if (log.type === '扣款' && !log.projectBalanceOp) {
    b.tokenUsage -= tokens;
    b.consumption += log.cost;
    b.channelCost -= estimateChannelCost({ ...log, type: '消耗', cost: Math.abs(log.cost) });
  } else if (log.type === '充值' && log.projectBalanceOp === true) {
    b.recharge += log.cost;
  }
}

/** 无日志时生成默认日期轴（保证图表默认有展示） */
function defaultTrendDates(): string[] {
  return ['05-19', '05-20', '05-21', '05-22', '05-23', '05-24', '05-25'];
}

function emptyTrendSeries(dates: string[]): DashboardTrendSeries {
  const zeros = dates.map(() => 0);
  return {
    dates,
    tokenUsage: zeros,
    callCount: zeros,
    consumption: zeros,
    channelCost: zeros,
    profit: zeros,
    recharge: zeros
  };
}

export function aggregateDashboardTrend(logs: UsageLogItem[]): DashboardTrendSeries {
  const dates = buildDateBuckets(logs);
  if (dates.length === 0) {
    return emptyTrendSeries(defaultTrendDates());
  }

  const buckets = new Map<string, BucketRow>();
  for (const d of dates) buckets.set(d, emptyBucket());

  for (const log of logs) {
    const key = formatChartDate(parseLogTime(log.time));
    const b = buckets.get(key);
    if (!b) continue;
    applyLogToBucket(b, log);
  }

  return seriesFromBuckets(dates, buckets);
}

export interface ModelCallTrendPoint {
  name: string;
  data: number[];
}

export interface ModelCallTrendSeries {
  dates: string[];
  series: ModelCallTrendPoint[];
}

/** 模型调用次数趋势：单模型一条序列，「全部」则按模型分序列展示 */
export function aggregateModelCallTrendSeries(
  logs: UsageLogItem[],
  modelFilter: string
): ModelCallTrendSeries {
  const consumeLogs = logs.filter((l) => l.type === '消耗');
  let dates = buildDateBuckets(consumeLogs);
  if (dates.length === 0) {
    dates = buildDateBuckets(logs);
  }
  if (dates.length === 0) {
    dates = defaultTrendDates();
  }

  const models =
    modelFilter === 'all' ? collectModelsFromLogs(logs) : [modelFilter].filter(Boolean);

  if (models.length === 0) {
    return { dates, series: [] };
  }

  const series = models.map((modelName) => {
    const buckets = new Map<string, number>();
    for (const d of dates) buckets.set(d, 0);

    for (const log of consumeLogs) {
      if (log.model !== modelName) continue;
      const key = formatChartDate(parseLogTime(log.time));
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    return {
      name: modelName,
      data: dates.map((d) => buckets.get(d) ?? 0)
    };
  });

  return { dates, series };
}

/** @deprecated 使用 aggregateModelCallTrendSeries */
export function aggregateModelCallTrend(logs: UsageLogItem[], modelFilter: string) {
  const { dates, series } = aggregateModelCallTrendSeries(logs, modelFilter);
  const first = series[0];
  return {
    dates,
    callCount: first?.data ?? dates.map(() => 0)
  };
}

function seriesFromBuckets(dates: string[], buckets: Map<string, BucketRow>): DashboardTrendSeries {
  return {
    dates,
    tokenUsage: dates.map((d) => Math.max(0, buckets.get(d)!.tokenUsage)),
    callCount: dates.map((d) => buckets.get(d)!.callCount),
    consumption: dates.map((d) => Math.max(0, buckets.get(d)!.consumption)),
    channelCost: dates.map((d) => Math.max(0, buckets.get(d)!.channelCost)),
    profit: dates.map((d) => {
      const row = buckets.get(d)!;
      return Math.max(0, row.consumption) - Math.max(0, row.channelCost);
    }),
    recharge: dates.map((d) => buckets.get(d)!.recharge)
  };
}

export function computeChannelDashboard(query: ChannelDashboardQuery, logs = mockUsageLogs) {
  const filtered = filterUsageLogsByChannel(logs, query);
  return {
    stats: aggregateChannelDashboardStats(filtered),
    trend: aggregateDashboardTrend(
      filtered.filter((l) => l.type === '消耗' || (l.type === '扣款' && !l.projectBalanceOp))
    ),
    filtered
  };
}

export function computeProjectDashboard(query: DashboardQuery, logs = mockUsageLogs) {
  const managed = logs.filter(isManagedProjectLog);
  const filtered = filterUsageLogs(managed, query);
  return {
    stats: aggregateDashboardStats(filtered),
    trend: aggregateDashboardTrend(filtered),
    filtered,
    filteredCount: filtered.length
  };
}

/** @deprecated 使用 computeProjectDashboard */
export function computeDashboard(query: DashboardQuery, logs = mockUsageLogs) {
  return computeProjectDashboard(query, logs);
}

export function collectModelsFromLogs(logs: UsageLogItem[]): string[] {
  const set = new Set<string>();
  for (const log of logs) {
    if (log.type === '消耗' && log.model && log.model !== '-') {
      set.add(log.model);
    }
  }
  return [...set].sort();
}

export function formatFilterScopeLabel(query: DashboardQuery, projectName?: string): string {
  const project =
    query.projectId === 'all' ? '全部项目' : projectName || '指定项目';
  if (!query.dateRange?.[0] || !query.dateRange[1]) {
    return `${project} · 全部时间`;
  }
  return `${project} · ${query.dateRange[0].format('YYYY-MM-DD')} ~ ${query.dateRange[1].format('YYYY-MM-DD')}`;
}

export function formatChannelScopeLabel(query: ChannelDashboardQuery, channelName?: string): string {
  const channel = query.channelId === 'all' ? '全部渠道' : channelName || '指定渠道';
  if (!query.dateRange?.[0] || !query.dateRange[1]) {
    return `${channel} · 全部时间`;
  }
  return `${channel} · ${query.dateRange[0].format('YYYY-MM-DD')} ~ ${query.dateRange[1].format('YYYY-MM-DD')}`;
}
