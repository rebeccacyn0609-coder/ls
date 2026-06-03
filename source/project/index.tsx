/**
 * @name 项目管理
 */

import '../components/page.css';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Radio,
  Typography,
  Space,
  Tag,
  Popconfirm,
  message,
  Row,
  Col,
  DatePicker,
  Dropdown,
  Modal
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  CopyOutlined,
  FileTextOutlined,
  WalletOutlined,
  DownOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  MoreOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import {
  mockProjects,
  mockApiKeys,
  mockUsageLogs,
  mockModels,
  mockGroups,
  getVisibleGroups,
  getGroupName,
  getProjectKeyCount,
  getApiKeyDisplayStatus,
  getApiKeyStatusLabel,
  getProjectStatusLabel,
  filterLogsForUsageLogPage,
  matchesUsageLogTypeFilter,
  type ProjectItem,
  type ApiKeyItem,
  type UsageLogItem,
  type QuotaMode,
  type ProjectStatus
} from '../components/mockData';
import { AppDrawer, AppModal, FormSection, FormRow, FormCol } from '../components/FormLayout';
import { PageHeader, FilterActions } from '../components/PageHeader';
import { QuotaLimitTag, QuotaAmountCell } from '../components/QuotaDisplay';
import { buildUsageLogColumns } from '../components/usageLogColumns';

const { RangePicker } = DatePicker;

const allModelOptions = mockModels.map((m) => ({ value: m.modelName, label: m.modelName }));

