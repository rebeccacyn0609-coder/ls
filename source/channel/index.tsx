/**
 * @name 渠道管理
 */

import '../components/page.css';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Form,
  Input,
  Select,
  Switch,
  Radio,
  Space,
  Tag,
  message,
  Row,
  Col,
  Tooltip,
  InputNumber,
  DatePicker,
  Modal,
  Dropdown,
  Empty,
  Alert
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApiOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  BarChartOutlined,
  MinusCircleOutlined,
  MoreOutlined,
  WalletOutlined,
  PlusCircleOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  CloudServerOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import {
  mockChannels,
  mockGroups,
  mockModels,
  mockUsageLogs,
  mockChannelRechargeRecords,
  getGroupName,
  getChannelUsedStats,
  getChannelRechargeRecords,
  getChannelRechargeSummary,
  matchesUsageLogTypeFilter,
  type ChannelItem,
  type ChannelRechargeRecord,
  type UsageLogItem
} from '../components/mockData';
import { AppDrawer, AppModal, FormSection, FormRow, FormCol } from '../components/FormLayout';
import { PageHeader, FilterActions } from '../components/PageHeader';
import { formatCny2 } from '../components/formatCny';
import { buildUsageLogColumns } from '../components/usageLogColumns';

const { RangePicker } = DatePicker;

const channelTypes = ['OpenAI', 'Anthropic', 'Gemini', 'Azure OpenAI', 'DeepSeek'];

