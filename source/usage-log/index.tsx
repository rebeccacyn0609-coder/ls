/**
 * @name 使用日志
 */

import '../components/page.css';

import React, { useState } from 'react';
import { Card, Table, Form, Input, Select, DatePicker, message, Row, Col } from 'antd';

import {
  mockUsageLogs,
  mockGroups,
  filterLogsForUsageLogPage,
  matchesUsageLogTypeFilter
} from '../components/mockData';
import { PageHeader, FilterActions } from '../components/PageHeader';
import { buildUsageLogColumns } from '../components/usageLogColumns';

const { RangePicker } = DatePicker;

export default function UsageLogPage() {
  const [form] = Form.useForm();
  const [data, setData] = useState(() => filterLogsForUsageLogPage(mockUsageLogs));
  const [loading, setLoading] = useState(false);

  const groupOptions = mockGroups.map((g) => ({ value: g.id, label: g.name }));
  const columns = buildUsageLogColumns({ showProject: true });

  const handleSearch = () => {
    setLoading(true);
    const { projectName, channel, model, groupId, logType } = form.getFieldsValue();
    let rows = filterLogsForUsageLogPage(mockUsageLogs);
    if (projectName?.trim()) {
      const kw = projectName.trim().toLowerCase();
      rows = rows.filter((r) => r.projectName.toLowerCase().includes(kw));
    }
    if (channel?.trim()) {
      const kw = channel.trim().toLowerCase();
      rows = rows.filter((r) => r.channel.toLowerCase().includes(kw));
    }
    if (model?.trim()) {
      const kw = model.trim().toLowerCase();
      rows = rows.filter((r) => r.model.toLowerCase().includes(kw));
    }
    if (groupId) {
      rows = rows.filter((r) => r.token.includes(mockGroups.find((g) => g.id === groupId)?.name || ''));
    }
    if (logType) {
      rows = rows.filter((r) => matchesUsageLogTypeFilter(r, logType));
    }
    setTimeout(() => {
      setData(rows);
      setLoading(false);
      message.success('查询完成');
    }, 400);
  };

  const handleReset = () => {
    form.resetFields();
    setData(filterLogsForUsageLogPage(mockUsageLogs));
    message.info('筛选条件已重置');
  };

  return (
    <div>
      <PageHeader
        title="使用日志"
        description="按时间段、项目名称、渠道、模型、分组与日志类型查询。「充值」「扣款」均仅含项目余额变动（运营管理）；调用失败扣款、密钥相关变动不计入。当前余额仅上述记录有值。渠道测试记为「灵数运营平台」。"
      />

      <Card bordered={false} className="page-card">
        <Form form={form} layout="vertical" className="filter-panel">
          <Row gutter={16}>
            <Col xs={24} md={12} lg={8}>
              <Form.Item name="timeRange" label="时间段">
                <RangePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Form.Item name="projectName" label="项目名称">
                <Input placeholder="模糊查询" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Form.Item name="channel" label="渠道名称">
                <Input placeholder="模糊查询" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Form.Item name="model" label="模型名称">
                <Input placeholder="请输入" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Form.Item name="groupId" label="分组">
                <Select placeholder="全部" allowClear options={groupOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={4}>
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
            <Col xs={24} lg={4} className="filter-actions">
              <FilterActions onSearch={handleSearch} onReset={handleReset} showExport onExport={() => message.info('导出功能原型演示')} />
            </Col>
          </Row>
        </Form>

        <div className="table-summary">
          共 <strong>{data.length}</strong> 条记录
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1320 }}
          size="middle"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>
    </div>
  );
}
