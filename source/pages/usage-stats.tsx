import '../components/page.css';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Col, DatePicker, Form, Input, Row, Select, Table, Tag, Tooltip, message } from 'antd';
import {
  DollarOutlined,
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
  SyncOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

import { PageHeader } from '../components/PageHeader';
import {
  DEFAULT_USAGE_QUERY,
  fetchUsageStats,
  type UsageStatsQuery,
  type UsageStatsSummary,
} from '../components/usageStatsService';
import {
  formatCny,
  formatTokens,
  type UsageLogRow,
  type UsageLogType,
} from '../components/mockData';

const { RangePicker } = DatePicker;
const POLL_INTERVAL_MS = 5000;

const logTypeColor: Record<UsageLogType, string> = {
  消耗: 'blue',
  充值: 'green',
  扣款: 'orange',
};

function formValuesToQuery(values: Record<string, unknown>): UsageStatsQuery {
  return {
    timeRange: (values.timeRange as [Dayjs, Dayjs] | null | undefined) ?? null,
    groupCode: (values.groupCode as string | undefined) || undefined,
    resourceCode: (values.resourceCode as string | undefined) || undefined,
    model: (values.model as string | undefined) || undefined,
    logType: (values.logType as UsageLogType | 'all' | undefined) || 'all',
  };
}

export default function UsageStatsPage() {
  const [form] = Form.useForm();
  const [appliedQuery, setAppliedQuery] = useState<UsageStatsQuery>(DEFAULT_USAGE_QUERY);
  const [data, setData] = useState<UsageLogRow[]>([]);
  const [summary, setSummary] = useState<UsageStatsSummary>({
    consumeTotal: 0,
    rechargeTotal: 0,
    deductTotal: 0,
  });
  const [balanceSnapshot, setBalanceSnapshot] = useState({
    current: 0,
    unlimited: false,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [refreshAt, setRefreshAt] = useState<Date | null>(null);
  const appliedQueryRef = useRef(appliedQuery);

  useEffect(() => {
    appliedQueryRef.current = appliedQuery;
  }, [appliedQuery]);

  const loadData = useCallback(async (query: UsageStatsQuery, options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) setLoading(true);
    else setPolling(true);

    try {
      const result = await fetchUsageStats(query);
      setData(result.rows);
      setSummary(result.summary);
      setBalanceSnapshot(result.balance);
      setRefreshAt(result.fetchedAt);
    } finally {
      if (!silent) setLoading(false);
      else setPolling(false);
    }
  }, []);

  useEffect(() => {
    loadData(DEFAULT_USAGE_QUERY);
    const timer = window.setInterval(() => {
      loadData(appliedQueryRef.current, { silent: true });
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [loadData]);

  const columns: ColumnsType<UsageLogRow> = useMemo(() => [
    {
      title: '类型',
      dataIndex: 'type',
      width: 88,
      render: (type: UsageLogType) => <Tag color={logTypeColor[type]}>{type}</Tag>,
    },
    { title: '时间', dataIndex: 'time', width: 168 },
    {
      title: '资源组编码',
      dataIndex: 'groupCode',
      width: 140,
      render: (value: string) => value || '—',
    },
    { title: '资源项编码', dataIndex: 'resourceCode', width: 140 },
    { title: '模型', dataIndex: 'model', width: 140 },
    {
      title: '耗时',
      dataIndex: 'durationMs',
      width: 96,
      align: 'right',
      render: (value: number) => (value ? `${value} ms` : '—'),
    },
    {
      title: 'tokens',
      dataIndex: 'tokens',
      width: 100,
      align: 'right',
      render: (value: number) => (value ? formatTokens(value) : '—'),
    },
    {
      title: '费用（CNY）',
      dataIndex: 'costCny',
      width: 120,
      align: 'right',
      render: (value: number) => (value ? formatCny(value) : '—'),
    },
    {
      title: '当前余额',
      dataIndex: 'balanceAfter',
      width: 120,
      align: 'right',
      render: (value: number | null) => (value === null ? '—' : `¥${formatCny(value)}`),
    },
    { title: '详情/备注', dataIndex: 'remark', ellipsis: true },
  ], []);

  const handleSearch = () => {
    const query = formValuesToQuery(form.getFieldsValue());
    setAppliedQuery(query);
    loadData(query);
    message.success('已按查询条件刷新列表');
  };

  const handleReset = () => {
    form.resetFields();
    setAppliedQuery(DEFAULT_USAGE_QUERY);
    loadData(DEFAULT_USAGE_QUERY);
    message.info('已重置为全部已配置模型数据');
  };

  const refreshTimeText = refreshAt?.toLocaleString('zh-CN', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) ?? '—';

  const balanceDisplay = balanceSnapshot.unlimited
    ? '无限'
    : `¥${formatCny(balanceSnapshot.current)}`;

  return (
    <div className="dev-platform-page">
      <PageHeader
        title="模型用量统计"
        description="默认每 5 秒自动拉取运营管理端已配置模型的调用日志；也可设置条件后手动查询。金额保留 2 位小数。"
      />

      <section className="balance-overview" aria-label="余额消耗情况">
        <div className="balance-overview-header">
          <div className="balance-overview-title-block">
            <h5 className="balance-overview-title">余额消耗情况</h5>
            <p className="balance-overview-desc">与下方列表同步刷新，每 5 秒请求运营管理端接口</p>
          </div>
          <div className="balance-refresh-meta">
            <span className="balance-live-dot" aria-hidden />
            <SyncOutlined className="balance-refresh-icon" spin={polling} />
            <span>最近更新 {refreshTimeText}</span>
          </div>
        </div>

        <div className="balance-overview-grid">
          <div className="balance-metric-card balance-metric-card--balance">
            <div className="balance-metric-icon" aria-hidden>
              <WalletOutlined />
            </div>
            <div className="balance-metric-body">
              <div className="balance-metric-top">
                <span className="balance-metric-label">当前余额</span>
                {!balanceSnapshot.unlimited ? (
                  <Tag className="balance-metric-tag" color="processing">有限额度</Tag>
                ) : (
                  <Tag className="balance-metric-tag" color="default">无限额度</Tag>
                )}
              </div>
              <div className={`balance-metric-value${balanceSnapshot.unlimited ? ' is-unlimited' : ''}`}>
                {balanceDisplay}
              </div>
              <Tooltip title="对应运营管理端项目的剩余额度">
                <span className="balance-metric-hint">
                  {balanceSnapshot.unlimited ? '项目额度为无限时不展示具体数值' : '运营管理端项目剩余额度（CNY）'}
                </span>
              </Tooltip>
            </div>
          </div>

          <div className="balance-metric-card balance-metric-card--spent">
            <div className="balance-metric-icon" aria-hidden>
              <DollarOutlined />
            </div>
            <div className="balance-metric-body">
              <div className="balance-metric-top">
                <span className="balance-metric-label">消费总额</span>
                <Tag className="balance-metric-tag" color="default">累计</Tag>
              </div>
              <div className="balance-metric-value">¥{formatCny(balanceSnapshot.totalSpent)}</div>
              <Tooltip title="运营管理端对应项目的消费总额">
                <span className="balance-metric-hint">运营管理端项目消费汇总（CNY，保留 2 位小数）</span>
              </Tooltip>
            </div>
          </div>
        </div>
      </section>

      <Card bordered={false} className="page-card usage-log-card">
        <div className="usage-log-card-head">
          <div className="usage-log-card-head-main">
            <FilterOutlined className="filter-card-head-icon" />
            <span className="filter-card-head-title">调用日志查询</span>
            <span className="filter-card-head-hint">默认展示全部已配置模型；每 5 秒自动刷新</span>
          </div>
          <div className="balance-refresh-meta">
            <span className="balance-live-dot" aria-hidden />
            <SyncOutlined className="balance-refresh-icon" spin={polling} />
            <span>列表同步 {refreshTimeText}</span>
          </div>
        </div>

        <Form form={form} layout="vertical" className="filter-panel usage-log-filter">
          <Row gutter={16} align="bottom">
            <Col xs={24} md={12} lg={8}>
              <Form.Item name="timeRange" label="时间段（不选则全部）">
                <RangePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Form.Item name="groupCode" label="均衡组资源编码">
                <Input placeholder="模糊搜索" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Form.Item name="resourceCode" label="资源编码">
                <Input placeholder="模糊搜索" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Form.Item name="model" label="模型名称">
                <Input placeholder="模糊搜索" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Form.Item name="logType" label="日志类型" initialValue="all">
                <Select
                  placeholder="全部"
                  options={[
                    { value: 'all', label: '全部' },
                    { value: '消耗', label: '消耗' },
                    { value: '充值', label: '充值' },
                    { value: '扣款', label: '扣款' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={4} className="filter-actions">
              <Button type="primary" icon={<SearchOutlined />} loading={loading} onClick={handleSearch}>
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Col>
          </Row>
        </Form>

        <div className="table-summary">
          共 <strong>{data.length}</strong> 条记录（已配置模型）
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1280 }}
          size="middle"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />

        <div className="usage-result-summary" aria-label="查询结果汇总">
          <span>消耗费用总和 <strong>¥{formatCny(summary.consumeTotal)}</strong></span>
          <span className="usage-result-summary-sep">|</span>
          <span>充值总和 <strong>¥{formatCny(summary.rechargeTotal)}</strong></span>
          <span className="usage-result-summary-sep">|</span>
          <span>扣款总和 <strong>¥{formatCny(summary.deductTotal)}</strong></span>
        </div>
      </Card>
    </div>
  );
}
