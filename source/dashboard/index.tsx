/**
 * @name 数据看板
 */

import '../components/page.css';

import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { Card, Statistic, Select, DatePicker, Typography, Button, message, Tooltip, Tabs, Space } from 'antd';
import {
  ThunderboltOutlined,
  DollarOutlined,
  ApiOutlined,
  RiseOutlined,
  FilterOutlined,
  SearchOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CloudServerOutlined,
  ProjectOutlined
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

import { mockProjects, mockChannels } from '../components/mockData';
import {
  computeChannelDashboard,
  computeProjectDashboard,
  aggregateModelCallTrendSeries,
  collectModelsFromLogs,
  formatFilterScopeLabel,
  formatChannelScopeLabel,
  type DashboardQuery,
  type ChannelDashboardQuery,
  type ChannelDashboardStats,
  type DashboardStats,
  type ModelCallTrendSeries
} from '../components/dashboardStats';
import { PageHeader } from '../components/PageHeader';

echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const { Text } = Typography;
const { RangePicker } = DatePicker;

const CHART_COLORS = ['#722ed1', '#1677ff', '#52c41a', '#fa8c16', '#13c2c2', '#eb2f96', '#faad14'];

type TooltipParam = {
  axisValue?: string;
  seriesName?: string;
  value?: number | number[];
  marker?: string;
};

function formatDashboardMoney(value: number) {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDashboardNumber(value: number, fractionDigits: number) {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  });
}

function isCnySeriesName(name: string) {
  return /CNY|金额|成本|利润/.test(name);
}

function buildTrendChartTooltip() {
  return {
    trigger: 'axis' as const,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: '#f0f0f0',
    textStyle: { color: 'rgba(0,0,0,0.88)', fontSize: 12 },
    formatter(params: TooltipParam | TooltipParam[]) {
      const list = Array.isArray(params) ? params : [params];
      if (!list.length) return '';
      const title = list[0].axisValue ?? '';
      const lines = list.map((item) => {
        const raw = Array.isArray(item.value) ? item.value[1] : item.value;
        const val = Number(raw ?? 0);
        const name = item.seriesName ?? '';
        const formatted = name.includes('Token')
          ? formatDashboardNumber(val, 0)
          : isCnySeriesName(name)
            ? formatDashboardMoney(val)
            : formatDashboardNumber(val, 2);
        return `${item.marker ?? ''} ${name}: ${formatted}`;
      });
      return `${title}<br/>${lines.join('<br/>')}`;
    }
  };
}

function buildCallCountChartTooltip() {
  return {
    trigger: 'axis' as const,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: '#f0f0f0',
    textStyle: { color: 'rgba(0,0,0,0.88)', fontSize: 12 },
    formatter(params: TooltipParam | TooltipParam[]) {
      const list = Array.isArray(params) ? params : [params];
      if (!list.length) return '';
      const title = list[0].axisValue ?? '';
      const lines = list.map((item) => {
        const raw = Array.isArray(item.value) ? item.value[1] : item.value;
        const val = Number(raw ?? 0);
        return `${item.marker ?? ''} ${item.seriesName ?? ''}: ${formatDashboardNumber(val, 2)} 次`;
      });
      return `${title}<br/>${lines.join('<br/>')}`;
    }
  };
}

const DEFAULT_CHANNEL_QUERY: ChannelDashboardQuery = { channelId: 'all', dateRange: null };
const DEFAULT_PROJECT_QUERY: DashboardQuery = { projectId: 'all', dateRange: null };

type StatItem = {
  title: string;
  tip: string;
  value: number;
  suffix?: string;
  prefix?: string;
  precision?: number;
  color: string;
  bg: string;
  icon: React.ReactNode;
};

