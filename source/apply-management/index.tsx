/**
 * @name 申请管理
 */

import '../components/page.css';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  CheckOutlined,
  CloudDownloadOutlined,
  ExportOutlined,
  InfoCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TableRowSelection } from 'antd/es/table';

import {
  fetchApplyListFromOpenPlatform,
  fetchEnterpriseApplications,
  ignoreEnterpriseApplication,
  processEnterpriseApplication,
  type EnterpriseApplicationQuery,
} from '../components/applyService';
import {
  ENTERPRISE_APPLY_PROCESS_LABELS,
  getApplyFetchCursor,
  type EnterpriseApplyProcessStatus,
  type StoredApplyRecord,
} from '../components/applyRecords';
import { PageHeader, FilterActions } from '../components/PageHeader';
import { downloadApplyRecordsCsv } from '../components/exportApplyRecords';

const processStatusColor: Record<EnterpriseApplyProcessStatus, string> = {
  unprocessed: 'orange',
  processed: 'success',
  ignored: 'default',
};

function renderEllipsisCell(value?: string | null, options?: { multiline?: boolean }) {
  const text = value?.trim() || '—';
  if (text === '—') return text;
  return (
    <Typography.Text
      ellipsis={{
        tooltip: {
          title: text,
          placement: 'topLeft',
          overlayInnerStyle: options?.multiline
            ? { whiteSpace: 'pre-wrap', maxWidth: 480 }
            : { maxWidth: 400 },
        },
      }}
      className="apply-management-cell-ellipsis"
    >
      {text}
    </Typography.Text>
  );
}

function buildQueryFromForm(values: {
  processStatus?: EnterpriseApplicationQuery['processStatus'];
  companyName?: string;
}): EnterpriseApplicationQuery {
  return {
    processStatus: values.processStatus ?? 'all',
    companyName: values.companyName?.trim() || undefined,
  };
}

