import '../components/page.css';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Empty,
  Form,
  Segmented,
  Select,
  Skeleton,
  Space,
  Spin,
  Tag,
  Tooltip,
  message,
} from 'antd';
import {
  ApiOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

import { PageHeader } from '../components/PageHeader';
import {
  computeResourceDashboard,
  type ResourceDashboardQuery,
  type ResourceDashboardResult,
  type ResourceDashboardStats,
} from '../components/resourceDashboardStats';
import {
  formatCny,
  formatTokens,
  mockResourceGroups,
  mockResourceItems,
  type ResourceType,
} from '../components/mockData';

echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const { RangePicker } = DatePicker;

const CHART_COLORS = ['#1677ff', '#13c2c2', '#722ed1', '#fa8c16'];
const AXIS_LABEL = { color: '#8c8c8c', fontSize: 11 };
const SPLIT_LINE = { color: '#f0f0f0', type: 'dashed' as const };

type AppliedQuery = ResourceDashboardQuery & {
  queriedAt: Date | null;
};

function getResourceLabel(type: ResourceType, id: string): string {
  if (type === 'group') {
    return mockResourceGroups.find((group) => group.id === id)?.name ?? id;
  }
  return mockResourceItems.find((item) => item.id === id)?.name ?? id;
}

function getResourceCode(type: ResourceType, id: string): string {
  if (type === 'group') {
    return mockResourceGroups.find((group) => group.id === id)?.code ?? '';
  }
  return mockResourceItems.find((item) => item.id === id)?.code ?? '';
}

function formatDateRange(range: [Dayjs, Dayjs] | null): string {
  if (!range) return '全部时间';
  return `${range[0].format('MM-DD HH:mm')} ~ ${range[1].format('MM-DD HH:mm')}`;
}

type StatItem = {
  key: string;
  label: string;
  tip: string;
  value: string;
  suffix?: string;
  prefix?: string;
  empty?: boolean;
  color: string;
  bg: string;
  icon: React.ReactNode;
};

function buildStatItems(stats: ResourceDashboardStats): StatItem[] {
  return [
    {
      key: 'tokens',
      label: '总调用 Token 数',
      tip: '资源组统计组内全部 Token；资源项统计单项 Token。整数展示。',
      value: stats.totalTokens === null ? '—' : formatTokens(stats.totalTokens),
      suffix: stats.totalTokens === null ? undefined : 'tokens',
      empty: stats.totalTokens === null,
      color: '#1677ff',
      bg: 'rgba(22, 119, 255, 0.1)',
      icon: <ThunderboltOutlined />,
    },
    {
      key: 'cost',
      label: '总 Token 消费金额',
      tip: '运营管理端模型客户单价 × Token 数量，CNY 保留 2 位小数。',
      value: stats.totalCost === null ? '—' : formatCny(stats.totalCost),
      prefix: stats.totalCost === null ? undefined : '¥',
      empty: stats.totalCost === null,
      color: '#13c2c2',
      bg: 'rgba(19, 194, 194, 0.1)',
      icon: <DollarOutlined />,
    },
    {
      key: 'balance',
      label: '余额',
      tip: '资源组展示运营管理端项目额度；无限额度或资源项场景展示为空。',
      value: stats.balanceUnlimited || stats.balance === null ? '—' : formatCny(stats.balance),
      prefix: stats.balanceUnlimited || stats.balance === null ? undefined : '¥',
      empty: stats.balanceUnlimited || stats.balance === null,
      color: '#722ed1',
      bg: 'rgba(114, 46, 209, 0.1)',
      icon: <WalletOutlined />,
    },
    {
      key: 'calls',
      label: '总模型调用次数',
      tip: '统计区间内的模型 API 调用总次数。',
      value: stats.totalCalls === null ? '—' : formatTokens(stats.totalCalls),
      suffix: stats.totalCalls === null ? undefined : '次',
      empty: stats.totalCalls === null,
      color: '#fa8c16',
      bg: 'rgba(250, 140, 22, 0.1)',
      icon: <ApiOutlined />,
    },
  ];
}

function StatGrid({ items, loading }: { items: StatItem[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="dashboard-stat-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card bordered={false} className="dashboard-stat-card" key={index}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="dashboard-stat-grid">
      {items.map((item) => (
        <Card bordered={false} className="dashboard-stat-card" key={item.key}>
          <div className="dashboard-stat-inner">
            <div className="dashboard-stat-icon" style={{ background: item.bg, color: item.color }}>
              {item.icon}
            </div>
            <div className="dashboard-stat-body">
              <div className="dashboard-stat-title-row">
                <span className="dashboard-stat-label">{item.label}</span>
                <Tooltip title={item.tip}>
                  <InfoCircleOutlined className="dashboard-stat-info" />
                </Tooltip>
              </div>
              <div
                className={`dashboard-stat-value${item.empty ? ' is-empty' : ''}`}
                style={item.empty ? undefined : { color: item.color }}
              >
                {item.prefix}
                {item.value}
                {item.suffix ? <span className="dashboard-stat-suffix">{item.suffix}</span> : null}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

const DEFAULT_QUERY: ResourceDashboardQuery = {
  resourceType: 'group',
  resourceId: mockResourceGroups[0].id,
  dateRange: null,
};

export default function ResourceDashboardPage() {
  const [form] = Form.useForm();
  const defaultResourceId = mockResourceGroups[0].id;

  const [appliedQuery, setAppliedQuery] = useState<AppliedQuery>({
    ...DEFAULT_QUERY,
    queriedAt: new Date(),
  });
  const [dashboardResult, setDashboardResult] = useState<ResourceDashboardResult>(() =>
    computeResourceDashboard(DEFAULT_QUERY),
  );
  const [modelFilter, setModelFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [dateRangeKey, setDateRangeKey] = useState(0);
  const [activeDatePreset, setActiveDatePreset] = useState<number | null>(null);

  const tokenChartRef = useRef<HTMLDivElement>(null);
  const callChartRef = useRef<HTMLDivElement>(null);
  const tokenChartInst = useRef<echarts.ECharts | null>(null);
  const callChartInst = useRef<echarts.ECharts | null>(null);

  const resourceType = (Form.useWatch('resourceType', form) as ResourceType | undefined) || 'group';

  const resourceOptions = useMemo(() => {
    if (resourceType === 'group') {
      return mockResourceGroups.map((group) => ({
        value: group.id,
        label: group.name,
        desc: group.code,
      }));
    }
    return mockResourceItems.map((item) => ({
      value: item.id,
      label: item.name,
      desc: item.code,
    }));
  }, [resourceType]);

  const modelOptions = useMemo(() => {
    const models = dashboardResult.availableModels;
    return [{ value: 'all', label: '全部模型' }, ...models.map((model) => ({ value: model, label: model }))];
  }, [dashboardResult.availableModels]);

  const statItems = useMemo(() => buildStatItems(dashboardResult.stats), [dashboardResult.stats]);

  const scopeLabel = useMemo(() => {
    const typeLabel = appliedQuery.resourceType === 'group' ? '资源组' : '资源项';
    const name = getResourceLabel(appliedQuery.resourceType, appliedQuery.resourceId);
    const code = getResourceCode(appliedQuery.resourceType, appliedQuery.resourceId);
    return { typeLabel, name, code, range: formatDateRange(appliedQuery.dateRange) };
  }, [appliedQuery]);

  const handleResourceTypeChange = useCallback((type: ResourceType) => {
    const firstId = type === 'group' ? mockResourceGroups[0]?.id : mockResourceItems[0]?.id;
    form.setFieldsValue({ resourceType: type, resourceId: firstId });
  }, [form]);

  const applyQuery = useCallback((values: ResourceDashboardQuery) => {
    setLoading(true);
    setChartLoading(true);
    window.setTimeout(() => {
      const result = computeResourceDashboard(values);
      setAppliedQuery({
        ...values,
        queriedAt: new Date(),
      });
      setDashboardResult(result);
      setModelFilter('all');
      setLoading(false);
      window.setTimeout(() => setChartLoading(false), 280);
      message.success('看板数据已更新');
    }, 420);
  }, []);

  const handleSearch = useCallback(() => {
    form.validateFields().then((values) => {
      applyQuery({
        resourceType: values.resourceType,
        resourceId: values.resourceId,
        dateRange: values.dateRange ?? null,
      });
    }).catch(() => {
      message.warning('请完善筛选条件');
    });
  }, [applyQuery, form]);

  const handleReset = useCallback(() => {
    form.setFieldsValue({
      resourceType: 'group',
      resourceId: defaultResourceId,
      dateRange: null,
    });
    setDateRangeKey((key) => key + 1);
    setActiveDatePreset(null);
    setModelFilter('all');
    applyQuery({
      resourceType: 'group',
      resourceId: defaultResourceId,
      dateRange: null,
    });
    message.info('筛选条件已重置');
  }, [applyQuery, defaultResourceId, form]);

  const applyDatePreset = useCallback((days: number) => {
    const end = dayjs();
    const start = days === 0
      ? end.startOf('day')
      : end.subtract(days - 1, 'day').startOf('day');
    const dateRange: [Dayjs, Dayjs] = [start, end];

    form.setFieldValue('dateRange', dateRange);
    setActiveDatePreset(days);

    form.validateFields().then((values) => {
      applyQuery({
        resourceType: values.resourceType,
        resourceId: values.resourceId,
        dateRange,
      });
    }).catch(() => {
      message.warning('请完善筛选条件');
    });
  }, [applyQuery, form]);

  const handleDateRangeChange = useCallback((value: [Dayjs, Dayjs] | null) => {
    form.setFieldValue('dateRange', value);
    setActiveDatePreset(null);
  }, [form]);

  useEffect(() => {
    form.setFieldsValue({
      resourceType: 'group',
      resourceId: defaultResourceId,
    });
  }, [defaultResourceId, form]);

  const { tokenTrend, callTrend } = dashboardResult;

  const renderTokenChart = useCallback(() => {
    if (!tokenChartRef.current || !appliedQuery.resourceId || tokenTrend.length === 0) return;
    if (!tokenChartInst.current) tokenChartInst.current = echarts.init(tokenChartRef.current);

    tokenChartInst.current.setOption({
      color: ['#1677ff', '#13c2c2'],
      animationDuration: 600,
      tooltip: {
        trigger: 'axis',
        formatter(params: Array<{ axisValue: string; seriesName: string; value: number; marker: string }>) {
          const lines = params.map((item) => {
            if (item.seriesName.includes('金额')) {
              return `${item.marker} ${item.seriesName}: ¥${formatCny(item.value)}`;
            }
            return `${item.marker} ${item.seriesName}: ${formatTokens(item.value)}`;
          });
          return `${params[0]?.axisValue ?? ''}<br/>${lines.join('<br/>')}`;
        },
      },
      legend: { data: ['Token 消耗', '消费金额 (CNY)'], bottom: 0 },
      grid: { left: 52, right: 48, top: 32, bottom: 52 },
      xAxis: {
        type: 'category',
        data: tokenTrend.map((point) => point.date),
        boundaryGap: false,
        axisLabel: AXIS_LABEL,
      },
      yAxis: [
        {
          type: 'value',
          name: 'Token',
          axisLabel: { ...AXIS_LABEL, formatter: (v: number) => `${Math.round(v / 1000)}k` },
          splitLine: { lineStyle: SPLIT_LINE },
        },
        {
          type: 'value',
          name: 'CNY',
          axisLabel: { ...AXIS_LABEL, formatter: (v: number) => `¥${v}` },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Token 消耗',
          type: 'line',
          smooth: true,
          showSymbol: false,
          areaStyle: { color: 'rgba(22, 119, 255, 0.06)' },
          data: tokenTrend.map((point) => point.tokens),
        },
        {
          name: '消费金额 (CNY)',
          type: 'line',
          smooth: true,
          showSymbol: false,
          yAxisIndex: 1,
          data: tokenTrend.map((point) => Number(point.costCny.toFixed(2))),
        },
      ],
    }, true);
  }, [appliedQuery.resourceId, tokenTrend]);

  const renderCallChart = useCallback(() => {
    if (!callChartRef.current || !appliedQuery.resourceId || callTrend.length === 0) return;
    if (!callChartInst.current) callChartInst.current = echarts.init(callChartRef.current);

    const availableModels = dashboardResult.availableModels;
    const models = modelFilter === 'all' ? availableModels : [modelFilter];
    const multi = models.length > 1;

    callChartInst.current.setOption({
      color: CHART_COLORS,
      animationDuration: 600,
      tooltip: {
        trigger: 'axis',
        formatter(params: Array<{ axisValue: string; seriesName: string; value: number; marker: string }>) {
          const lines = params.map((item) =>
            `${item.marker} ${item.seriesName}: ${formatTokens(item.value)} 次`,
          );
          return `${params[0]?.axisValue ?? ''}<br/>${lines.join('<br/>')}`;
        },
      },
      legend: multi
        ? { data: models, bottom: 0, type: 'scroll' }
        : undefined,
      grid: { left: 52, right: 24, top: 32, bottom: multi ? 52 : 28 },
      xAxis: { type: 'category', data: callTrend.map((point) => point.date), axisLabel: AXIS_LABEL },
      yAxis: {
        type: 'value',
        name: '调用次数',
        axisLabel: AXIS_LABEL,
        splitLine: { lineStyle: SPLIT_LINE },
      },
      series: models.map((model) => ({
        name: model,
        type: 'bar',
        barMaxWidth: multi ? 16 : 28,
        data: callTrend.map((point) => Number(point[model] ?? 0)),
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      })),
    }, true);
  }, [appliedQuery.resourceId, callTrend, dashboardResult.availableModels, modelFilter]);

  useEffect(() => {
    if (tokenTrend.length === 0) {
      tokenChartInst.current?.dispose();
      tokenChartInst.current = null;
    }
    if (callTrend.length === 0) {
      callChartInst.current?.dispose();
      callChartInst.current = null;
    }
  }, [tokenTrend.length, callTrend.length]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      renderTokenChart();
      renderCallChart();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [renderTokenChart, renderCallChart, chartLoading]);

  useEffect(() => {
    const onResize = () => {
      tokenChartInst.current?.resize();
      callChartInst.current?.resize();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const queriedAtText = appliedQuery.queriedAt
    ? appliedQuery.queriedAt.toLocaleString('zh-CN', {
      hour12: false,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    : '';

  return (
    <div className="dev-platform-page">
      <PageHeader
        title="模型资源看板"
        description="指标卡片与趋势图均随查询条件联动刷新；未选择统计时间段时默认展示全部时间。金额保留 2 位小数，Token 为整数。"
      />

      <Card bordered={false} className="page-card dashboard-filter-card">
        <div className="filter-card-head">
          <div className="filter-card-head-main">
            <FilterOutlined className="filter-card-head-icon" />
            <span className="filter-card-head-title">查询条件</span>
            <span className="filter-card-head-hint">设置资源与时间范围后点击查询</span>
          </div>
        </div>

        <div className="filter-form-surface">
          <Form
            form={form}
            layout="vertical"
            className="dashboard-filter-form"
            onFinish={handleSearch}
            initialValues={{ resourceType: 'group', resourceId: defaultResourceId }}
          >
            <div className="filter-group">
              <div className="filter-group-title">
                <AppstoreOutlined />
                <span>资源维度</span>
              </div>
              <div className="filter-group-body filter-group-body--resource">
                <Form.Item name="resourceType" label="资源类型" className="filter-field filter-field--type">
                  <Segmented
                    block
                    options={[
                      { value: 'group', label: '资源组' },
                      { value: 'item', label: '资源项' },
                    ]}
                    onChange={(value) => handleResourceTypeChange(value as ResourceType)}
                  />
                </Form.Item>
                <Form.Item
                  name="resourceId"
                  label="资源名称"
                  className="filter-field filter-field--name"
                  rules={[{ required: true, message: '请选择资源' }]}
                >
                  <Select
                    placeholder="请选择资源组或资源项"
                    showSearch
                    optionFilterProp="label"
                    options={resourceOptions}
                    optionRender={(option) => (
                      <div className="resource-option">
                        <span>{option.label}</span>
                        {option.data?.desc ? (
                          <span className="resource-option-code">{option.data.desc}</span>
                        ) : null}
                      </div>
                    )}
                  />
                </Form.Item>
              </div>
            </div>

            <div className="filter-group-divider" />

            <div className="filter-group">
              <div className="filter-group-title">
                <ClockCircleOutlined />
                <span>统计时间</span>
              </div>
              <div className="filter-group-body filter-group-body--time">
                <Form.Item
                  name="dateRange"
                  label="时间段（精确到时分，不选则统计全部）"
                  className="filter-field filter-field--range"
                >
                  <RangePicker
                    key={dateRangeKey}
                    showTime
                    format="YYYY-MM-DD HH:mm"
                    style={{ width: '100%' }}
                    placeholder={['开始时间', '结束时间']}
                    onChange={(value) => handleDateRangeChange(value as [Dayjs, Dayjs] | null)}
                  />
                </Form.Item>
                <div className="filter-field filter-field--presets">
                  <span className="date-presets-label">快捷选择</span>
                  <div className="date-preset-group">
                    {[
                      { days: 0, label: '今天' },
                      { days: 7, label: '近 7 天' },
                      { days: 30, label: '近 30 天' },
                    ].map((preset) => (
                      <button
                        key={preset.days}
                        type="button"
                        className={`date-preset-btn${activeDatePreset === preset.days ? ' is-active' : ''}`}
                        onClick={() => applyDatePreset(preset.days)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Form>
        </div>

        <div className="filter-card-footer">
          <div className="filter-applied-scope">
            <span className="filter-applied-label">已应用</span>
            <Space size={[6, 6]} wrap className="filter-applied-tags">
              <Tag color="processing" bordered={false}>{scopeLabel.typeLabel}</Tag>
              <Tag bordered={false}>{scopeLabel.name}</Tag>
              {scopeLabel.code ? <Tag bordered={false} className="filter-code-tag">{scopeLabel.code}</Tag> : null}
              <Tag bordered={false} icon={<ClockCircleOutlined />}>{scopeLabel.range}</Tag>
            </Space>
            {queriedAtText ? (
              <span className="filter-applied-time">更新于 {queriedAtText}</span>
            ) : null}
          </div>
          <div className="filter-card-actions">
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
            <Button type="primary" icon={<SearchOutlined />} loading={loading} onClick={handleSearch}>
              查询
            </Button>
          </div>
        </div>
      </Card>

      <StatGrid items={statItems} loading={loading} />

      <div className="dashboard-charts">
        <Card bordered={false} className="page-card chart-card">
          <div className="chart-card-header">
            <div>
              <h5 className="chart-card-title">Token 消耗与消费趋势</h5>
              <p className="chart-card-subtitle">
                按当前查询条件统计 · {scopeLabel.range}
                {tokenTrend.length > 0 ? ` · ${tokenTrend.length} 个时间点` : ''}
              </p>
            </div>
          </div>
          <Spin spinning={chartLoading}>
            {!appliedQuery.resourceId ? (
              <Empty className="chart-empty" description="请选择资源后查询" />
            ) : tokenTrend.length === 0 ? (
              <Empty className="chart-empty" description="当前查询条件下暂无趋势数据" />
            ) : (
              <div ref={tokenChartRef} className="chart-container" />
            )}
          </Spin>
        </Card>

        <Card bordered={false} className="page-card chart-card">
          <div className="chart-card-header">
            <div>
              <h5 className="chart-card-title">模型调用次数趋势</h5>
              <p className="chart-card-subtitle">
                {modelFilter === 'all' ? '按模型分序列对比' : `展示 ${modelFilter} 调用趋势`}
                {callTrend.length > 0 ? ` · ${scopeLabel.range}` : ''}
              </p>
            </div>
            <Select
              value={modelFilter}
              onChange={setModelFilter}
              options={modelOptions}
              style={{ width: 220 }}
              placeholder="模型筛选"
              disabled={dashboardResult.availableModels.length === 0}
            />
          </div>
          <Spin spinning={chartLoading}>
            {!appliedQuery.resourceId ? (
              <Empty className="chart-empty" description="请选择资源后查询" />
            ) : callTrend.length === 0 ? (
              <Empty className="chart-empty" description="当前查询条件下暂无调用趋势数据" />
            ) : (
              <div ref={callChartRef} className="chart-container" />
            )}
          </Spin>
        </Card>
      </div>
    </div>
  );
}
