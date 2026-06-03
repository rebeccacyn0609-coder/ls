/**
 * @name 模型定价管理
 */

import '../components/page.css';

import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Radio,
  Typography,
  Space,
  Popconfirm,
  message,
  Tag,
  Divider
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, MinusCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import {
  mockModels,
  mockChannels,
  formatChannelSummary,
  type ModelPricingItem,
  type ChannelPriceItem,
  type ChannelPriceConfigMode
} from '../components/mockData';
import { AppDrawer, FormSection, FormRow, FormCol } from '../components/FormLayout';
import { PageHeader } from '../components/PageHeader';
import { formatUnitPrice, roundUnitPrice, UNIT_PRICE_DECIMALS, UNIT_PRICE_STEP } from '../components/formatCny';

const MODEL_TYPES = [
  { value: 'vector', label: '向量模型' },
  { value: 'text', label: '文本模型' },
  { value: 'image', label: '图像生成' },
  { value: 'video', label: '视频生成' }
];

const OFFICIAL_PRICE_FIELDS: { name: keyof ModelPricingItem; label: string; required?: boolean; unit?: string }[] = [
  { name: 'inputPrice', label: '输入价格', required: true },
  { name: 'completionPrice', label: '输出价格' },
  { name: 'cacheWritePrice', label: '文本缓存写入价格' },
  { name: 'cacheReadPrice', label: '文本缓存输入命中价格' },
  { name: 'imageInputPrice', label: '图像输入价格' },
  { name: 'imageOutputPrice', label: '图像输出价格' },
  { name: 'imageCacheReadPrice', label: '图片缓存输入命中价格' },
  { name: 'audioInputPrice', label: '音频输入价格' },
  { name: 'audioOutputPrice', label: '音频输出价格' },
  { name: 'videoOutputPrice', label: '视频输出价格', unit: 'CNY / 1 Second' }
];

const CHANNEL_PRICE_FIELDS: { name: keyof ChannelPriceItem; label: string; required?: boolean }[] = [
  { name: 'inputPrice', label: '输入价格', required: true },
  { name: 'completionPrice', label: '输出价格' },
  { name: 'cacheWritePrice', label: '文本缓存写入价格' },
  { name: 'cacheReadPrice', label: '文本缓存输入命中价格' },
  { name: 'imageInputPrice', label: '图像输入价格' },
  { name: 'imageOutputPrice', label: '图像输出价格' },
  { name: 'imageCacheReadPrice', label: '图片缓存输入命中价格' },
  { name: 'audioInputPrice', label: '音频输入价格' },
  { name: 'audioOutputPrice', label: '音频输出价格' },
  { name: 'videoOutputPrice', label: '视频输出价格' }
];

const PRICE_CONFIG_OPTIONS: { value: ChannelPriceConfigMode; label: string }[] = [
  { value: 'discount', label: '折扣' },
  { value: 'custom', label: '自定义' }
];

const priceInputProps = {
  min: 0,
  step: UNIT_PRICE_STEP,
  precision: UNIT_PRICE_DECIMALS,
  style: { width: '100%' as const }
};

function getOfficialPrices(
  values: Record<string, unknown>,
  billingMode: 'token' | 'count'
): Partial<ModelPricingItem> {
  if (billingMode === 'count') {
    const v = values.perCallPrice;
    return typeof v === 'number' && !Number.isNaN(v) ? { perCallPrice: v } : {};
  }
  const official: Partial<ModelPricingItem> = {};
  for (const { name } of OFFICIAL_PRICE_FIELDS) {
    const val = values[name];
    if (typeof val === 'number' && !Number.isNaN(val)) {
      official[name] = val;
    }
  }
  return official;
}

function applyDiscountToChannelPrices(
  channelPrices: ChannelPriceItem[],
  official: Partial<ModelPricingItem>,
  billingMode: 'token' | 'count'
): ChannelPriceItem[] {
  return channelPrices.map((item) => {
    if (item.priceConfigMode !== 'discount') {
      return item;
    }
    const rate = item.discountRate;
    if (rate == null || Number.isNaN(rate)) {
      return item;
    }
    if (billingMode === 'count') {
      const officialVal = official.perCallPrice ?? 0;
      return { ...item, perCallPrice: roundUnitPrice(officialVal * rate) };
    }
    const computed: Partial<ChannelPriceItem> = {};
    for (const { name } of CHANNEL_PRICE_FIELDS) {
      const officialVal = (official[name] as number | undefined) ?? 0;
      computed[name] = roundUnitPrice(officialVal * rate);
    }
    return { ...item, ...computed };
  });
}