export default function ChannelPage() {
  const [channels, setChannels] = useState(mockChannels);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ChannelItem | null>(null);
  const [usageDrawerOpen, setUsageDrawerOpen] = useState(false);
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [channelRechargeRecords, setChannelRechargeRecords] = useState(mockChannelRechargeRecords);
  const [currentChannel, setCurrentChannel] = useState<ChannelItem | null>(null);
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();
  const [usageForm] = Form.useForm();
  const [channelRechargeForm] = Form.useForm();
  const keyMode = Form.useWatch('keyMode', form);
  const channelAdjustType = Form.useWatch('adjustType', channelRechargeForm) as 'recharge' | 'deduct' | undefined;
  const channelRechargeAmount = (Form.useWatch('amount', channelRechargeForm) as number | undefined) ?? 0;

  const groupOptions = mockGroups.map((g) => ({ value: g.id, label: g.name }));
  const modelOptions = mockModels.map((m) => ({ value: m.id, label: m.modelName }));

  const baseChannelLogs = useMemo(() => {
    if (!currentChannel) return [];
    return mockUsageLogs.filter((l) => l.channel === currentChannel.name);
  }, [currentChannel?.name]);

  const [usageRows, setUsageRows] = useState<UsageLogItem[]>([]);

  useEffect(() => {
    if (usageDrawerOpen && currentChannel) {
      usageForm.resetFields();
      setUsageRows(baseChannelLogs);
    }
  }, [usageDrawerOpen, currentChannel, baseChannelLogs, usageForm]);

  const openUsageQuery = (record: ChannelItem) => {
    setCurrentChannel(record);
    setUsageDrawerOpen(true);
  };

  const openChannelRecharge = (record: ChannelItem) => {
    setCurrentChannel(record);
    channelRechargeForm.resetFields();
    channelRechargeForm.setFieldsValue({ adjustType: 'recharge' });
    setRechargeModalOpen(true);
  };

  const rechargeSummary = useMemo(() => {
    if (!currentChannel) {
      return { rechargeTotal: 0, deductTotal: 0, deductMagnitude: 0, consumption: 0, balance: 0 };
    }
    return getChannelRechargeSummary(
      currentChannel.id,
      currentChannel.name,
      channelRechargeRecords
    );
  }, [currentChannel?.id, currentChannel?.name, channelRechargeRecords]);

  const rechargeRecordRows = useMemo(() => {
    if (!currentChannel) return [];
    return getChannelRechargeRecords(currentChannel.id, channelRechargeRecords);
  }, [currentChannel?.id, channelRechargeRecords]);

  const handleChannelRecharge = async () => {
    const values = await channelRechargeForm.validateFields();
    if (!currentChannel) return;

    const amount = values.amount || 0;

    const now = new Date()
      .toLocaleString('zh-CN', { hour12: false })
      .replace(/\//g, '-');
    const recordType: ChannelRechargeRecord['type'] =
      values.adjustType === 'recharge' ? 'recharge' : 'deduct';

    setChannelRechargeRecords((prev) => [
      {
        id: `cr${Date.now()}`,
        channelId: currentChannel.id,
        type: recordType,
        amount,
        time: now,
        operator: '当前用户',
        remark: values.remark?.trim() || undefined
      },
      ...prev
    ]);

    const afterSummary = getChannelRechargeSummary(
      currentChannel.id,
      currentChannel.name,
      [
        {
          id: `cr-new`,
          channelId: currentChannel.id,
          type: recordType,
          amount,
          time: now
        },
        ...channelRechargeRecords
      ]
    );

    message.success(`记账成功，参考余额 ${formatCny2(afterSummary.balance)}（可为负，不影响调用）`);
    channelRechargeForm.resetFields();
    channelRechargeForm.setFieldsValue({ adjustType: 'recharge' });
  };

  const rechargeRecordColumns: ColumnsType<ChannelRechargeRecord> = [
    { title: '时间', dataIndex: 'time', width: 168 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 88,
      render: (t: ChannelRechargeRecord['type']) => (
        <Tag
          className="channel-recharge-type-tag"
          color={t === 'recharge' ? 'success' : 'warning'}
          bordered={false}
        >
          {t === 'recharge' ? '充值' : '扣款'}
        </Tag>
      )
    },
    {
      title: '金额 (CNY)',
      dataIndex: 'amount',
      width: 148,
      align: 'right',
      render: (amount: number, r) => (
        <span
          className={`channel-recharge-amount channel-recharge-amount--${
            r.type === 'deduct' ? 'deduct' : 'recharge'
          }`}
        >
          {r.type === 'deduct' ? '−' : '+'}
          {formatCny2(amount)}
        </span>
      )
    },
    { title: '操作人', dataIndex: 'operator', width: 100, render: (v?: string) => v || '—' },
    { title: '备注', dataIndex: 'remark', ellipsis: true, render: (v?: string) => v || '—' }
  ];

  const rechargeStatItems = [
    {
      key: 'recharge',
      title: '充值总和',
      value: rechargeSummary.rechargeTotal,
      color: '#389e0d',
      bg: 'rgba(82, 196, 26, 0.12)',
      icon: <PlusCircleOutlined />
    },
    {
      key: 'deduct',
      title: '扣款总和',
      value: rechargeSummary.deductTotal,
      color: '#cf1322',
      bg: 'rgba(255, 77, 79, 0.1)',
      icon: <MinusCircleOutlined />
    },
    {
      key: 'consumption',
      title: '消耗',
      value: rechargeSummary.consumption,
      color: '#fa8c16',
      bg: 'rgba(250, 140, 22, 0.12)',
      icon: <ThunderboltOutlined />
    },
    {
      key: 'balance',
      title: '参考余额',
      value: rechargeSummary.balance,
      color: '#1677ff',
      bg: 'rgba(22, 119, 255, 0.12)',
      icon: <WalletOutlined />,
      highlight: true,
      tip: '参考余额 = 充值总和 + 扣款总和 − 消耗；可为负数，不限制实际调用'
    }
  ];

  const handleUsageSearch = () => {
    const { projectName, model, groupId, logType } = usageForm.getFieldsValue();
    let rows = baseChannelLogs;
    if (projectName?.trim()) {
      const kw = projectName.trim().toLowerCase();
      rows = rows.filter((r) => r.projectName.toLowerCase().includes(kw));
    }
    if (model?.trim()) {
      const kw = model.trim().toLowerCase();
      rows = rows.filter((r) => r.model.toLowerCase().includes(kw));
    }
    if (groupId) {
      rows = rows.filter((r) => r.token.includes(getGroupName(groupId)));
    }
    if (logType) {
      rows = rows.filter((r) => matchesUsageLogTypeFilter(r, logType));
    }
    setUsageRows(rows);
    message.success('查询完成');
  };

  const handleUsageReset = () => {
    usageForm.resetFields();
    setUsageRows(baseChannelLogs);
    message.info('筛选条件已重置');
  };

  const usageColumns = buildUsageLogColumns({ showProject: true });

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: true, keyMode: 'single', multiKeyStrategy: 'round', modelMappings: [{}] });
    setDrawerOpen(true);
  };

  const openEdit = (record: ChannelItem) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      rechargeAmount: record.rechargeAmount ?? record.used + record.remaining,
      status: record.status === 'enabled',
      groupIds: record.groupIds,
      modelIds: record.modelIds,
      modelMappings: record.modelMappings?.length ? record.modelMappings : [{}]
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const modelMappings = (values.modelMappings || []).filter(
      (item: { originalModel?: string; replaceModel?: string }) => item?.originalModel && item?.replaceModel
    );
    const { rechargeAmount: _rechargeAmount, ...channelValues } = values;
    const payload: Partial<ChannelItem> = {
      ...channelValues,
      status: values.status ? 'enabled' : 'disabled',
      modelMappings,
      lastTestTime: editing?.lastTestTime || '-',
      responseTime: editing?.responseTime || '-',
      used: editing?.used ?? 0,
      remaining: editing?.remaining ?? 0,
      rechargeAmount: editing?.rechargeAmount
    };
    if (!editing) {
      payload.used = 0;
      payload.remaining = 0;
      payload.rechargeAmount = undefined;
    }
    if (editing) {
      setChannels((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...payload } as ChannelItem : c)));
      message.success('渠道已更新');
    } else {
      setChannels((prev) => [
        ...prev,
        {
          id: `c${Date.now()}`,
          used: 0,
          remaining: 0,
          responseTime: '-',
          lastTestTime: '-',
          ...payload
        } as ChannelItem
      ]);
      message.success('渠道已创建');
    }
    setDrawerOpen(false);
  };

  const toggleStatus = (id: string) => {
    setChannels((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: c.status === 'enabled' ? 'disabled' : 'enabled' } : c
      )
    );
    message.success('状态已更新');
  };

  const columns: ColumnsType<ChannelItem> = [
    { title: '名称', dataIndex: 'name', width: 160 },
    { title: '类型', dataIndex: 'type', width: 110 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (s: string) => (
        <Tag color={s === 'enabled' ? 'success' : 'default'}>{s === 'enabled' ? '启用' : '禁用'}</Tag>
      )
    },
    {
      title: '分组',
      dataIndex: 'groupIds',
      width: 140,
      ellipsis: true,
      render: (ids: string[]) => ids.map((id) => getGroupName(id)).join(', ')
    },
    {
      title: (
        <Tooltip title="已使用金额含渠道测试等全部消耗；Token 为输入+输出合计">
          <span>已使用金额 / 已使用 Token 总数</span>
        </Tooltip>
      ),
      width: 240,
      render: (_, r) => {
        const { usedAmount, usedTokens } = getChannelUsedStats(r.name);
        return (
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {formatCny2(usedAmount)} / {usedTokens.toLocaleString('zh-CN')}
          </span>
        );
      }
    },
    { title: '响应', dataIndex: 'responseTime', width: 80 },
    { title: '上次测试', dataIndex: 'lastTestTime', width: 160 },
    {
      title: '操作',
      width: 360,
      fixed: 'right',
      render: (_, record) => {
        const moreItems: MenuProps['items'] = [
          {
            key: 'usage',
            icon: <BarChartOutlined />,
            label: '查询用量',
            onClick: () => openUsageQuery(record)
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: '删除',
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: '确认删除该渠道？',
                okText: '删除',
                okType: 'danger',
                cancelText: '取消',
                onOk: () => {
                  setChannels((p) => p.filter((c) => c.id !== record.id));
                  message.success('渠道已删除');
                }
              });
            }
          }
        ];
        return (
          <Space className="table-actions" wrap size={0}>
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
              编辑
            </Button>
            <Button
              type="link"
              size="small"
              icon={record.status === 'enabled' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => toggleStatus(record.id)}
            >
              {record.status === 'enabled' ? '禁用' : '启用'}
            </Button>
            <Button type="link" size="small" icon={<ApiOutlined />} onClick={() => message.info('连接测试中...')}>
              测试连接
            </Button>
            <Button type="link" size="small" icon={<WalletOutlined />} onClick={() => openChannelRecharge(record)}>
              充值/扣款
            </Button>
            <Dropdown menu={{ items: moreItems }} trigger={['click']}>
              <Button type="link" size="small" icon={<MoreOutlined />}>
                更多
              </Button>
            </Dropdown>
          </Space>
        );
      }
    }
  ];

  return (
    <div>
      <PageHeader
        title="渠道管理"
        description="管理 API 渠道配置；渠道充值/扣款仅记账、不计入使用日志；列表展示已使用金额与 Token（含渠道测试）。"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增渠道
          </Button>
        }
      />

      <Card bordered={false} className="page-card">
        <Form form={filterForm} layout="vertical" className="filter-panel">
          <Row gutter={16}>
            <Col xs={24} sm={12} lg={5}>
              <Form.Item name="name" label="渠道名称">
                <Input placeholder="模糊搜索" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={5}>
              <Form.Item name="model" label="模型名称">
                <Input placeholder="模糊搜索" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Form.Item name="status" label="状态">
                <Select
                  placeholder="所有状态"
                  allowClear
                  options={[
                    { value: 'enabled', label: '已启用' },
                    { value: 'disabled', label: '已禁用' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Form.Item name="groupId" label="分组">
                <Select placeholder="全部" allowClear options={groupOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={6} className="filter-actions">
              <FilterActions
                onSearch={() => message.success('查询完成')}
                onReset={() => filterForm.resetFields()}
              />
            </Col>
          </Row>
        </Form>

        <div className="table-summary">
          共 <strong>{channels.length}</strong> 个渠道
        </div>
        <Table rowKey="id" columns={columns} dataSource={channels} scroll={{ x: 1280 }} pagination={false} size="middle" />
      </Card>

      <AppDrawer
        title={editing ? '编辑渠道' : '创建渠道'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={720}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSave}>保存</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" requiredMark="optional">
          <FormSection title="基本信息">
            <FormRow>
              <FormCol>
                <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入渠道名称' }]}>
                  <Input placeholder="名称唯一" />
                </Form.Item>
              </FormCol>
              <FormCol>
                <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
                  <Select placeholder="请选择" options={channelTypes.map((t) => ({ value: t, label: t }))} />
                </Form.Item>
              </FormCol>
            </FormRow>
            <FormRow>
              <FormCol>
                <Form.Item
                  name="rechargeAmount"
                  label="充值金额 (CNY)"
                  extra="不可在此编辑，请使用列表「充值/扣款」记账；参考余额在弹窗中查看"
                >
                  <InputNumber
                    min={0}
                    step={0.01}
                    precision={2}
                    style={{ width: '100%' }}
                    placeholder="0.00"
                    disabled
                  />
                </Form.Item>
              </FormCol>
            </FormRow>
            <div className="form-switch-row">
              <div>
                <div className="switch-label">启用/禁用</div>
                <div className="switch-desc">禁用后该渠道将不再接收请求</div>
              </div>
              <Form.Item name="status" valuePropName="checked" noStyle>
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </div>
          </FormSection>

          <FormSection title="API 访问信息">
            <Form.Item name="apiUrl" label="API 地址">
              <Input placeholder="https://api.example.com/v1" />
            </Form.Item>
            <FormRow>
              <FormCol>
                <Form.Item name="keyMode" label="添加模式">
                  <Radio.Group optionType="button" buttonStyle="solid">
                    <Radio.Button value="single">单密钥</Radio.Button>
                    <Radio.Button value="multi">多密钥</Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </FormCol>
              {keyMode === 'multi' && (
                <FormCol>
                  <Form.Item name="multiKeyStrategy" label="多密钥策略">
                    <Radio.Group optionType="button" buttonStyle="solid">
                      <Radio.Button value="random">随机</Radio.Button>
                      <Radio.Button value="round">轮循</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                </FormCol>
              )}
            </FormRow>
            <Form.Item name="apiKeys" label="API 密钥" rules={[{ required: true, message: '请输入密钥' }]}>
              <Input.TextArea
                rows={keyMode === 'multi' ? 3 : 2}
                placeholder={keyMode === 'multi' ? '每行一个密钥' : '请输入 API 密钥'}
              />
            </Form.Item>
          </FormSection>

          <FormSection title="模型与分组">
            <FormRow>
              <FormCol>
                <Form.Item name="modelIds" label="模型" rules={[{ required: true, message: '请选择模型' }]}>
                  <Select mode="multiple" placeholder="请选择模型" options={modelOptions} />
                </Form.Item>
              </FormCol>
              <FormCol>
                <Form.Item name="groupIds" label="模型分组" rules={[{ required: true, message: '请选择分组' }]}>
                  <Select mode="multiple" placeholder="请选择分组" options={groupOptions} />
                </Form.Item>
              </FormCol>
            </FormRow>
          </FormSection>

          <FormSection title="模型映射">
            <Form.List name="modelMappings">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <FormRow key={key}>
                      <FormCol>
                        <Form.Item
                          {...restField}
                          name={[name, 'originalModel']}
                          label="原始模型"
                          rules={[{ required: true, message: '请输入原始模型' }]}
                        >
                          <Input placeholder="API 请求中的 model 参数值" />
                        </Form.Item>
                      </FormCol>
                      <FormCol>
                        <Form.Item
                          {...restField}
                          name={[name, 'replaceModel']}
                          label="替换模型"
                          rules={[{ required: true, message: '请输入替换模型' }]}
                        >
                          <Input placeholder="转发给上游的真实模型名" />
                        </Form.Item>
                      </FormCol>
                      {fields.length > 1 && (
                        <FormCol>
                          <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingBottom: 24 }}>
                            <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} />
                          </div>
                        </FormCol>
                      )}
                    </FormRow>
                  ))}
                  <Button type="dashed" onClick={() => add({})} block icon={<PlusOutlined />}>
                    添加模型映射
                  </Button>
                </>
              )}
            </Form.List>
          </FormSection>
        </Form>
      </AppDrawer>

      <AppDrawer
        title={`用量查询 · ${currentChannel?.name || ''}`}
        open={usageDrawerOpen}
        onClose={() => setUsageDrawerOpen(false)}
        width={960}
      >
        <Form form={usageForm} layout="vertical" className="drawer-filter-panel">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="timeRange" label="时间段">
                <RangePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="projectName" label="项目名称">
                <Input placeholder="模糊查询" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="model" label="模型名称">
                <Input placeholder="请输入" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="groupId" label="分组">
                <Select placeholder="全部" allowClear options={groupOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="logType" label="日志类型">
                <Select
                  placeholder="全部"
                  allowClear
                  options={[
                    { value: '消耗', label: '消耗' },
                    { value: '扣款', label: '扣款' },
                    { value: '充值', label: '充值' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6} className="filter-actions-col">
              <FilterActions onSearch={handleUsageSearch} onReset={handleUsageReset} />
            </Col>
          </Row>
        </Form>
        <div className="table-summary">
          共 <strong>{usageRows.length}</strong> 条用量记录
          <span style={{ marginLeft: 8, color: 'rgba(0,0,0,.45)', fontSize: 12 }}>
            仅使用日志中的消耗等记录，不含渠道记账
          </span>
        </div>
        <div className="drawer-table-wrap">
          <Table
            rowKey="id"
            columns={usageColumns}
            dataSource={usageRows}
            scroll={{ x: 1320 }}
            pagination={{ pageSize: 8, size: 'small', showTotal: (t) => `共 ${t} 条` }}
            size="small"
          />
        </div>
      </AppDrawer>

      <AppModal
        className="channel-recharge-modal"
        title="渠道充值 / 扣款"
        open={rechargeModalOpen}
        onOk={handleChannelRecharge}
        onCancel={() => setRechargeModalOpen(false)}
        width={840}
      >
        <div className="channel-recharge-modal-body">
          <div className="channel-recharge-channel-bar">
            <div className="channel-recharge-channel-icon">
              <CloudServerOutlined />
            </div>
            <div className="channel-recharge-channel-meta">
              <div className="channel-recharge-channel-label">当前渠道</div>
              <div className="channel-recharge-channel-name">{currentChannel?.name || '—'}</div>
            </div>
            <Tag color="processing" bordered={false}>
              {currentChannel?.type || '—'}
            </Tag>
          </div>

          <Alert
            type="info"
            showIcon
            message="渠道充值/扣款仅作记账，不写入使用日志；参考余额可为负数，不影响实际调用，除非上游渠道返回「余额不足」。"
            style={{ marginBottom: 0 }}
          />

          <div className="channel-recharge-form-panel">
            <div className="form-section-title">记账操作</div>
            <Form form={channelRechargeForm} layout="vertical" requiredMark="optional">
              <Form.Item name="adjustType" label="充值/扣款类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Radio.Group className="channel-recharge-adjust-type" optionType="button" buttonStyle="solid">
                  <Radio.Button value="recharge">充值</Radio.Button>
                  <Radio.Button value="deduct">扣款</Radio.Button>
                </Radio.Group>
              </Form.Item>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="amount"
                    label="金额 (CNY)"
                    rules={[{ required: true, message: '请输入金额' }]}
                    extra={
                      channelRechargeAmount > 0
                        ? `提交后参考余额约 ${formatCny2(
                            channelAdjustType === 'deduct'
                              ? rechargeSummary.balance - channelRechargeAmount
                              : rechargeSummary.balance + channelRechargeAmount
                          )}（可为负）`
                        : undefined
                    }
                  >
                    <InputNumber
                      min={0}
                      step={0.01}
                      precision={2}
                      style={{ width: '100%' }}
                      placeholder="0.00"
                      addonBefore={channelAdjustType === 'deduct' ? '−' : '+'}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="remark" label="备注">
                    <Input.TextArea rows={1} placeholder="选填，如：对账补充、活动赠送等" autoSize={{ minRows: 1, maxRows: 3 }} />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>

          <div className="channel-recharge-stats-grid">
            {rechargeStatItems.map((item) => (
              <div
                key={item.key}
                className={`channel-recharge-stat-card${
                  item.highlight ? ' channel-recharge-stat-card--balance' : ''
                }`}
              >
                <div className="channel-recharge-stat-card-head">
                  <div className="channel-recharge-stat-card-icon" style={{ background: item.bg, color: item.color }}>
                    {item.icon}
                  </div>
                  <span className="channel-recharge-stat-card-title">{item.title}</span>
                  {item.tip ? (
                    <Tooltip title={item.tip}>
                      <InfoCircleOutlined style={{ color: 'rgba(0,0,0,0.35)', fontSize: 13, cursor: 'help' }} />
                    </Tooltip>
                  ) : null}
                </div>
                <div
                  className={`channel-recharge-stat-card-value${
                    item.key !== 'balance' ? ' channel-recharge-stat-card-value--sm' : ''
                  }`}
                  style={{ color: item.color }}
                >
                  {formatCny2(item.value)}
                </div>
              </div>
            ))}
          </div>

          <div className="channel-recharge-formula-tip">
            <InfoCircleOutlined />
            <span>
              扣款总和为负向合计；参考余额 = 充值总和 + 扣款总和 − 消耗（可为负）。统计与列表金额展示均为 2 位小数（四舍五入）。消耗来自使用日志中的「消耗」记录（含渠道测试），与上方记账操作无关。实际是否可调用以上游「余额不足」为准。
            </span>
          </div>

          <div className="channel-recharge-history">
            <div className="channel-recharge-history-head">
              <span className="channel-recharge-history-head-title">
                <HistoryOutlined />
                充值/扣款记录
              </span>
              <span className="channel-recharge-history-count">共 {rechargeRecordRows.length} 条</span>
            </div>
            <div className="channel-recharge-history-body">
              <Table
                className="channel-recharge-table"
                rowKey="id"
                size="small"
                columns={rechargeRecordColumns}
                dataSource={rechargeRecordRows}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="暂无充值/扣款记录，提交上方操作后将显示于此"
                    />
                  )
                }}
                pagination={
                  rechargeRecordRows.length > 6
                    ? { pageSize: 6, size: 'small', showTotal: (t) => `共 ${t} 条` }
                    : false
                }
              />
            </div>
          </div>
        </div>
      </AppModal>
    </div>
  );
}