function buildChannelStatItems(stats: ChannelDashboardStats): StatItem[] {
  return [
    {
      title: '总调用 Token 数',
      tip: '含渠道测试在内的 Token 消耗总量',
      value: stats.totalTokens,
      suffix: 'tokens',
      color: '#1677ff',
      bg: 'rgba(22, 119, 255, 0.1)',
      icon: <ThunderboltOutlined />
    },
    {
      title: '总 Token 消费成本金额',
      tip: '渠道单价 × Token 数量（含渠道测试，CNY）',
      value: stats.totalChannelCost,
      prefix: '¥',
      precision: 2,
      color: '#13c2c2',
      bg: 'rgba(19, 194, 194, 0.1)',
      icon: <DollarOutlined />
    },
    {
      title: '总利润',
      tip: '客户单价 × Token − 渠道单价 × Token（CNY）',
      value: stats.totalProfit,
      prefix: '¥',
      precision: 2,
      color: '#fa8c16',
      bg: 'rgba(250, 140, 22, 0.1)',
      icon: <RiseOutlined />
    },
    {
      title: '总模型调用次数',
      tip: '「消耗」类日志条数',
      value: stats.totalCallCount,
      suffix: '次',
      color: '#722ed1',
      bg: 'rgba(114, 46, 209, 0.1)',
      icon: <ApiOutlined />
    }
  ];
}

function buildProjectStatItems(stats: DashboardStats): StatItem[] {
  return [
    {
      title: '总调用 Token 数',
      tip: '项目管理内项目的 Token 消耗总量',
      value: stats.totalTokens,
      suffix: 'tokens',
      color: '#1677ff',
      bg: 'rgba(22, 119, 255, 0.1)',
      icon: <ThunderboltOutlined />
    },
    {
      title: '总 Token 消费金额',
      tip: '客户单价 × Token 数（CNY）',
      value: stats.totalConsumption,
      prefix: '¥',
      precision: 2,
      color: '#52c41a',
      bg: 'rgba(82, 196, 26, 0.1)',
      icon: <DollarOutlined />
    },
    {
      title: '总利润',
      tip: '客户消费 − 渠道成本（CNY）',
      value: stats.totalProfit,
      prefix: '¥',
      precision: 2,
      color: '#fa8c16',
      bg: 'rgba(250, 140, 22, 0.1)',
      icon: <RiseOutlined />
    },
    {
      title: '总模型调用次数',
      tip: '「消耗」类日志条数',
      value: stats.totalCallCount,
      suffix: '次',
      color: '#722ed1',
      bg: 'rgba(114, 46, 209, 0.1)',
      icon: <ApiOutlined />
    }
  ];
}