function channelPriceFilled(item: ChannelPriceItem, billingMode: 'token' | 'count'): boolean {
  if (!item.channelName && !item.channelId) return false;
  if (billingMode === 'count') {
    return item.perCallPrice != null && !Number.isNaN(item.perCallPrice);
  }
  return item.inputPrice != null && !Number.isNaN(item.inputPrice);
}

type ChannelPriceEntryProps = {
  listIndex: number;
  restField: { fieldKey?: number };
  channelOptions: { value: string; label: string }[];
  showRemove: boolean;
  onRemove: () => void;
  isLast: boolean;
  billingMode: 'token' | 'count';
};

function ChannelPriceEntry({
  listIndex,
  restField,
  channelOptions,
  showRemove,
  onRemove,
  isLast,
  billingMode
}: ChannelPriceEntryProps) {
  const form = Form.useFormInstance();
  const priceConfigMode =
    (Form.useWatch(['channelPrices', listIndex, 'priceConfigMode'], form) as ChannelPriceConfigMode | undefined) ??
    'custom';
  const discountRate = Form.useWatch(['channelPrices', listIndex, 'discountRate'], form) as number | undefined;
  const isDiscount = priceConfigMode === 'discount';
  const isCount = billingMode === 'count';

  const officialPerCall = Form.useWatch('perCallPrice', form);
  const officialInput = Form.useWatch('inputPrice', form);
  const officialCompletion = Form.useWatch('completionPrice', form);
  const officialCacheWrite = Form.useWatch('cacheWritePrice', form);
  const officialCacheRead = Form.useWatch('cacheReadPrice', form);
  const officialImageInput = Form.useWatch('imageInputPrice', form);
  const officialImageOutput = Form.useWatch('imageOutputPrice', form);
  const officialImageCacheRead = Form.useWatch('imageCacheReadPrice', form);
  const officialAudioInput = Form.useWatch('audioInputPrice', form);
  const officialAudioOutput = Form.useWatch('audioOutputPrice', form);
  const officialVideoOutput = Form.useWatch('videoOutputPrice', form);

  useEffect(() => {
    if (!isDiscount || discountRate == null || Number.isNaN(discountRate)) {
      return;
    }
    const rows = (form.getFieldValue('channelPrices') as ChannelPriceItem[] | undefined) ?? [];
    const current = rows[listIndex];
    if (!current) {
      return;
    }

    let patch: Partial<ChannelPriceItem>;
    if (isCount) {
      const nextPerCall = roundUnitPrice((officialPerCall ?? 0) * discountRate);
      if (current.perCallPrice === nextPerCall) {
        return;
      }
      patch = { perCallPrice: nextPerCall };
    } else {
      const officialByField: Record<string, number | undefined> = {
        inputPrice: officialInput,
        completionPrice: officialCompletion,
        cacheWritePrice: officialCacheWrite,
        cacheReadPrice: officialCacheRead,
        imageInputPrice: officialImageInput,
        imageOutputPrice: officialImageOutput,
        imageCacheReadPrice: officialImageCacheRead,
        audioInputPrice: officialAudioInput,
        audioOutputPrice: officialAudioOutput,
        videoOutputPrice: officialVideoOutput
      };
      patch = {};
      for (const { name } of CHANNEL_PRICE_FIELDS) {
        patch[name] = roundUnitPrice((officialByField[name] ?? 0) * discountRate);
      }
      const unchanged = CHANNEL_PRICE_FIELDS.every(({ name }) => current[name] === patch[name]);
      if (unchanged) {
        return;
      }
    }

    const nextRows = [...rows];
    nextRows[listIndex] = { ...current, ...patch };
    form.setFieldsValue({ channelPrices: nextRows });
  }, [
    isDiscount,
    isCount,
    discountRate,
    officialPerCall,
    officialInput,
    officialCompletion,
    officialCacheWrite,
    officialCacheRead,
    officialImageInput,
    officialImageOutput,
    officialImageCacheRead,
    officialAudioInput,
    officialAudioOutput,
    officialVideoOutput,
    form,
    listIndex
  ]);

  return (
    <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 8 }}>
      <FormRow>
        <FormCol>
          <Form.Item
            {...restField}
            name={[listIndex, 'channelId']}
            label="渠道来源"
            rules={[{ required: true, message: '请选择渠道' }]}
          >
            <Select placeholder="选择渠道名称" options={channelOptions} />
          </Form.Item>
        </FormCol>
        <FormCol>
          <Form.Item
            {...restField}
            name={[listIndex, 'priceConfigMode']}
            label="价格配置"
            initialValue="custom"
            rules={[{ required: true, message: '请选择价格配置' }]}
          >
            <Radio.Group options={PRICE_CONFIG_OPTIONS} optionType="button" buttonStyle="solid" />
          </Form.Item>
        </FormCol>
        {isDiscount && (
          <FormCol>
            <Form.Item
              {...restField}
              name={[listIndex, 'discountRate']}
              label="折扣系数"
              rules={[
                { required: true, message: '请输入折扣系数' },
                {
                  type: 'number',
                  min: 0,
                  max: 10,
                  message: '折扣系数需在 0～10 之间'
                }
              ]}
              extra={isCount ? '渠道每次价格 = 官方每次价格 × 折扣系数' : '渠道价 = 对应官方价 × 折扣系数'}
            >
              <InputNumber min={0} max={10} step={0.001} precision={3} style={{ width: '100%' }} placeholder="如 0.889" />
            </Form.Item>
          </FormCol>
        )}
        <FormCol>
          {showRemove && (
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingBottom: 24 }}>
              <Button type="text" danger icon={<MinusCircleOutlined />} onClick={onRemove}>
                移除
              </Button>
            </div>
          )}
        </FormCol>
      </FormRow>
      <FormRow>
        {isCount ? (
          <FormCol>
            <Form.Item
              {...restField}
              name={[listIndex, 'perCallPrice']}
              label="每次价格（CNY）"
              rules={
                !isDiscount ? [{ required: true, message: '请输入每次价格' }] : undefined
              }
            >
              <InputNumber
                {...priceInputProps}
                placeholder={isDiscount ? '按官方价自动计算' : '0.000000000'}
                disabled={isDiscount}
              />
            </Form.Item>
          </FormCol>
        ) : (
          CHANNEL_PRICE_FIELDS.map(({ name: fieldName, label, required }) => (
            <FormCol key={fieldName}>
              <Form.Item
                {...restField}
                name={[listIndex, fieldName]}
                label={label}
                rules={
                  !isDiscount && required
                    ? [{ required: true, message: `请输入${label}` }]
                    : undefined
                }
              >
                <InputNumber
                  {...priceInputProps}
                  placeholder={isDiscount ? '按官方价自动计算' : '0.000000000'}
                  disabled={isDiscount}
                />
              </Form.Item>
            </FormCol>
          ))
        )}
      </FormRow>
      {!isLast && <Divider style={{ margin: '8px 0 0' }} />}
    </div>
  );
}

