/**
 * @name 分组管理
 */

import '../components/page.css';

import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Form,
  Input,
  InputNumber,
  Switch,
  Typography,
  Space,
  Popconfirm,
  message,
  Tag
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { mockGroups, type GroupItem } from '../components/mockData';
import { AppModal, FormSection, FormRow, FormCol } from '../components/FormLayout';
import { PageHeader } from '../components/PageHeader';

const { Text } = Typography;

export default function GroupPage() {
  const [groups, setGroups] = useState(mockGroups);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GroupItem | null>(null);
  const [form] = Form.useForm();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ ratio: 1.0, visible: true });
    setModalOpen(true);
  };

  const openEdit = (record: GroupItem) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    if (editing) {
      setGroups((prev) => prev.map((g) => (g.id === editing.id ? { ...g, ...values } : g)));
      message.success('分组已更新');
    } else {
      setGroups((prev) => [...prev, { id: `g${Date.now()}`, ...values }]);
      message.success('分组已创建');
    }
    setModalOpen(false);
  };

  const columns: ColumnsType<GroupItem> = [
    { title: '分组名称', dataIndex: 'name', width: 160 },
    {
      title: '倍率',
      dataIndex: 'ratio',
      width: 100,
      render: (v: number) => <Text code>{v.toFixed(2)}</Text>
    },
    {
      title: '密钥创建可见',
      dataIndex: 'visible',
      width: 120,
      render: (v: boolean) => (
        <Tag color={v ? 'success' : 'default'}>{v ? '可见' : '隐藏'}</Tag>
      )
    },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space className="table-actions">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除该分组？" onConfirm={() => setGroups((p) => p.filter((g) => g.id !== record.id))}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="分组管理"
        description="配置渠道、密钥与项目的分组；倍率保留两位小数，勾选后密钥创建时该分组可见。"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增分组
          </Button>
        }
      />

      <Card bordered={false} className="page-card">
        <div className="table-summary">
          共 <strong>{groups.length}</strong> 个分组
        </div>
        <Table rowKey="id" columns={columns} dataSource={groups} pagination={false} size="middle" />
      </Card>

      <AppModal
        title={editing ? '编辑分组' : '新增分组'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        width={520}
      >
        <Form form={form} layout="vertical" requiredMark="optional">
          <FormSection title="分组信息">
            <FormRow>
              <FormCol>
                <Form.Item name="name" label="分组名称" rules={[{ required: true, message: '请输入分组名称' }]}>
                  <Input placeholder="请输入分组名称" />
                </Form.Item>
              </FormCol>
              <FormCol>
                <Form.Item
                  name="ratio"
                  label="倍率"
                  rules={[{ required: true, message: '请输入倍率' }]}
                  extra="保留两位小数"
                >
                  <InputNumber min={0.01} max={10} step={0.01} precision={2} style={{ width: '100%' }} />
                </Form.Item>
              </FormCol>
            </FormRow>
            <div className="form-switch-row">
              <div>
                <div className="switch-label">密钥创建中可见</div>
                <div className="switch-desc">开启后，创建密钥时可选择该分组</div>
              </div>
              <Form.Item name="visible" valuePropName="checked" noStyle>
                <Switch checkedChildren="可见" unCheckedChildren="隐藏" />
              </Form.Item>
            </div>
          </FormSection>
          <FormSection title="备注">
            <Form.Item name="remark" label="备注说明" style={{ marginBottom: 0 }}>
              <Input.TextArea rows={2} placeholder="选填，描述分组用途" />
            </Form.Item>
          </FormSection>
        </Form>
      </AppModal>
    </div>
  );
}