function randomSuffix() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function ProjectPage() {
  const [projects, setProjects] = useState(mockProjects);
  const [apiKeys, setApiKeys] = useState(mockApiKeys);
  const [usageLogs, setUsageLogs] = useState(mockUsageLogs);
  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false);
  const [keyDrawerOpen, setKeyDrawerOpen] = useState(false);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [keyRechargeModalOpen, setKeyRechargeModalOpen] = useState(false);
  const [projectRechargeModalOpen, setProjectRechargeModalOpen] = useState(false);
  const [usageLogDrawerOpen, setUsageLogDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [editingKey, setEditingKey] = useState<ApiKeyItem | null>(null);
  const [currentProject, setCurrentProject] = useState<ProjectItem | null>(null);
  const [keyRechargeTarget, setKeyRechargeTarget] = useState<ApiKeyItem | null>(null);
  const [projectRechargeTarget, setProjectRechargeTarget] = useState<ProjectItem | null>(null);
  const [displayProjects, setDisplayProjects] = useState(mockProjects);
  const [displayKeys, setDisplayKeys] = useState<ApiKeyItem[]>([]);
  const [projectForm] = Form.useForm();
  const [keyForm] = Form.useForm();
  const [keyRechargeForm] = Form.useForm();
  const [projectRechargeForm] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [usageLogForm] = Form.useForm();
  const [keyFilterForm] = Form.useForm();
  const projectType = Form.useWatch('type', projectForm);
  const projectQuotaMode = Form.useWatch('quotaMode', projectForm) as QuotaMode | undefined;
  const keyQuotaMode = Form.useWatch('quotaMode', keyForm) as QuotaMode | undefined;
  const [usageLogRows, setUsageLogRows] = useState<UsageLogItem[]>([]);

  const visibleGroups = getVisibleGroups();
  const groupOptions = mockGroups.map((g) => ({ value: g.id, label: g.name }));

  const baseProjectLogs = useMemo(
    () =>
      filterLogsForUsageLogPage(usageLogs).filter((l) => l.projectId === currentProject?.id),
    [currentProject?.id, usageLogs]
  );

  useEffect(() => {
    setDisplayProjects(projects);
  }, [projects]);

  useEffect(() => {
    if (!currentProject) {
      setDisplayKeys([]);
      return;
    }
    setDisplayKeys(apiKeys.filter((k) => k.projectId === currentProject.id));
  }, [apiKeys, currentProject]);

  useEffect(() => {
    if (usageLogDrawerOpen && currentProject) {
      usageLogForm.resetFields();
      setUsageLogRows(baseProjectLogs);
    }
  }, [usageLogDrawerOpen, currentProject, baseProjectLogs, usageLogForm]);

  const openCreateProject = () => {
    setEditingProject(null);
    projectForm.resetFields();
    projectForm.setFieldsValue({ type: 'local', quotaMode: 'limited', enabled: true });
    setProjectDrawerOpen(true);
  };

  const openEditProject = (record: ProjectItem) => {
    setEditingProject(record);
    projectForm.setFieldsValue({
      ...record,
      enabled: record.status === 'enabled',
      rechargeAmount: record.quotaMode === 'limited' ? record.totalQuota : undefined
    });
    setProjectDrawerOpen(true);
  };

  const handleSaveProject = async () => {
    const values = await projectForm.validateFields();
    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    const quotaMode = (values.quotaMode || 'limited') as QuotaMode;
    const rechargeAmount = values.rechargeAmount ?? 0;
    const { enabled, rechargeAmount: _ra, password, username, packageType, ...rest } = values;
    const payload: Partial<ProjectItem> = {
      ...rest,
      status: (enabled !== false ? 'enabled' : 'disabled') as ProjectStatus,
      quotaMode,
      updatedAt: now
    };

    if (editingProject) {
      const wasLimited = editingProject.quotaMode === 'limited';
      if (quotaMode === 'unlimited') {
        payload.totalQuota = 0;
        payload.remainingQuota = 0;
        payload.consumptionTotal = editingProject.consumptionTotal;
      } else if (wasLimited) {
        payload.totalQuota = editingProject.totalQuota;
        payload.remainingQuota = editingProject.remainingQuota;
        payload.consumptionTotal = editingProject.consumptionTotal;
      } else {
        payload.totalQuota = rechargeAmount;
        payload.remainingQuota = rechargeAmount;
        payload.consumptionTotal = 0;
      }
    } else if (quotaMode === 'limited') {
      payload.totalQuota = rechargeAmount;
      payload.remainingQuota = rechargeAmount;
      payload.consumptionTotal = 0;
    } else {
      payload.totalQuota = 0;
      payload.remainingQuota = 0;
      payload.consumptionTotal = 0;
    }

    if (editingProject) {
      setProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? { ...p, ...payload } as ProjectItem : p))
      );
      message.success('项目已更新');
    } else {
      setProjects((prev) => [
        ...prev,
        {
          id: `p${Date.now()}`,
          code: `PRJ-${Date.now().toString().slice(-6)}`,
          status: payload.status ?? 'enabled',
          ...payload
        } as ProjectItem
      ]);
      message.success('项目已创建');
    }
    setProjectDrawerOpen(false);
  };

  const openKeyConfig = (project: ProjectItem) => {
    setCurrentProject(project);
    setKeyDrawerOpen(true);
  };

  const openUsageLog = (project: ProjectItem) => {
    setCurrentProject(project);
    setUsageLogDrawerOpen(true);
  };

  const handleUsageLogSearch = () => {
    const { channel, model, groupId, logType } = usageLogForm.getFieldsValue();
    let rows = baseProjectLogs;
    if (channel?.trim()) {
      const kw = channel.trim().toLowerCase();
      rows = rows.filter((r) => r.channel.toLowerCase().includes(kw));
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
    setUsageLogRows(rows);
    message.success('查询完成');
  };

  const handleUsageLogReset = () => {
    usageLogForm.resetFields();
    setUsageLogRows(baseProjectLogs);
    message.info('筛选条件已重置');
  };

  const openCreateKey = () => {
    setEditingKey(null);
    keyForm.resetFields();
    keyForm.setFieldsValue({ keyCount: 1, quotaMode: 'limited' });
    setKeyModalOpen(true);
  };

  const openEditKey = (record: ApiKeyItem) => {
    setEditingKey(record);
    keyForm.setFieldsValue({
      name: record.name,
      groupId: record.groupId,
      quotaMode: record.quotaMode,
      quota: record.quotaMode === 'limited' ? record.totalQuota : undefined,
      allowedModels: record.allowedModels,
      ipLimit: record.ipLimit
    });
    setKeyModalOpen(true);
  };

  const openKeyRecharge = (record: ApiKeyItem) => {
    setKeyRechargeTarget(record);
    keyRechargeForm.resetFields();
    keyRechargeForm.setFieldsValue({ adjustType: 'recharge' });
    setKeyRechargeModalOpen(true);
  };

  const openProjectRecharge = (record: ProjectItem) => {
    if (record.quotaMode !== 'limited') {
      message.warning('无额度限制的项目无需充值');
      return;
    }
    setProjectRechargeTarget(record);
    projectRechargeForm.resetFields();
    projectRechargeForm.setFieldsValue({ adjustType: 'recharge' });
    setProjectRechargeModalOpen(true);
  };

  const toggleProjectStatus = (record: ProjectItem) => {
    const next: ProjectStatus = record.status === 'enabled' ? 'disabled' : 'enabled';
    setProjects((prev) => prev.map((p) => (p.id === record.id ? { ...p, status: next } : p)));
    message.success(next === 'enabled' ? '项目已启用' : '项目已禁用');
  };

  const handleProjectSearch = () => {
    const { keyword, type, status } = searchForm.getFieldsValue();
    let rows = projects;
    if (keyword?.trim()) {
      const kw = keyword.trim().toLowerCase();
      rows = rows.filter(
        (p) => p.name.toLowerCase().includes(kw) || p.code.toLowerCase().includes(kw)
      );
    }
    if (type) rows = rows.filter((p) => p.type === type);
    if (status) rows = rows.filter((p) => p.status === status);
    setDisplayProjects(rows);
    message.success('查询完成');
  };

  const handleProjectSearchReset = () => {
    searchForm.resetFields();
    setDisplayProjects(projects);
    message.info('筛选条件已重置');
  };

  const handleKeySearch = () => {
    if (!currentProject) return;
    const { keyName, status } = keyFilterForm.getFieldsValue();
    let rows = apiKeys.filter((k) => k.projectId === currentProject.id);
    if (keyName?.trim()) {
      const kw = keyName.trim().toLowerCase();
      rows = rows.filter((k) => k.name.toLowerCase().includes(kw));
    }
    if (status) {
      rows = rows.filter((k) => getApiKeyDisplayStatus(k) === status);
    }
    setDisplayKeys(rows);
    message.success('查询完成');
  };

  const handleKeySearchReset = () => {
    keyFilterForm.resetFields();
    if (currentProject) {
      setDisplayKeys(apiKeys.filter((k) => k.projectId === currentProject.id));
    }
    message.info('筛选条件已重置');
  };

  const handleSaveKey = async () => {
    const values = await keyForm.validateFields();
    if (!currentProject) return;
    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    const keyQuota = (values.quotaMode || 'limited') as QuotaMode;
    const quotaAmount = values.quota ?? 0;
    if (editingKey) {
      const wasLimited = editingKey.quotaMode === 'limited';
      setApiKeys((prev) =>
        prev.map((k) => {
          if (k.id !== editingKey.id) return k;
          const next: ApiKeyItem = {
            ...k,
            name: values.name,
            groupId: values.groupId,
            quotaMode: keyQuota,
            allowedModels: values.allowedModels || [],
            ipLimit: values.ipLimit || ''
          };
          if (keyQuota === 'unlimited') {
            next.totalQuota = 0;
            next.remainingQuota = 0;
            next.consumptionTotal = k.consumptionTotal;
          } else if (wasLimited) {
            next.totalQuota = k.totalQuota;
            next.remainingQuota = k.remainingQuota;
            next.consumptionTotal = k.consumptionTotal;
          } else {
            next.totalQuota = quotaAmount;
            next.remainingQuota = quotaAmount;
            next.consumptionTotal = 0;
          }
          return next;
        })
      );
      message.success('密钥已更新');
    } else {
      const count = values.keyCount || 1;
      const newKeys: ApiKeyItem[] = Array.from({ length: count }, (_, i) => ({
        id: `k${Date.now()}_${i}`,
        projectId: currentProject.id,
        name: i === 0 ? values.name : `${values.name}${randomSuffix()}`,
        status: 'active' as const,
        apiKey: `sk-ls-${Math.random().toString(36).slice(2, 18)}`,
        quotaMode: keyQuota,
        totalQuota: keyQuota === 'limited' ? quotaAmount : 0,
        remainingQuota: keyQuota === 'limited' ? quotaAmount : 0,
        consumptionTotal: 0,
        groupId: values.groupId,
        allowedModels: values.allowedModels || [],
        ipLimit: values.ipLimit || '',
        createdAt: now,
        lastUsedAt: '-'
      }));
      setApiKeys((prev) => [...prev, ...newKeys]);
      message.success(`已创建 ${count} 个密钥`);
    }
    setKeyModalOpen(false);
  };

  const handleKeyRecharge = async () => {
    const values = await keyRechargeForm.validateFields();
    if (!keyRechargeTarget) return;
    const amount = values.amount || 0;
    if (values.adjustType === 'deduct' && amount > keyRechargeTarget.remainingQuota) {
      message.error('扣款金额超过剩余额度');
      return;
    }
    const delta = values.adjustType === 'recharge' ? amount : -amount;
    const before = keyRechargeTarget.remainingQuota;
    const after = before + delta;
    setApiKeys((prev) =>
      prev.map((k) =>
        k.id === keyRechargeTarget.id
          ? { ...k, remainingQuota: after, totalQuota: k.totalQuota + Math.max(delta, 0) }
          : k
      )
    );
    message.success(`密钥余额：¥${before.toFixed(2)} → ¥${after.toFixed(2)}`);
    setKeyRechargeModalOpen(false);
  };

  const handleProjectRecharge = async () => {
    const values = await projectRechargeForm.validateFields();
    if (!projectRechargeTarget || projectRechargeTarget.quotaMode !== 'limited') return;
    const amount = values.amount || 0;
    if (values.adjustType === 'deduct' && amount > projectRechargeTarget.remainingQuota) {
      message.error('扣款金额超过项目剩余额度');
      return;
    }
    const delta = values.adjustType === 'recharge' ? amount : -amount;
    const before = projectRechargeTarget.remainingQuota;
    const after = before + delta;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectRechargeTarget.id
          ? {
              ...p,
              remainingQuota: after,
              totalQuota: p.totalQuota + Math.max(delta, 0)
            }
          : p
      )
    );

    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    const isRecharge = values.adjustType === 'recharge';
    setUsageLogs((prev) => [
      {
        id: `l${Date.now()}`,
        projectId: projectRechargeTarget.id,
        projectName: projectRechargeTarget.name,
        type: isRecharge ? '充值' : '扣款',
        projectBalanceOp: true,
        time: now,
        channel: '-',
        token: '-',
        model: '-',
        duration: '-',
        inputTokens: 0,
        outputTokens: 0,
        cost: isRecharge ? amount : -amount,
        balanceAfter: after,
        remark: values.remark?.trim() || (isRecharge ? '项目金额充值' : '项目余额扣款（运营管理）')
      },
      ...prev
    ]);

    message.success(`项目额度：¥${before.toFixed(2)} → ¥${after.toFixed(2)}`);
    setProjectRechargeModalOpen(false);
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    message.success(`${label}已复制`);
  };

  const projectColumns: ColumnsType<ProjectItem> = [
    { title: '序号', width: 60, render: (_, __, i) => i + 1 },
    { title: '项目编号', dataIndex: 'code', width: 130 },
    { title: '项目名称', dataIndex: 'name', width: 160 },
    {
      title: '项目类型',
      dataIndex: 'type',
      width: 110,
      render: (t: string) => (
        <Tag color={t === 'saas' ? 'blue' : 'default'}>{t === 'saas' ? 'SaaS' : '本地化部署'}</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 88,
      render: (s: ProjectStatus) => (
        <Tag color={s === 'enabled' ? 'success' : 'default'}>{getProjectStatusLabel(s)}</Tag>
      )
    },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
    {
      title: '密钥数量总和',
      width: 110,
      align: 'center',
      render: (_, r) => getProjectKeyCount(r.id, apiKeys)
    },
    {
      title: '额度限制',
      width: 88,
      render: (_, r) => <QuotaLimitTag mode={r.quotaMode} />
    },
    {
      title: '项目额度/消费总额',
      width: 180,
      render: (_, r) => (
        <QuotaAmountCell
          mode={r.quotaMode}
          totalQuota={r.totalQuota}
          remainingQuota={r.remainingQuota}
          consumptionTotal={r.consumptionTotal}
        />
      )
    },
    { title: '更新时间', dataIndex: 'updatedAt', width: 165 },
    {
      title: '操作',
      width: 300,
      fixed: 'right',
      render: (_, record) => {
        const moreItems: MenuProps['items'] = [
          {
            key: 'adjust',
            label: '充值/扣款',
            icon: <WalletOutlined />,
            onClick: () => openProjectRecharge(record)
          },
          {
            key: 'log',
            label: '使用日志',
            icon: <FileTextOutlined />,
            onClick: () => openUsageLog(record)
          },
          { type: 'divider' },
          {
            key: 'delete',
            label: '删除',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: '确认删除该项目？',
                content: '删除后不可恢复',
                okType: 'danger',
                onOk: () => {
                  setProjects((p) => p.filter((x) => x.id !== record.id));
                  message.success('项目已删除');
                }
              });
            }
          }
        ];
        return (
          <Space className="table-actions" wrap>
            <Button
              type="link"
              size="small"
              icon={record.status === 'enabled' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => toggleProjectStatus(record)}
            >
              {record.status === 'enabled' ? '禁用' : '启用'}
            </Button>
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditProject(record)}>
              编辑
            </Button>
            <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => openKeyConfig(record)}>
              密钥配置
            </Button>
            <Dropdown menu={{ items: moreItems }} trigger={['click']}>
              <Button type="link" size="small" icon={<MoreOutlined />}>
                更多 <DownOutlined style={{ fontSize: 10 }} />
              </Button>
            </Dropdown>
          </Space>
        );
      }
    }
  ];

  const keyColumns: ColumnsType<ApiKeyItem> = [
    { title: '名称', dataIndex: 'name', width: 110 },
    {
      title: '状态',
      width: 88,
      render: (_, record) => {
        const displayStatus = getApiKeyDisplayStatus(record);
        const color =
          displayStatus === 'active' ? 'success' : displayStatus === 'exhausted' ? 'warning' : 'default';
        return <Tag color={color}>{getApiKeyStatusLabel(displayStatus)}</Tag>;
      }
    },
    {
      title: 'API 密钥',
      dataIndex: 'apiKey',
      width: 180,
      render: (key: string) => (
        <Space size={4}>
          <Typography.Text code style={{ fontSize: 12 }}>{key.slice(0, 14)}...</Typography.Text>
          <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyText(key, '密钥')} />
        </Space>
      )
    },
    {
      title: '额度限制',
      width: 88,
      render: (_, r) => <QuotaLimitTag mode={r.quotaMode} />
    },
    {
      title: '密钥额度/消费总额',
      width: 180,
      render: (_, r) => (
        <QuotaAmountCell
          mode={r.quotaMode}
          totalQuota={r.totalQuota}
          remainingQuota={r.remainingQuota}
          consumptionTotal={r.consumptionTotal}
        />
      )
    },
    {
      title: '分组名称',
      dataIndex: 'groupId',
      width: 100,
      render: (id: string) => getGroupName(id)
    },
    {
      title: '允许模型',
      dataIndex: 'allowedModels',
      width: 120,
      ellipsis: true,
      render: (models: string[]) => models.join(', ') || '全部'
    },
    { title: 'IP 限制', dataIndex: 'ipLimit', width: 120, ellipsis: true, render: (v: string) => v || '无限制' },
    { title: '创建时间', dataIndex: 'createdAt', width: 155 },
    { title: '最后使用时间', dataIndex: 'lastUsedAt', width: 155 },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const moreItems: MenuProps['items'] = [
          {
            key: 'copyLink',
            icon: <CopyOutlined />,
            label: '复制链接',
            onClick: () => copyText(window.location.href, '链接')
          },
          {
            key: 'copyKey',
            icon: <CopyOutlined />,
            label: '复制密钥',
            onClick: () => copyText(record.apiKey, '密钥')
          },
          {
            key: 'recharge',
            icon: <WalletOutlined />,
            label: '充值',
            onClick: () => openKeyRecharge(record)
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: '删除',
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: '确认删除该密钥？',
                okText: '删除',
                okType: 'danger',
                cancelText: '取消',
                onOk: () => {
                  setApiKeys((p) => p.filter((k) => k.id !== record.id));
                  message.success('密钥已删除');
                }
              });
            }
          }
        ];
        return (
          <Space className="table-actions" wrap size={0}>
            <Button
              type="link"
              size="small"
              onClick={() =>
                setApiKeys((prev) =>
                  prev.map((k) =>
                    k.id === record.id ? { ...k, status: k.status === 'active' ? 'closed' : 'active' } : k
                  )
                )
              }
            >
              {record.status === 'active' ? '禁用' : '启用'}
            </Button>
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditKey(record)}>
              编辑
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

  const usageLogColumns = buildUsageLogColumns({ showProject: false });

  return (
    <div>
      <PageHeader
        title="项目管理"
        description="管理 token 项目及 API 密钥，支持本地化部署与 SaaS；可配置密钥、查看项目使用日志。"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateProject}>
            新增项目
          </Button>
        }
      />

      <Card bordered={false} className="page-card">
        <Form form={searchForm} layout="vertical" className="filter-panel">
          <Row gutter={16}>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name="keyword" label="项目名称/编号">
                <Input placeholder="模糊查询" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Form.Item name="type" label="项目类型">
                <Select
                  placeholder="全部"
                  allowClear
                  options={[
                    { value: 'local', label: '本地化部署' },
                    { value: 'saas', label: 'SaaS' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Form.Item name="status" label="状态">
                <Select
                  placeholder="全部"
                  allowClear
                  options={[
                    { value: 'enabled', label: '已启用' },
                    { value: 'disabled', label: '已禁用' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={6} className="filter-actions">
              <FilterActions onSearch={handleProjectSearch} onReset={handleProjectSearchReset} />
            </Col>
          </Row>
        </Form>

        <div className="table-summary">
          共 <strong>{displayProjects.length}</strong> 个项目
        </div>
        <Table rowKey="id" columns={projectColumns} dataSource={displayProjects} scroll={{ x: 1480 }} pagination={false} size="middle" />
      </Card>

      <AppDrawer
        title={editingProject ? '编辑项目' : '新增项目'}
        open={projectDrawerOpen}
        onClose={() => setProjectDrawerOpen(false)}
        width={640}
        extra={
          <Space>
            <Button onClick={() => setProjectDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSaveProject}>保存</Button>
          </Space>
        }
      >
        <Form form={projectForm} layout="vertical" requiredMark="optional">
          <FormSection title="基本信息">
            <FormRow>
              <FormCol>
                <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
                  <Input placeholder="请输入项目名称" />
                </Form.Item>
              </FormCol>
              <FormCol>
                <Form.Item name="type" label="项目类型" rules={[{ required: true }]}>
                  <Select
                    options={[
                      { value: 'local', label: '本地化部署' },
                      { value: 'saas', label: 'SaaS' }
                    ]}
                  />
                </Form.Item>
              </FormCol>
            </FormRow>
            <FormRow>
              <FormCol>
                <Form.Item name="company" label="公司名称" rules={[{ required: true }]}>
                  <Input placeholder="请输入公司名称" />
                </Form.Item>
              </FormCol>
              <FormCol>
                <Form.Item name="contact" label="联系人">
                  <Input placeholder="选填" />
                </Form.Item>
              </FormCol>
            </FormRow>
            <FormRow>
              <FormCol>
                <Form.Item name="phone" label="联系电话">
                  <Input placeholder="选填" />
                </Form.Item>
              </FormCol>
              <FormCol>
                <Form.Item name="groupId" label="分组">
                  <Select placeholder="请选择分组" allowClear options={groupOptions} />
                </Form.Item>
              </FormCol>
            </FormRow>
            <FormRow>
              <FormCol>
                <Form.Item name="quotaMode" label="额度限制" rules={[{ required: true }]}>
                  <Radio.Group>
                    <Radio value="limited">有限制</Radio>
                    <Radio value="unlimited">无限制</Radio>
                  </Radio.Group>
                </Form.Item>
              </FormCol>
              {projectQuotaMode === 'limited' && (
                <FormCol>
                  <Form.Item
                    name="rechargeAmount"
                    label="项目充值金额 (CNY)"
                    rules={
                      editingProject?.quotaMode === 'limited'
                        ? undefined
                        : [{ required: true, message: '请输入充值金额' }]
                    }
                    extra={
                      editingProject?.quotaMode === 'limited'
                        ? '编辑时不可修改已有额度，请通过「更多 → 充值/扣款」调整'
                        : undefined
                    }
                  >
                    <InputNumber
                      min={0}
                      step={0.01}
                      precision={2}
                      style={{ width: '100%' }}
                      disabled={editingProject?.quotaMode === 'limited'}
                    />
                  </Form.Item>
                </FormCol>
              )}
            </FormRow>
            <div className="form-switch-row">
              <div>
                <div className="switch-label">状态</div>
                <div className="switch-desc">关闭后项目不可用，默认开启</div>
              </div>
              <Form.Item name="enabled" valuePropName="checked" noStyle>
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
            </div>
            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={2} placeholder="选填" />
            </Form.Item>
          </FormSection>

          {projectType === 'saas' && (
            <FormSection title="账号信息（SaaS）">
              <FormRow>
                <FormCol>
                  <Form.Item name="packageType" label="套餐类型">
                    <Select
                      placeholder="请选择套餐"
                      options={[
                        { value: 'basic', label: '基础版' },
                        { value: 'pro', label: '专业版' },
                        { value: 'enterprise', label: '企业版' }
                      ]}
                    />
                  </Form.Item>
                </FormCol>
                <FormCol>
                  <Form.Item name="username" label="用户名称" rules={[{ required: true, message: '请输入用户名称' }]}>
                    <Input placeholder="超级管理员账号" />
                  </Form.Item>
                </FormCol>
              </FormRow>
              <FormRow>
                <FormCol>
                  <Form.Item name="password" label="用户密码" rules={[{ required: true, message: '请输入用户密码' }]}>
                    <Input.Password placeholder="超级管理员密码" />
                  </Form.Item>
                </FormCol>
              </FormRow>
            </FormSection>
          )}
        </Form>
      </AppDrawer>

      <AppDrawer
        title={`密钥配置 · ${currentProject?.name || ''}`}
        open={keyDrawerOpen}
        onClose={() => setKeyDrawerOpen(false)}
        width={1100}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateKey}>添加密钥</Button>
        }
      >
        <Form form={keyFilterForm} layout="vertical" className="drawer-filter-panel">
          <Row gutter={16}>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="keyName" label="密钥名称">
                <Input placeholder="模糊查询" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name="status" label="状态">
                <Select
                  placeholder="全部"
                  allowClear
                  options={[
                    { value: 'active', label: '已启用' },
                    { value: 'closed', label: '已禁用' },
                    { value: 'exhausted', label: '已耗尽' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={8} className="filter-actions-col">
              <FilterActions onSearch={handleKeySearch} onReset={handleKeySearchReset} />
            </Col>
          </Row>
        </Form>
        <div className="table-summary">
          共 <strong>{displayKeys.length}</strong> 个密钥
        </div>
        <div className="drawer-table-wrap">
          <Table rowKey="id" columns={keyColumns} dataSource={displayKeys} scroll={{ x: 1400 }} pagination={false} size="small" />
        </div>
      </AppDrawer>

      <AppDrawer
        title={`使用日志 · ${currentProject?.name || ''}`}
        open={usageLogDrawerOpen}
        onClose={() => setUsageLogDrawerOpen(false)}
        width={960}
      >
        <Form form={usageLogForm} layout="vertical" className="drawer-filter-panel">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="timeRange" label="时间段">
                <RangePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="channel" label="渠道名称">
                <Input placeholder="请输入" allowClear />
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
              <FilterActions onSearch={handleUsageLogSearch} onReset={handleUsageLogReset} />
            </Col>
          </Row>
        </Form>
        <div className="table-summary">
          共 <strong>{usageLogRows.length}</strong> 条记录
          <span style={{ marginLeft: 8, color: 'rgba(0,0,0,.45)', fontSize: 12 }}>
            「充值」「扣款」仅含项目余额变动，展示规则一致
          </span>
        </div>
        <div className="drawer-table-wrap">
          <Table
            rowKey="id"
            columns={usageLogColumns}
            dataSource={usageLogRows}
            scroll={{ x: 1200 }}
            pagination={{ pageSize: 8, size: 'small', showTotal: (t) => `共 ${t} 条` }}
            size="small"
          />
        </div>
      </AppDrawer>

      <AppModal
        title={editingKey ? '编辑 API 密钥' : '添加 API 密钥'}
        open={keyModalOpen}
        onOk={handleSaveKey}
        onCancel={() => setKeyModalOpen(false)}
        width={560}
      >
        <Form form={keyForm} layout="vertical" requiredMark="optional">
          <FormSection title="基本信息">
            <FormRow>
              <FormCol>
                <Form.Item name="name" label="名称" rules={[{ required: true }]}>
                  <Input placeholder="密钥名称" />
                </Form.Item>
              </FormCol>
              <FormCol>
                <Form.Item name="groupId" label="分组" rules={[{ required: true, message: '请选择分组' }]}>
                  <Select
                    placeholder="请选择可见分组"
                    options={visibleGroups.map((g) => ({ value: g.id, label: `${g.name} (${g.ratio.toFixed(2)}x)` }))}
                  />
                </Form.Item>
              </FormCol>
            </FormRow>
            <FormRow>
              <FormCol>
                <Form.Item name="quotaMode" label="额度限制" rules={[{ required: true }]}>
                  <Radio.Group>
                    <Radio value="limited">有限</Radio>
                    <Radio value="unlimited">无限</Radio>
                  </Radio.Group>
                </Form.Item>
              </FormCol>
              {!editingKey && (
                <FormCol>
                  <Form.Item name="keyCount" label="密钥创建数量">
                    <InputNumber min={1} max={10} style={{ width: '100%' }} />
                  </Form.Item>
                </FormCol>
              )}
              {keyQuotaMode === 'limited' && (
                <FormCol>
                  <Form.Item
                    name="quota"
                    label="额度 (CNY)"
                    rules={
                      editingKey?.quotaMode === 'limited'
                        ? undefined
                        : [{ required: true, message: '请输入额度' }]
                    }
                    extra={
                      editingKey?.quotaMode === 'limited'
                        ? '编辑时不可修改已有额度，请通过「更多 → 充值」调整余额'
                        : undefined
                    }
                  >
                    <InputNumber
                      min={0}
                      step={0.01}
                      precision={2}
                      style={{ width: '100%' }}
                      disabled={editingKey?.quotaMode === 'limited'}
                    />
                  </Form.Item>
                </FormCol>
              )}
            </FormRow>
          </FormSection>
          <FormSection title="高级设置">
            <Form.Item name="allowedModels" label="模型限制" extra="选择范围为渠道配置的模型，留空表示不限制">
              <Select mode="multiple" placeholder="留空表示不限制" options={allModelOptions} />
            </Form.Item>
            <Form.Item name="ipLimit" label="IP 白名单" extra="每行一个 IP，留空表示无限制" style={{ marginBottom: 0 }}>
              <Input.TextArea rows={2} placeholder={'192.168.1.1\n10.0.0.0/8'} />
            </Form.Item>
          </FormSection>
        </Form>
      </AppModal>

      <AppModal
        title="密钥充值 / 扣款"
        open={keyRechargeModalOpen}
        onOk={handleKeyRecharge}
        onCancel={() => setKeyRechargeModalOpen(false)}
        width={480}
      >
        <Form form={keyRechargeForm} layout="vertical">
          <Form.Item label="密钥名称">
            <Input value={keyRechargeTarget?.name} disabled />
          </Form.Item>
          <Form.Item name="adjustType" label="充值/扣款类型" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="recharge">充值</Radio>
              <Radio value="deduct">扣款</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="amount" label="金额 (CNY)" rules={[{ required: true, message: '请输入金额' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="选填" />
          </Form.Item>
        </Form>
      </AppModal>

      <AppModal
        title="项目充值 / 扣款"
        open={projectRechargeModalOpen}
        onOk={handleProjectRecharge}
        onCancel={() => setProjectRechargeModalOpen(false)}
        width={480}
      >
        <Form form={projectRechargeForm} layout="vertical">
          <Form.Item label="项目名称">
            <Input value={projectRechargeTarget?.name} disabled />
          </Form.Item>
          <Form.Item name="adjustType" label="充值/扣款类型" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="recharge">充值</Radio>
              <Radio value="deduct">扣款</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="amount" label="金额 (CNY)" rules={[{ required: true, message: '请输入金额' }]}>
            <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="选填" />
          </Form.Item>
        </Form>
      </AppModal>
    </div>
  );
}