export default function ModelPricingPage() {
  const [models, setModels] = useState(mockModels);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ModelPricingItem | null>(null);
  const [searchName, setSearchName] = useState('');
  const [form] = Form.useForm();
  const billingMode = (Form.useWatch('billingMode', form) as 'token' | 'count' | undefined) ?? 'token';

  const channelOptions = mockChannels.map((c) => ({ value: c.id, label: c.name }));

  const filteredModels = models.filter((m) =>
    !searchName.trim() || m.modelName.toLowerCase().includes(searchName.trim().toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ billingMode: 'token', tierPricing: false, channelPrices: [{ priceConfigMode: 'custom' }] });
    setDrawerOpen(true);
  };

  const openEdit = (record: ModelPricingItem) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      channelPrices:
        record.channelPrices.length > 0
          ? record.channelPrices.map((item) => ({
              ...item,
              priceConfigMode: item.priceConfigMode ?? 'custom'
            }))
          : [{ priceConfigMode: 'custom' }]
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const mode: 'token' | 'count' = values.billingMode ?? 'token';
    const official = getOfficialPrices(values, mode);
    const channelPrices = applyDiscountToChannelPrices(
      (values.channelPrices || [])
        .filter((item: ChannelPriceItem) => item?.channelId)
        .map((item: ChannelPriceItem) => ({
          ...item,
          priceConfigMode: item.priceConfigMode ?? 'custom',
          channelName: mockChannels.find((c) => c.id === item.channelId)?.name || item.channelName || ''
        })),
      official,
      mode
    );
    const payload = { ...values, channelPrices, tierPricing: values.tierPricing ?? false };
    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    if (editing) {
      setModels((prev) => prev.map((m) => (m.id === editing.id ? { ...m, ...payload, updatedAt: now } : m)));
      message.success('模型定价已更新');
    } else {
      setModels((prev) => [...prev, { id: `m${Date.now()}`, updatedAt: now, ...payload }]);
      message.success('模型定价已创建');
    }
    setDrawerOpen(false);
  };

  const columns: ColumnsType<ModelPricingItem> = [
    { title: '模型名称', dataIndex: 'modelName', width: 160 },
    {
      title: '模式',
      width: 90,
      render: (_, r) => <Tag>{r.billingMode === 'token' ? '按 Token' : '按次数'}</Tag>
    },
    {
      title: '官方价格摘要',
      width: 240,
      render: (_, r) =>
        r.billingMode === 'count' ? (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {formatUnitPrice(r.perCallPrice ?? 0)} / 次
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            输入 {formatUnitPrice(r.inputPrice ?? 0)} / 输出 {formatUnitPrice(r.completionPrice ?? 0)} (CNY / 1M Tokens)
          </Typography.Text>
        )
    },
    {
      title: '渠道商数量',
      width: 100,
      align: 'center',
      render: (_, r) => r.channelPrices.filter((c) => channelPriceFilled(c, r.billingMode)).length
    },
    {
      title: '渠道商摘要',
      dataIndex: 'channelPrices',
      width: 180,
      ellipsis: true,
      render: (prices: ChannelPriceItem[]) => formatChannelSummary(prices)
    },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      render: (_, record) => (
        <Space className="table-actions">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => setModels((p) => p.filter((m) => m.id !== record.id))}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="模型定价管理"
        description="管理模型价格，统一人民币计价；编辑时模型名称不可修改，支持同一模型下多组渠道商价格。"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增模型
          </Button>
        }
      />

      <Card bordered={false} className="page-card">
        <div className="page-toolbar" style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="模型名称模糊查询"
            allowClear
            style={{ width: 260 }}
            onSearch={setSearchName}
            onChange={(e) => !e.target.value && setSearchName('')}
          />
        </div>
        <div className="table-summary">
          共 <strong>{filteredModels.length}</strong> 个模型 · 单价统一 9 位小数（官方价/渠道价）
        </div>
        <Table rowKey="id" columns={columns} dataSource={filteredModels} scroll={{ x: 980 }} pagination={false} size="middle" />
      </Card>

      <AppDrawer
        title={editing ? '编辑模型定价' : '新增模型定价'}
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
                <Form.Item name="modelName" label="模型名称" rules={[{ required: true, message: '请输入模型名称' }]}>
                  <Input placeholder="如 gpt-4o" disabled={!!editing} />
                </Form.Item>
              </FormCol>
              <FormCol>
                <Form.Item name="modelType" label="模型类型" rules={[{ required: true, message: '请选择模型类型' }]}>
                  <Select placeholder="请选择" options={MODEL_TYPES} />
                </Form.Item>
              </FormCol>
            </FormRow>
            <FormRow>
              <FormCol>
                <Form.Item name="billingMode" label="计费模式" rules={[{ required: true }]}>
                  <Select options={[{ value: 'token', label: '按 Token' }, { value: 'count', label: '按次数' }]} />
                </Form.Item>
              </FormCol>
              <FormCol>
                <Form.Item name="tierPricing" label="阶梯价格">
                  <Radio.Group>
                    <Radio value={false}>否</Radio>
                    <Radio value={true} disabled>是（后续设计）</Radio>
                  </Radio.Group>
                </Form.Item>
              </FormCol>
            </FormRow>
            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={2} placeholder="选填" />
            </Form.Item>
          </FormSection>

          <FormSection
            title={
              billingMode === 'count'
                ? '官方价格管理（CNY）'
                : '官方价格管理（CNY / 1M Tokens）'
            }
          >
            {billingMode === 'count' ? (
              <FormRow>
                <FormCol>
                  <Form.Item
                    name="perCallPrice"
                    label="每次价格（CNY）"
                    rules={[{ required: true, message: '请输入每次价格' }]}
                    extra="单价保留 9 位小数"
                  >
                    <InputNumber {...priceInputProps} placeholder="0.000000000" />
                  </Form.Item>
                </FormCol>
              </FormRow>
            ) : (
              <FormRow>
                {OFFICIAL_PRICE_FIELDS.map(({ name, label, required, unit }) => (
                  <FormCol key={name}>
                    <Form.Item
                      name={name}
                      label={unit ? `${label} (${unit})` : label}
                      rules={required ? [{ required: true, message: `请输入${label}` }] : undefined}
                    >
                      <InputNumber {...priceInputProps} placeholder="0.000000000" />
                    </Form.Item>
                  </FormCol>
                ))}
              </FormRow>
            )}
          </FormSection>

          <FormSection title="渠道价格管理">
            <Form.List name="channelPrices">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }, index) => (
                    <ChannelPriceEntry
                      key={key}
                      listIndex={name}
                      restField={restField}
                      channelOptions={channelOptions}
                      showRemove={fields.length > 1}
                      onRemove={() => remove(name)}
                      isLast={index === fields.length - 1}
                      billingMode={billingMode}
                    />
                  ))}
                  <Button type="dashed" onClick={() => add({ priceConfigMode: 'custom' })} block icon={<PlusOutlined />}>
                    添加渠道价格
                  </Button>
                </>
              )}
            </Form.List>
          </FormSection>
        </Form>
      </AppDrawer>
    </div>
  );
}