function StatGrid({ items, fourCol }: { items: StatItem[]; fourCol?: boolean }) {
  return (
    <div className={`dashboard-stats-grid${fourCol ? ' dashboard-stats-grid--four' : ''}`}>
      {items.map((item) => (
        <Card bordered={false} className="page-card stat-card" key={item.title}>
          <div className="stat-card-inner">
            <div className="stat-card-icon" style={{ background: item.bg, color: item.color }}>
              {item.icon}
            </div>
            <div className="stat-card-body">
              <div className="stat-card-title-row">
                <Statistic
                  title={item.title}
                  value={item.value}
                  suffix={item.suffix}
                  prefix={item.prefix}
                  precision={item.precision}
                  valueStyle={{ color: item.color, fontWeight: 600 }}
                />
                <Tooltip title={item.tip}>
                  <InfoCircleOutlined className="stat-card-info" />
                </Tooltip>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function buildModelChartOption(
  trend: ModelCallTrendSeries,
  axisLabelStyle: { color: string; fontSize: number },
  splitLineStyle: { color: string; type: 'dashed' }
) {
  const multi = trend.series.length > 1;
  const barWidth = trend.dates.length > 10 ? (multi ? 12 : 20) : multi ? 16 : 32;

  if (trend.dates.length === 0 || trend.series.length === 0) {
    return null;
  }

  return {
    color: CHART_COLORS,
    tooltip: buildCallCountChartTooltip(),
    legend: multi
      ? { data: trend.series.map((s) => s.name), bottom: 0, type: 'scroll' as const }
      : undefined,
    grid: { left: 52, right: 24, top: 32, bottom: multi ? 52 : 28 },
    xAxis: { type: 'category' as const, data: trend.dates, axisLabel: axisLabelStyle },
    yAxis: {
      type: 'value' as const,
      name: '调用次数',
      axisLabel: axisLabelStyle,
      splitLine: { lineStyle: splitLineStyle }
    },
    series: trend.series.map((s) => ({
      name: s.name,
      type: 'bar' as const,
      barWidth,
      data: s.data,
      itemStyle: { borderRadius: [4, 4, 0, 0] }
    }))
  };
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('channel');

  const channelTokenChartRef = useRef<HTMLDivElement>(null);
  const channelModelChartRef = useRef<HTMLDivElement>(null);
  const projectTokenChartRef = useRef<HTMLDivElement>(null);
  const projectCallChartRef = useRef<HTMLDivElement>(null);

  const channelTokenInst = useRef<echarts.ECharts | null>(null);
  const channelModelInst = useRef<echarts.ECharts | null>(null);
  const projectTokenInst = useRef<echarts.ECharts | null>(null);
  const projectCallInst = useRef<echarts.ECharts | null>(null);

  const [draftChannelId, setDraftChannelId] = useState('all');
  const [draftChannelRange, setDraftChannelRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [channelRangeKey, setChannelRangeKey] = useState(0);
  const [channelChartModel, setChannelChartModel] = useState('all');

  const [draftProjectId, setDraftProjectId] = useState('all');
  const [draftProjectRange, setDraftProjectRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [projectRangeKey, setProjectRangeKey] = useState(0);
  const [projectChartModel, setProjectChartModel] = useState('all');

  const [appliedChannelQuery, setAppliedChannelQuery] = useState<ChannelDashboardQuery>(DEFAULT_CHANNEL_QUERY);
  const [appliedProjectQuery, setAppliedProjectQuery] = useState<DashboardQuery>(DEFAULT_PROJECT_QUERY);

  const channelOptions = useMemo(
    () => [{ value: 'all', label: '全部渠道（默认）' }, ...mockChannels.map((c) => ({ value: c.id, label: c.name }))],
    []
  );

  const projectOptions = useMemo(
    () => [{ value: 'all', label: '全部项目（默认）' }, ...mockProjects.map((p) => ({ value: p.id, label: p.name }))],
    []
  );

  const channelName = useMemo(
    () => mockChannels.find((c) => c.id === appliedChannelQuery.channelId)?.name,
    [appliedChannelQuery.channelId]
  );

  const projectName = useMemo(
    () => mockProjects.find((p) => p.id === appliedProjectQuery.projectId)?.name,
    [appliedProjectQuery.projectId]
  );

  const channelResult = useMemo(() => computeChannelDashboard(appliedChannelQuery), [appliedChannelQuery]);
  const projectResult = useMemo(() => computeProjectDashboard(appliedProjectQuery), [appliedProjectQuery]);

  const channelScopeLabel = useMemo(
    () => formatChannelScopeLabel(appliedChannelQuery, channelName),
    [appliedChannelQuery, channelName]
  );

  const projectScopeLabel = useMemo(
    () => formatFilterScopeLabel(appliedProjectQuery, projectName),
    [appliedProjectQuery, projectName]
  );

  const channelStatItems = useMemo(() => buildChannelStatItems(channelResult.stats), [channelResult.stats]);
  const projectStatItems = useMemo(() => buildProjectStatItems(projectResult.stats), [projectResult.stats]);

  const channelModelOptions = useMemo(() => {
    const models = collectModelsFromLogs(channelResult.filtered);
    return [{ value: 'all', label: '全部模型（分模型对比）' }, ...models.map((m) => ({ value: m, label: m }))];
  }, [channelResult.filtered]);

  const projectModelOptions = useMemo(() => {
    const models = collectModelsFromLogs(projectResult.filtered);
    return [{ value: 'all', label: '全部模型（分模型对比）' }, ...models.map((m) => ({ value: m, label: m }))];
  }, [projectResult.filtered]);

  const channelModelTrend = useMemo(
    () => aggregateModelCallTrendSeries(channelResult.filtered, channelChartModel),
    [channelResult.filtered, channelChartModel]
  );

  const projectModelTrend = useMemo(
    () => aggregateModelCallTrendSeries(projectResult.filtered, projectChartModel),
    [projectResult.filtered, projectChartModel]
  );

  const axisLabelStyle = { color: 'rgba(0,0,0,0.45)', fontSize: 11 };
  const splitLineStyle = { color: '#f0f0f0', type: 'dashed' as const };

  const disposeProjectCharts = () => {
    projectTokenInst.current?.dispose();
    projectTokenInst.current = null;
    projectCallInst.current?.dispose();
    projectCallInst.current = null;
  };

  const disposeChannelCharts = () => {
    channelTokenInst.current?.dispose();
    channelTokenInst.current = null;
    channelModelInst.current?.dispose();
    channelModelInst.current = null;
  };

  const renderChannelCharts = useCallback(() => {
    const { trend: channelTrend } = channelResult;

    if (!channelTokenChartRef.current) return;

    if (!channelTokenInst.current) channelTokenInst.current = echarts.init(channelTokenChartRef.current);
    channelTokenInst.current.setOption({
        color: ['#1677ff', '#52c41a', '#13c2c2', '#fa8c16'],
        tooltip: buildTrendChartTooltip(),
        legend: {
          data: ['Token 消耗', '消费金额 (CNY)', '渠道成本 (CNY)', '利润 (CNY)'],
          bottom: 0
        },
        grid: { left: 52, right: 28, top: 32, bottom: 52 },
        xAxis: {
          type: 'category',
          data: channelTrend.dates,
          boundaryGap: false,
          axisLabel: axisLabelStyle
        },
        yAxis: [
          { type: 'value', name: 'Token', axisLabel: axisLabelStyle, splitLine: { lineStyle: splitLineStyle } },
          { type: 'value', name: 'CNY', axisLabel: axisLabelStyle, splitLine: { show: false } }
        ],
        series: [
          { name: 'Token 消耗', type: 'line', smooth: true, data: channelTrend.tokenUsage },
          { name: '消费金额 (CNY)', type: 'line', smooth: true, yAxisIndex: 1, data: channelTrend.consumption },
          { name: '渠道成本 (CNY)', type: 'line', smooth: true, yAxisIndex: 1, data: channelTrend.channelCost },
          { name: '利润 (CNY)', type: 'line', smooth: true, yAxisIndex: 1, data: channelTrend.profit }
        ]
    });

    if (channelModelChartRef.current) {
      if (!channelModelInst.current) channelModelInst.current = echarts.init(channelModelChartRef.current);
      const modelOpt = buildModelChartOption(channelModelTrend, axisLabelStyle, splitLineStyle);
      if (modelOpt) channelModelInst.current.setOption(modelOpt, true);
    }

    requestAnimationFrame(() => {
      channelTokenInst.current?.resize();
      channelModelInst.current?.resize();
    });
  }, [channelResult, channelModelTrend]);

  const renderProjectCharts = useCallback(() => {
    const { trend: projectTrend } = projectResult;

    if (!projectTokenChartRef.current || !projectCallChartRef.current) return;

    if (!projectTokenInst.current) projectTokenInst.current = echarts.init(projectTokenChartRef.current);
    projectTokenInst.current.setOption({
        color: ['#1677ff', '#52c41a', '#fa8c16'],
        tooltip: buildTrendChartTooltip(),
        legend: { data: ['Token 消耗', '消费金额 (CNY)', '利润 (CNY)'], bottom: 0 },
        grid: { left: 52, right: 28, top: 32, bottom: 52 },
        xAxis: { type: 'category', data: projectTrend.dates, boundaryGap: false, axisLabel: axisLabelStyle },
        yAxis: [
          { type: 'value', name: 'Token', axisLabel: axisLabelStyle, splitLine: { lineStyle: splitLineStyle } },
          { type: 'value', name: 'CNY', axisLabel: axisLabelStyle, splitLine: { show: false } }
        ],
        series: [
          { name: 'Token 消耗', type: 'line', smooth: true, data: projectTrend.tokenUsage },
          { name: '消费金额 (CNY)', type: 'line', smooth: true, yAxisIndex: 1, data: projectTrend.consumption },
          { name: '利润 (CNY)', type: 'line', smooth: true, yAxisIndex: 1, data: projectTrend.profit }
        ]
    });

    if (!projectCallInst.current) projectCallInst.current = echarts.init(projectCallChartRef.current);
    const modelOpt = buildModelChartOption(projectModelTrend, axisLabelStyle, splitLineStyle);
    if (modelOpt) projectCallInst.current.setOption(modelOpt, true);

    requestAnimationFrame(() => {
      projectTokenInst.current?.resize();
      projectCallInst.current?.resize();
    });
  }, [projectResult, projectModelTrend]);

  useEffect(() => {
    if (activeTab !== 'channel') return undefined;

    const timer = window.setTimeout(() => {
      disposeChannelCharts();
      renderChannelCharts();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      disposeChannelCharts();
    };
  }, [activeTab, renderChannelCharts]);

  useEffect(() => {
    if (activeTab !== 'project') return undefined;

    const timer = window.setTimeout(() => {
      disposeProjectCharts();
      renderProjectCharts();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      disposeProjectCharts();
    };
  }, [activeTab, renderProjectCharts]);

  useEffect(() => {
    const handleResize = () => {
      channelTokenInst.current?.resize();
      channelModelInst.current?.resize();
      projectTokenInst.current?.resize();
      projectCallInst.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      disposeChannelCharts();
      disposeProjectCharts();
    };
  }, []);

  const handleChannelSearch = () => {
    setAppliedChannelQuery({ channelId: draftChannelId, dateRange: draftChannelRange });
    message.success('渠道侧统计数据已更新');
  };

  const handleChannelReset = () => {
    setDraftChannelId('all');
    setDraftChannelRange(null);
    setChannelChartModel('all');
    setAppliedChannelQuery(DEFAULT_CHANNEL_QUERY);
    setChannelRangeKey((k) => k + 1);
    message.info('渠道筛选已重置');
  };

  const handleProjectSearch = () => {
    setAppliedProjectQuery({ projectId: draftProjectId, dateRange: draftProjectRange });
    message.success(
      draftProjectId === 'all' && !draftProjectRange
        ? '已加载全部项目汇总数据'
        : '项目消费统计已更新'
    );
  };

  const handleProjectReset = () => {
    setDraftProjectId('all');
    setDraftProjectRange(null);
    setProjectChartModel('all');
    setAppliedProjectQuery(DEFAULT_PROJECT_QUERY);
    setProjectRangeKey((k) => k + 1);
    message.info('项目筛选已重置为全部项目总和');
  };

  const modelChartExtra = (
    model: string,
    options: { value: string; label: string }[],
    onChange: (v: string) => void
  ) => (
    <Space size={8} wrap className="chart-card-model-filter">
      <Text type="secondary">模型筛选</Text>
      <Select
        value={model}
        onChange={onChange}
        style={{ minWidth: 200 }}
        options={options}
        popupMatchSelectWidth={false}
      />
    </Space>
  );

  const channelPanel = (
    <div className="dashboard-tab-panel">
      <div className="dashboard-filter-card">
        <div className="filter-card-head">
          <FilterOutlined />
          <span>筛选条件</span>
        </div>
        <div className="dashboard-filter-fields">
          <div className="dashboard-filter-item">
            <label>所属渠道</label>
            <Select value={draftChannelId} onChange={setDraftChannelId} style={{ width: 240 }} options={channelOptions} />
          </div>
          <div className="dashboard-filter-item">
            <label>统计时间段</label>
            <RangePicker
              key={channelRangeKey}
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: 360 }}
              value={draftChannelRange}
              onChange={(v) => setDraftChannelRange(v as [Dayjs, Dayjs] | null)}
            />
          </div>
          <div className="dashboard-filter-actions">
            <Button type="primary" icon={<SearchOutlined />} onClick={handleChannelSearch}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleChannelReset}>
              重置
            </Button>
          </div>
        </div>
      </div>

      <div className="dashboard-scope-bar">
        <Text type="secondary">当前统计范围：{channelScopeLabel}</Text>
      </div>

      <StatGrid items={channelStatItems} fourCol />

      <div className="dashboard-charts-row">
        <Card
          title="渠道 Token 消耗与消费、成本、利润趋势"
          bordered={false}
          className="page-card chart-card"
          extra={<Text type="secondary">{channelScopeLabel}</Text>}
        >
          <div ref={channelTokenChartRef} className="chart-container" />
        </Card>
        <Card
          title="模型调用次数趋势"
          bordered={false}
          className="page-card chart-card"
          extra={modelChartExtra(channelChartModel, channelModelOptions, setChannelChartModel)}
        >
          <div ref={channelModelChartRef} className="chart-container" />
        </Card>
      </div>
    </div>
  );

  const projectPanel = (
    <div className="dashboard-tab-panel">
      <div className="dashboard-filter-card">
        <div className="filter-card-head">
          <FilterOutlined />
          <span>筛选条件</span>
        </div>
        <div className="dashboard-filter-fields">
          <div className="dashboard-filter-item">
            <label>所属项目</label>
            <Select value={draftProjectId} onChange={setDraftProjectId} style={{ width: 240 }} options={projectOptions} />
          </div>
          <div className="dashboard-filter-item">
            <label>统计时间段</label>
            <RangePicker
              key={projectRangeKey}
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: 360 }}
              value={draftProjectRange}
              onChange={(v) => setDraftProjectRange(v as [Dayjs, Dayjs] | null)}
            />
          </div>
          <div className="dashboard-filter-actions">
            <Button type="primary" icon={<SearchOutlined />} onClick={handleProjectSearch}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleProjectReset}>
              重置
            </Button>
          </div>
        </div>
      </div>

      <div className="dashboard-scope-bar">
        <Text type="secondary">当前统计范围：{projectScopeLabel}</Text>
      </div>

      <StatGrid items={projectStatItems} fourCol />

      <div className="dashboard-charts-row">
        <Card
          title="项目 Token 消耗与消费趋势"
          bordered={false}
          className="page-card chart-card"
          extra={<Text type="secondary">{projectScopeLabel}</Text>}
        >
          <div ref={projectTokenChartRef} className="chart-container" />
        </Card>
        <Card
          title="模型调用次数趋势"
          bordered={false}
          className="page-card chart-card"
          extra={modelChartExtra(projectChartModel, projectModelOptions, setProjectChartModel)}
        >
          <div ref={projectCallChartRef} className="chart-container" />
        </Card>
      </div>
    </div>
  );

  return (
    <div className="dashboard-page">
      <PageHeader
        title="数据看板"
        description="通过 Tab 切换渠道侧成本与项目消费统计；模型调用趋势图支持按模型筛选，选「全部模型」时分模型对比展示。"
      />

      <Card bordered={false} className="page-card dashboard-tabs-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          destroyInactiveTabPane
          className="dashboard-main-tabs"
          items={[
            {
              key: 'channel',
              label: (
                <span className="dashboard-tab-label">
                  <CloudServerOutlined />
                  渠道侧成本情况
                </span>
              ),
              children: channelPanel
            },
            {
              key: 'project',
              label: (
                <span className="dashboard-tab-label">
                  <ProjectOutlined />
                  项目消费情况
                </span>
              ),
              children: projectPanel
            }
          ]}
        />
      </Card>
    </div>
  );
}