export default function ApplyManagementPage() {
  const [form] = Form.useForm();
  const [rows, setRows] = useState<StoredApplyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const appliedQueryRef = useRef<EnterpriseApplicationQuery>({ processStatus: 'all' });

  const loadData = useCallback(async (query: EnterpriseApplicationQuery = {}, options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) setLoading(true);
    appliedQueryRef.current = query;

    try {
      const data = await fetchEnterpriseApplications(query);
      setRows(data);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData({ processStatus: 'all' });
  }, [loadData]);

  const handleSearch = () => {
    loadData(buildQueryFromForm(form.getFieldsValue()));
    message.success('已刷新列表');
  };

  const handleReset = () => {
    form.resetFields();
    loadData({ processStatus: 'all' });
    message.info('筛选条件已重置');
  };

  const handleFetchApplyList = async () => {
    setFetching(true);
    try {
      const result = await fetchApplyListFromOpenPlatform();
      setLastFetchedAt(result.fetchedAt);
      await loadData(appliedQueryRef.current, { silent: true });
      if (result.addedCount > 0) {
        message.success(`获取完成，新增 ${result.addedCount} 条申请`);
      } else {
        message.info('暂无新的企业接入申请');
      }
    } catch {
      message.error('获取申请列表失败，请稍后重试');
    } finally {
      setFetching(false);
    }
  };

  const handleProcess = useCallback(async (record: StoredApplyRecord) => {
    setActingId(record.id);
    try {
      const updated = await processEnterpriseApplication(record.id);
      if (!updated) {
        message.error('仅未处理申请可标记为已处理');
        return;
      }
      message.success('已标记为已处理');
      await loadData(appliedQueryRef.current, { silent: true });
    } finally {
      setActingId(null);
    }
  }, [loadData]);

  const handleIgnore = useCallback(async (record: StoredApplyRecord) => {
    setActingId(record.id);
    try {
      const updated = await ignoreEnterpriseApplication(record.id);
      if (!updated) {
        message.error('仅未处理申请可标记为不处理');
        return;
      }
      message.success('已标记为不处理');
      await loadData(appliedQueryRef.current, { silent: true });
    } finally {
      setActingId(null);
    }
  }, [loadData]);

  const handleExportSelected = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先勾选需要导出的申请');
      return;
    }
    const selectedSet = new Set(selectedRowKeys);
    const selectedRecords = rows.filter((row) => selectedSet.has(row.id));
    if (selectedRecords.length === 0) {
      message.warning('所选申请不在当前列表中，请重新勾选');
      setSelectedRowKeys([]);
      return;
    }
    const fileName = downloadApplyRecordsCsv({ records: selectedRecords });
    message.success(`已导出 ${selectedRecords.length} 条申请：${fileName}`);
  };

  const rowSelection: TableRowSelection<StoredApplyRecord> = useMemo(() => ({
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    preserveSelectedRowKeys: true,
  }), [selectedRowKeys]);

  const columns: ColumnsType<StoredApplyRecord> = useMemo(() => [
    {
      title: '企业名称',
      dataIndex: 'companyName',
      width: 160,
      ellipsis: true,
      fixed: 'left',
      render: (value: string) => renderEllipsisCell(value),
    },
    {
      title: '统一社会信用代码',
      dataIndex: 'creditCode',
      width: 180,
      ellipsis: true,
      render: (value: string) => renderEllipsisCell(value),
    },
    { title: '联系人', dataIndex: 'contactName', width: 100 },
    { title: '联系电话', dataIndex: 'contactPhone', width: 128 },
    {
      title: '联系邮箱',
      dataIndex: 'contactEmail',
      width: 180,
      ellipsis: true,
      render: (value: string) => renderEllipsisCell(value),
    },
    {
      title: '使用场景说明',
      dataIndex: 'usageScene',
      ellipsis: true,
      render: (value: string) => renderEllipsisCell(value, { multiline: true }),
    },
    { title: '创建时间', dataIndex: 'submittedAt', width: 168 },
    {
      title: '状态',
      dataIndex: 'processStatus',
      width: 96,
      render: (status: EnterpriseApplyProcessStatus) => (
        <Tag color={processStatusColor[status]}>{ENTERPRISE_APPLY_PROCESS_LABELS[status]}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 168,
      fixed: 'right',
      className: 'apply-management-action-col',
      render: (_, record) => (
        <Space size={0} wrap={false} className="table-actions apply-management-actions">
          {record.processStatus === 'unprocessed' ? (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                loading={actingId === record.id}
                onClick={() => handleProcess(record)}
              >
                已处理
              </Button>
              <Button
                type="link"
                size="small"
                icon={<MinusCircleOutlined />}
                loading={actingId === record.id}
                onClick={() => handleIgnore(record)}
              >
                不处理
              </Button>
            </>
          ) : (
            <Tooltip title={record.processStatus === 'processed' ? '已完成处理' : '已标记为不处理'}>
              <Typography.Text type="secondary">—</Typography.Text>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ], [actingId, handleIgnore, handleProcess]);

  const unprocessedCount = rows.filter((row) => row.processStatus === 'unprocessed').length;
  const ignoredCount = rows.filter((row) => row.processStatus === 'ignored').length;
  const fetchCursor = getApplyFetchCursor();

  return (
    <div>
      <PageHeader
        title="申请管理"
        description="从灵数 API 开放平台增量获取企业接入申请，并在本地维护处理状态；处理完成后可在项目管理（SaaS 类型）中开通企业账号。"
      />

      <Card bordered={false} className="page-card">
        <div className="apply-management-toolbar">
          <div className="apply-management-toolbar-callout" role="note">
            <InfoCircleOutlined className="apply-management-toolbar-icon" aria-hidden />
            <p className="apply-management-toolbar-hint">
              点击【获取申请列表】调用开放平台接口，按<strong>创建时间</strong>增量拉取申请信息（不含状态字段）；
              已入库申请的处理状态仅在运营管理端维护，不会被接口覆盖。
            </p>
          </div>
          <Space wrap className="apply-management-toolbar-actions">
            <Button
              type="primary"
              icon={<CloudDownloadOutlined />}
              loading={fetching}
              onClick={handleFetchApplyList}
            >
              获取申请列表
            </Button>
          </Space>
        </div>

        <div className="apply-management-sync-meta">
          <span>
            上次获取：
            <strong>{lastFetchedAt || '—'}</strong>
          </span>
          <span>
            增量游标（创建时间）：
            <strong>{fetchCursor || '尚未获取'}</strong>
          </span>
        </div>

        <Form
          form={form}
          layout="vertical"
          className="filter-panel"
          initialValues={{ processStatus: 'all' }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} lg={4}>
              <Form.Item name="processStatus" label="状态">
                <Select
                  options={[
                    { value: 'all', label: '全部' },
                    { value: 'unprocessed', label: '未处理' },
                    { value: 'processed', label: '已处理' },
                    { value: 'ignored', label: '不处理' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name="companyName" label="企业名称">
                <Input allowClear placeholder="模糊查询企业名称" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={4} className="filter-actions">
              <FilterActions onSearch={handleSearch} onReset={handleReset} />
            </Col>
          </Row>
        </Form>

        <div className="table-summary apply-management-table-summary">
          <span>
            匹配 <strong>{rows.length}</strong> 条 · 未处理 <strong>{unprocessedCount}</strong> 条 · 不处理 <strong>{ignoredCount}</strong> 条
            {selectedRowKeys.length > 0 ? (
              <span className="apply-management-selection-hint"> · 已选 <strong>{selectedRowKeys.length}</strong> 条</span>
            ) : null}
          </span>
          <Button
            icon={<ExportOutlined />}
            disabled={selectedRowKeys.length === 0}
            onClick={handleExportSelected}
          >
            导出选中
          </Button>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          rowSelection={rowSelection}
          scroll={{ x: 1380 }}
          size="middle"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          locale={{ emptyText: '暂无匹配的企业申请，可点击「获取申请列表」从开放平台拉取' }}
        />
      </Card>
    </div>
  );
}
