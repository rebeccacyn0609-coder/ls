/**
 * @name 模型定价管理
 */

import '../components/page.css';

import React, { useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
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
  Tabs,
  DatePicker,
  Descriptions,
  Row,
  Col
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ToolOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import {
  mockModels,
  mockChannels,
  formatChannelSummary,
  getEffectiveChannelPrices,
  getChannelPriceStatus,
  findPendingChannelPrice,
  mergeChannelPriceUpdates,
  validateSinglePendingPerChannel,
  sortChannelPricesByEffectiveDateDesc,
  sortChannelPricesByUpdatedAtDesc,
  CHANNEL_PRICE_STATUS_LABELS,
  type ModelPricingItem,
  type ChannelPriceItem,
  type ChannelPriceConfigMode,
  type ChannelPriceStatus
} from '../components/mockData';
import { AppDrawer, FormSection, FormRow, FormCol } from '../components/FormLayout';
import { PageHeader, FilterActions } from '../components/PageHeader';
import {
  formatUnitPrice,
  roundUnitPrice,
  roundDiscountRate,
  UNIT_PRICE_DECIMALS,
  UNIT_PRICE_STEP,
  DISCOUNT_RATE_DECIMALS
} from '../components/formatCny';

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

const priceInputProps = {
  min: 0,
  step: UNIT_PRICE_STEP,
  precision: UNIT_PRICE_DECIMALS,
  style: { width: '100%' as const }
};

const discountInputProps = {
  min: 0,
  step: 0.001,
  precision: DISCOUNT_RATE_DECIMALS,
  style: { width: '100%' as const }
};

const CHANNEL_OPTIONS = mockChannels.map((c) => ({ value: c.id, label: c.name }));
const CHANNEL_STATUS_FILTER_OPTIONS: { value: ChannelPriceStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: CHANNEL_PRICE_STATUS_LABELS.pending },
  { value: 'active', label: CHANNEL_PRICE_STATUS_LABELS.active },
  { value: 'expired', label: CHANNEL_PRICE_STATUS_LABELS.expired }
];
const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
/** 抽屉宽度：保证内部渠道价格列表尽量完整展示 */
const PRICING_DRAWER_WIDTH = 1080;
const TABLE_LIST_PAGINATION = {
  pageSize: 10,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
  pageSizeOptions: ['10', '20', '50', '100']
};

function formatNowDateTime() {
  return dayjs().format(DATETIME_FORMAT);
}

function formatChannelDateTime(value: unknown): string | undefined {
  if (!value) return undefined;
  if (dayjs.isDayjs(value)) return (value as Dayjs).format(DATETIME_FORMAT);
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

function createDefaultChannelPriceEntry() {
  return { priceConfigMode: 'discount' as ChannelPriceConfigMode, effectiveDate: dayjs() };
}

function createDefaultChannelPriceUpdateEntry() {
  return { priceConfigMode: 'discount' as ChannelPriceConfigMode, effectiveDate: dayjs().add(1, 'hour') };
}

function hasActiveChannelPrice(channelId: string, channelPrices: ChannelPriceItem[]) {
  return channelPrices.some(
    (item) => item.channelId === channelId && getChannelPriceStatus(item, channelPrices) === 'active'
  );
}

type ChannelPriceFormItem = {
  channelId?: string;
  priceConfigMode?: ChannelPriceConfigMode;
  discountRate?: number;
  perCallPrice?: number;
  effectiveDate?: Dayjs | string;
} & Partial<Record<keyof ModelPricingItem, number | undefined>>;

function applyDiscountToChannelPrices(
  official: Partial<ModelPricingItem>,
  billingMode: 'token' | 'count',
  discountRate: number
): Partial<ChannelPriceItem> {
  const rate = roundDiscountRate(discountRate);
  if (billingMode === 'count') {
    return { perCallPrice: roundUnitPrice((official.perCallPrice ?? 0) * rate) };
  }
  const result: Partial<ChannelPriceItem> = {};
  for (const { name } of OFFICIAL_PRICE_FIELDS) {
    const officialVal = official[name];
    if (typeof officialVal === 'number' && !Number.isNaN(officialVal)) {
      (result as Record<string, number>)[name] = roundUnitPrice(officialVal * rate);
    }
  }
  return result;
}

function buildChannelPriceRecord(
  item: ChannelPriceFormItem,
  official: Partial<ModelPricingItem>,
  billingMode: 'token' | 'count',
  effectiveDate: string
): ChannelPriceItem {
  const channel = mockChannels.find((c) => c.id === item.channelId);
  const mode: ChannelPriceConfigMode = item.priceConfigMode ?? 'custom';
  const base: ChannelPriceItem = {
    channelId: item.channelId!,
    channelName: channel?.name ?? '',
    priceConfigMode: mode,
    discountRate: mode === 'discount' ? roundDiscountRate(item.discountRate ?? 0) : undefined,
    effectiveDate,
    updatedAt: formatNowDateTime()
  };
  if (mode === 'discount') {
    return { ...base, ...applyDiscountToChannelPrices(official, billingMode, item.discountRate ?? 0) };
  }
  if (billingMode === 'count') {
    const perCallPrice = typeof item.perCallPrice === 'number' ? roundUnitPrice(item.perCallPrice) : undefined;
    return { ...base, perCallPrice };
  }
  const custom: Partial<ChannelPriceItem> = {};
  for (const { name } of OFFICIAL_PRICE_FIELDS) {
    const val = item[name];
    if (typeof val === 'number' && !Number.isNaN(val)) {
      (custom as Record<string, number>)[name] = roundUnitPrice(val);
    }
  }
  return { ...base, ...custom };
}

function buildChannelPricesFromForm(
  items: ChannelPriceFormItem[] | undefined,
  official: Partial<ModelPricingItem>,
  billingMode: 'token' | 'count',
  existingChannelPrices: ChannelPriceItem[] = []
): ChannelPriceItem[] {
  if (!items?.length) return [...existingChannelPrices];
  let result = [...existingChannelPrices];

  for (const item of items.filter((row) => row.channelId)) {
    const formEffective = formatChannelDateTime(item.effectiveDate) ?? formatNowDateTime();
    const record = buildChannelPriceRecord(item, official, billingMode, formEffective);
    result = mergeChannelPriceUpdates(result, [record]);
  }
  return result;
}

function ChannelPriceEntry({
  listField,
  listName,
  billingMode,
  form,
  existingChannelPrices = [],
  requireFutureEffective = false,
  hideRemove = false,
  channelIdDisabled = false,
  officialPriceSource,
  onRemove
}: {
  listField: { key: React.Key; name: number };
  listName: 'channelPrices' | 'channelPriceUpdates' | 'priceMaintain' | 'channelTabEdit';
  billingMode: 'token' | 'count';
  form: ReturnType<typeof Form.useForm>[0];
  existingChannelPrices?: ChannelPriceItem[];
  requireFutureEffective?: boolean;
  hideRemove?: boolean;
  channelIdDisabled?: boolean;
  officialPriceSource?: ModelPricingItem;
  onRemove: () => void;
}) {
  const formValues = Form.useWatch([], form);
  const listWatch = Form.useWatch(listName, form) as ChannelPriceFormItem[] | undefined;
  const selectedChannelId = Form.useWatch([listName, listField.name, 'channelId'], form) as string | undefined;
  const priceConfigMode = (Form.useWatch([listName, listField.name, 'priceConfigMode'], form) as ChannelPriceConfigMode | undefined) ?? 'discount';
  const discountRate = Form.useWatch([listName, listField.name, 'discountRate'], form) as number | undefined;

  const channelPriceContext = useMemo(() => {
    let context = [...existingChannelPrices];
    if (!listWatch) return context;

    for (let i = 0; i < listWatch.length; i++) {
      if (i === listField.name) continue;
      const row = listWatch[i];
      if (!row.channelId) continue;
      const channel = mockChannels.find((c) => c.id === row.channelId);
      const effectiveDate = formatChannelDateTime(row.effectiveDate) ?? formatNowDateTime();
      const pseudo: ChannelPriceItem = {
        channelId: row.channelId,
        channelName: channel?.name ?? '',
        effectiveDate
      };
      context = mergeChannelPriceUpdates(context, [pseudo]);
    }
    return context;
  }, [existingChannelPrices, listWatch, listField.name]);

  const mustSchedulePending = useMemo(() => {
    if (!selectedChannelId) return requireFutureEffective;
    return requireFutureEffective || hasActiveChannelPrice(selectedChannelId, channelPriceContext);
  }, [selectedChannelId, channelPriceContext, requireFutureEffective]);

  const existingPending = useMemo(() => {
    if (!selectedChannelId) return undefined;
    return findPendingChannelPrice(selectedChannelId, channelPriceContext);
  }, [selectedChannelId, channelPriceContext]);

  const official = useMemo(
    () => (
      officialPriceSource
        ? getOfficialPrices(officialPriceSource, billingMode)
        : getOfficialPrices(formValues ?? {}, billingMode)
    ),
    [officialPriceSource, formValues, billingMode]
  );
  const computedPrices = useMemo(() => {
    if (priceConfigMode !== 'discount' || discountRate == null || Number.isNaN(discountRate)) {
      return {} as Partial<ChannelPriceItem>;
    }
    return applyDiscountToChannelPrices(official, billingMode, discountRate);
  }, [priceConfigMode, discountRate, official, billingMode]);

  return (
    <div className="channel-price-entry" style={{ marginBottom: 16, padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Typography.Text strong>
          {listName === 'channelPriceUpdates'
            ? '价格更新'
            : listName === 'priceMaintain' || listName === 'channelTabEdit'
              ? '渠道价格配置'
              : `渠道价格 #${listField.name + 1}`}
        </Typography.Text>
        {!hideRemove ? (
          <Button type="link" danger size="small" onClick={onRemove}>删除</Button>
        ) : null}
      </div>
      <FormRow>
        <FormCol>
          <Form.Item
            name={[listField.name, 'channelId']}
            label="渠道来源"
            rules={[{ required: true, message: '请选择渠道来源' }]}
            extra={
              existingPending && !channelIdDisabled
                ? '该渠道已有待生效价格，保存后将替换（同一模型同一渠道仅允许一条待生效）'
                : undefined
            }
          >
            <Select
              placeholder="请选择渠道"
              options={CHANNEL_OPTIONS}
              showSearch
              optionFilterProp="label"
              disabled={channelIdDisabled}
            />
          </Form.Item>
        </FormCol>
        <FormCol>
          <Form.Item
            name={[listField.name, 'priceConfigMode']}
            label="价格配置方式"
            initialValue="discount"
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Radio value="discount">折扣</Radio>
              <Radio value="custom">自定义</Radio>
            </Radio.Group>
          </Form.Item>
        </FormCol>
      </FormRow>

      <FormRow>
        <FormCol>
          <Form.Item
            name={[listField.name, 'effectiveDate']}
            label="生效日期"
            rules={[
              { required: true, message: '请选择生效日期' },
              {
                validator: async (_, value) => {
                  if (!mustSchedulePending || !value) return;
                  const effective = dayjs.isDayjs(value) ? value : dayjs(value);
                  if (!effective.isValid() || !effective.isAfter(dayjs())) {
                    throw new Error('该渠道已有生效中价格，请设置未来生效时间（待生效）');
                  }
                }
              }
            ]}
            extra={
              mustSchedulePending
                ? '该渠道已有生效中价格，新价格须待生效；同渠道仅允许一条待生效记录'
                : '精确到秒，默认立即生效；状态仅依据生效日期与当前时间判断'
            }
          >
            <DatePicker
              showTime
              format={DATETIME_FORMAT}
              style={{ width: '100%' }}
              placeholder={mustSchedulePending ? '未来生效时间' : '立即生效'}
              disabledDate={mustSchedulePending ? (current) => !!current && current.isBefore(dayjs(), 'day') : undefined}
            />
          </Form.Item>
        </FormCol>
      </FormRow>

      {priceConfigMode === 'discount' ? (
        <FormRow>
          <FormCol>
            <Form.Item
              name={[listField.name, 'discountRate']}
              label="折扣系数"
              rules={[{ required: true, message: '请输入折扣系数' }]}
              extra={`保留 ${DISCOUNT_RATE_DECIMALS} 位小数，如 0.889`}
            >
              <InputNumber {...discountInputProps} placeholder="0.889" />
            </Form.Item>
          </FormCol>
        </FormRow>
      ) : null}

      {billingMode === 'count' ? (
        <FormRow>
          <FormCol>
            {priceConfigMode === 'discount' ? (
              <Form.Item label="每次价格（CNY）" extra="根据官方每次价格 × 折扣系数自动计算">
                <InputNumber
                  {...priceInputProps}
                  value={computedPrices.perCallPrice}
                  disabled
                  placeholder="—"
                />
              </Form.Item>
            ) : (
              <Form.Item
                name={[listField.name, 'perCallPrice']}
                label="每次价格（CNY）"
                rules={[{ required: true, message: '请输入每次价格' }]}
                extra="单价保留 9 位小数"
              >
                <InputNumber {...priceInputProps} placeholder="0.000000000" />
              </Form.Item>
            )}
          </FormCol>
        </FormRow>
      ) : (
        <FormRow>
          {OFFICIAL_PRICE_FIELDS.map(({ name, label, required, unit }) => {
            const fieldLabel = unit ? `${label} (${unit})` : label;
            if (priceConfigMode === 'discount') {
              const computed = computedPrices[name as keyof ChannelPriceItem] as number | undefined;
              return (
                <FormCol key={name}>
                  <Form.Item label={fieldLabel} extra="官方价 × 折扣系数">
                    <InputNumber
                      {...priceInputProps}
                      value={computed}
                      disabled
                      placeholder="—"
                    />
                  </Form.Item>
                </FormCol>
              );
            }
            return (
              <FormCol key={name}>
                <Form.Item
                  name={[listField.name, name]}
                  label={fieldLabel}
                  rules={required ? [{ required: true, message: `请输入${label}` }] : undefined}
                >
                  <InputNumber {...priceInputProps} placeholder="0.000000000" />
                </Form.Item>
              </FormCol>
            );
          })}
        </FormRow>
      )}
    </div>
  );
}

type ChannelPriceRow = ChannelPriceItem & {
  rowKey: string;
  modelId: string;
  modelName: string;
  billingMode: 'token' | 'count';
  modelChannelPrices: ChannelPriceItem[];
};

function formatPriceCell(value?: number) {
  if (value == null || Number.isNaN(value)) return '—';
  return formatUnitPrice(value);
}

function formatPriceConfigLabel(item: ChannelPriceItem) {
  if (item.priceConfigMode === 'discount') {
    const rate = item.discountRate != null ? `（${item.discountRate}）` : '';
    return `折扣${rate}`;
  }
  return '自定义';
}

const CHANNEL_PRICE_STATUS_COLORS: Record<ChannelPriceStatus, string> = {
  expired: 'default',
  active: 'success',
  pending: 'processing'
};

function renderChannelPriceStatus(item: ChannelPriceItem, channelPrices: ChannelPriceItem[]) {
  const status = getChannelPriceStatus(item, channelPrices);
  return (
    <Tag color={CHANNEL_PRICE_STATUS_COLORS[status]}>
      {CHANNEL_PRICE_STATUS_LABELS[status]}
    </Tag>
  );
}

function formatEffectiveDateCell(value?: string) {
  if (!value?.trim()) return '—';
  return value;
}

function formatChannelPriceSummary(row: ChannelPriceRow) {
  if (row.billingMode === 'count') {
    return (
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        每次 {formatUnitPrice(row.perCallPrice ?? 0)}
      </Typography.Text>
    );
  }
  return (
    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
      输入 {formatUnitPrice(row.inputPrice ?? 0)} / 输出 {formatUnitPrice(row.completionPrice ?? 0)}
    </Typography.Text>
  );
}

function channelItemToFormItem(item: ChannelPriceItem): ChannelPriceFormItem {
  return {
    ...item,
    effectiveDate: item.effectiveDate ? dayjs(item.effectiveDate) : dayjs()
  };
}

function replaceChannelPriceItem(
  model: ModelPricingItem,
  match: { channelId: string; effectiveDate?: string },
  next: ChannelPriceItem
): ModelPricingItem {
  return {
    ...model,
    channelPrices: model.channelPrices.map((item) => (
      item.channelId === match.channelId && item.effectiveDate === match.effectiveDate ? next : item
    ))
  };
}

function removeChannelPriceItem(
  model: ModelPricingItem,
  match: { channelId: string; effectiveDate: string }
): ModelPricingItem {
  return {
    ...model,
    channelPrices: model.channelPrices.filter(
      (item) => !(item.channelId === match.channelId && item.effectiveDate === match.effectiveDate)
    )
  };
}

function getModelById(models: ModelPricingItem[], modelId: string) {
  return models.find((m) => m.id === modelId);
}

function flattenChannelPrices(models: ModelPricingItem[]): ChannelPriceRow[] {
  return models.flatMap((model) =>
    model.channelPrices.map((item, index) => ({
      ...item,
      rowKey: `${model.id}-${item.channelId}-${index}`,
      modelId: model.id,
      modelName: model.modelName,
      billingMode: model.billingMode,
      modelChannelPrices: model.channelPrices
    }))
  );
}

function buildActiveChannelPriceRows(model: ModelPricingItem): ChannelPriceRow[] {
  const channelPrices = model.channelPrices ?? [];
  return getEffectiveChannelPrices(channelPrices).map((item, index) => ({
    ...item,
    rowKey: `${model.id}-${item.channelId}-active-${index}`,
    modelId: model.id,
    modelName: model.modelName,
    billingMode: model.billingMode,
    modelChannelPrices: channelPrices
  }));
}

type ChannelPriceColumnOptions = {
  showModel?: boolean;
  showStatus?: boolean;
  showUpdatedAt?: boolean;
  variant?: 'full' | 'compact';
  showActions?: boolean;
  onDetail?: (row: ChannelPriceRow) => void;
  onEdit?: (row: ChannelPriceRow) => void;
  onDelete?: (row: ChannelPriceRow) => void;
};

function buildChannelPriceColumns(options: ChannelPriceColumnOptions = {}): ColumnsType<ChannelPriceRow> {
  const {
    showModel = true,
    showStatus = false,
    showUpdatedAt = false,
    variant = 'full',
    showActions = false,
    onDetail,
    onEdit,
    onDelete
  } = options;
  const cols: ColumnsType<ChannelPriceRow> = [];

  if (showModel) {
    cols.push(
      { title: '模型名称', dataIndex: 'modelName', width: 140, fixed: 'left' },
      {
        title: '计费模式',
        width: 96,
        render: (_, row) => <Tag>{row.billingMode === 'token' ? '按 Token' : '按次'}</Tag>
      }
    );
  }

  cols.push(
    { title: '渠道来源', dataIndex: 'channelName', width: 140, fixed: showModel ? undefined : 'left' },
    {
      title: '价格配置',
      width: 120,
      render: (_, row) => formatPriceConfigLabel(row)
    }
  );

  if (showStatus) {
    cols.push({
      title: '状态',
      width: 96,
      render: (_, row) => renderChannelPriceStatus(row, row.modelChannelPrices)
    });
  }

  cols.push({
    title: '生效日期',
    dataIndex: 'effectiveDate',
    width: 172,
    render: (value: string) => formatEffectiveDateCell(value)
  });

  if (variant === 'compact') {
    cols.push({
      title: '价格摘要',
      width: 240,
      render: (_, row) => formatChannelPriceSummary(row)
    });
  } else {
    cols.push(
      {
        title: '每次价格',
        width: 120,
        align: 'right',
        render: (_, row) => (row.billingMode === 'count' ? formatPriceCell(row.perCallPrice) : '—')
      },
      {
        title: '输入价格',
        width: 120,
        align: 'right',
        render: (_, row) => (row.billingMode === 'token' ? formatPriceCell(row.inputPrice) : '—')
      },
      {
        title: '输出价格',
        width: 120,
        align: 'right',
        render: (_, row) => (row.billingMode === 'token' ? formatPriceCell(row.completionPrice) : '—')
      },
      {
        title: '文本缓存写入价格',
        width: 140,
        align: 'right',
        render: (_, row) => (row.billingMode === 'token' ? formatPriceCell(row.cacheWritePrice) : '—')
      },
      {
        title: '文本缓存输入命中价格',
        width: 160,
        align: 'right',
        render: (_, row) => (row.billingMode === 'token' ? formatPriceCell(row.cacheReadPrice) : '—')
      },
      {
        title: '图像输入价格',
        width: 120,
        align: 'right',
        render: (_, row) => (row.billingMode === 'token' ? formatPriceCell(row.imageInputPrice) : '—')
      },
      {
        title: '图像输出价格',
        width: 120,
        align: 'right',
        render: (_, row) => (row.billingMode === 'token' ? formatPriceCell(row.imageOutputPrice) : '—')
      },
      {
        title: '图片缓存输入命中价格',
        width: 140,
        align: 'right',
        render: (_, row) => (row.billingMode === 'token' ? formatPriceCell(row.imageCacheReadPrice) : '—')
      },
      {
        title: '音频输入价格',
        width: 120,
        align: 'right',
        render: (_, row) => (row.billingMode === 'token' ? formatPriceCell(row.audioInputPrice) : '—')
      },
      {
        title: '音频输出价格',
        width: 120,
        align: 'right',
        render: (_, row) => (row.billingMode === 'token' ? formatPriceCell(row.audioOutputPrice) : '—')
      },
      {
        title: '视频输出价格',
        width: 120,
        align: 'right',
        render: (_, row) => (row.billingMode === 'token' ? formatPriceCell(row.videoOutputPrice) : '—')
      }
    );
  }

  if (showUpdatedAt) {
    cols.push({
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 168,
      render: (value: string) => value || '—'
    });
  }

  if (showActions) {
    cols.push({
      title: '操作',
      width: 132,
      fixed: 'right',
      render: (_, row) => {
        const status = getChannelPriceStatus(row, row.modelChannelPrices);
        if (status === 'pending') {
          return (
            <Space className="table-actions" wrap size={0}>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit?.(row)}>
                编辑
              </Button>
              <Popconfirm
                title="确定删除该待生效价格？"
                description="删除后不可恢复"
                onConfirm={() => onDelete?.(row)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </Space>
          );
        }
        return (
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onDetail?.(row)}>
            详情
          </Button>
        );
      }
    });
  }

  return cols;
}

function ModelBasicInfoReadOnly({ model }: { model: ModelPricingItem }) {
  const typeLabel = MODEL_TYPES.find((t) => t.value === model.modelType)?.label ?? model.modelType;
  const modeLabel = model.billingMode === 'token' ? '按 Token' : '按次数';
  return (
    <Descriptions column={2} size="small" bordered className="model-info-readonly">
      <Descriptions.Item label="模型名称">{model.modelName}</Descriptions.Item>
      <Descriptions.Item label="模型类型">{typeLabel}</Descriptions.Item>
      <Descriptions.Item label="计费模式">{modeLabel}</Descriptions.Item>
      <Descriptions.Item label="阶梯价格">{model.tierPricing ? '是' : '否'}</Descriptions.Item>
      {model.remark ? (
        <Descriptions.Item label="备注" span={2}>{model.remark}</Descriptions.Item>
      ) : null}
    </Descriptions>
  );
}

function ChannelPriceFullReadOnly({
  item,
  billingMode,
  channelPrices
}: {
  item: ChannelPriceItem;
  billingMode: 'token' | 'count';
  channelPrices: ChannelPriceItem[];
}) {
  return (
    <Descriptions column={2} size="small" bordered className="channel-price-detail-readonly">
      <Descriptions.Item label="渠道来源">{item.channelName}</Descriptions.Item>
      <Descriptions.Item label="状态">
        {renderChannelPriceStatus(item, channelPrices)}
      </Descriptions.Item>
      <Descriptions.Item label="价格配置">{formatPriceConfigLabel(item)}</Descriptions.Item>
      <Descriptions.Item label="生效日期">{formatEffectiveDateCell(item.effectiveDate)}</Descriptions.Item>
      {billingMode === 'count' ? (
        <Descriptions.Item label="每次价格（CNY）" span={2}>
          {formatUnitPrice(item.perCallPrice ?? 0)}
        </Descriptions.Item>
      ) : (
        OFFICIAL_PRICE_FIELDS.map(({ name, label }) => {
          const value = item[name as keyof ChannelPriceItem];
          if (typeof value !== 'number' || Number.isNaN(value)) return null;
          return (
            <Descriptions.Item key={name} label={label}>
              {formatUnitPrice(value)}
            </Descriptions.Item>
          );
        })
      )}
    </Descriptions>
  );
}

function OfficialPriceReadOnly({ model }: { model: ModelPricingItem }) {
  if (model.billingMode === 'count') {
    return (
      <Descriptions column={1} size="small" bordered className="official-price-readonly">
        <Descriptions.Item label="每次价格（CNY）">
          {formatUnitPrice(model.perCallPrice ?? 0)}
        </Descriptions.Item>
      </Descriptions>
    );
  }
  return (
    <Descriptions column={2} size="small" bordered className="official-price-readonly">
      {OFFICIAL_PRICE_FIELDS.map(({ name, label }) => {
        const value = model[name];
        if (value == null || Number.isNaN(value)) return null;
        return (
          <Descriptions.Item key={name} label={label}>
            {formatUnitPrice(value as number)}
          </Descriptions.Item>
        );
      })}
    </Descriptions>
  );
}

function ChannelPriceStatusReference({
  channelId,
  channelPrices,
  billingMode
}: {
  channelId?: string;
  channelPrices: ChannelPriceItem[];
  billingMode: 'token' | 'count';
}) {
  const rows = useMemo(() => {
    if (!channelId) return [];
    return channelPrices
      .filter((item) => item.channelId === channelId)
      .map((item, index) => ({
        ...item,
        rowKey: `${channelId}-ref-${index}`,
        modelId: '',
        modelName: '',
        billingMode,
        modelChannelPrices: channelPrices
      }));
  }, [channelId, channelPrices, billingMode]);

  if (!channelId) {
    return (
      <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 16 }}>
        选择渠道来源后，将展示该渠道在本模型下的价格状态记录。
      </Typography.Paragraph>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
        该渠道价格状态
      </Typography.Text>
      <ChannelPriceViewTable
        dataSource={rows}
        showModel={false}
        showStatus
        variant="compact"
        emptyText="该渠道暂无价格记录，保存后将新增"
      />
    </div>
  );
}

function ChannelPriceViewTable({
  dataSource,
  showModel = true,
  showStatus = false,
  showUpdatedAt = false,
  variant = 'full',
  showActions = false,
  sortBy = 'effectiveDate',
  onDetail,
  onEdit,
  onDelete,
  paginated = false,
  paginationKey,
  emptyText = '暂无渠道价格数据'
}: {
  dataSource: ChannelPriceRow[];
  showModel?: boolean;
  showStatus?: boolean;
  showUpdatedAt?: boolean;
  variant?: 'full' | 'compact';
  showActions?: boolean;
  sortBy?: 'effectiveDate' | 'updatedAt';
  onDetail?: (row: ChannelPriceRow) => void;
  onEdit?: (row: ChannelPriceRow) => void;
  onDelete?: (row: ChannelPriceRow) => void;
  paginated?: boolean;
  paginationKey?: string;
  emptyText?: string;
}) {
  const columns = useMemo(
    () => buildChannelPriceColumns({
      showModel,
      showStatus,
      showUpdatedAt,
      variant,
      showActions,
      onDetail,
      onEdit,
      onDelete
    }),
    [showModel, showStatus, showUpdatedAt, variant, showActions, onDetail, onEdit, onDelete]
  );
  const sortedDataSource = useMemo(() => {
    if (sortBy === 'updatedAt') return sortChannelPricesByUpdatedAtDesc(dataSource);
    return sortChannelPricesByEffectiveDateDesc(dataSource);
  }, [dataSource, sortBy]);

  const scrollX = showActions
    ? (showUpdatedAt ? 1312 : 1144)
    : variant === 'compact'
      ? (showModel ? 980 : 860) + (showUpdatedAt ? 168 : 0)
      : (showModel ? 2200 : showStatus ? 2100 : 2000) + (showUpdatedAt ? 168 : 0);

  return (
    <Table
      key={paginationKey}
      rowKey="rowKey"
      columns={columns}
      dataSource={sortedDataSource}
      scroll={{ x: scrollX }}
      pagination={paginated ? TABLE_LIST_PAGINATION : false}
      size="middle"
      locale={{ emptyText }}
    />
  );
}

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

export default function ModelPricingPage() {
  const [models, setModels] = useState(mockModels);
  const [activeTab, setActiveTab] = useState('official');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [maintainDrawerOpen, setMaintainDrawerOpen] = useState(false);
  const [channelDetailOpen, setChannelDetailOpen] = useState(false);
  const [channelEditOpen, setChannelEditOpen] = useState(false);
  const [editing, setEditing] = useState<ModelPricingItem | null>(null);
  const [maintaining, setMaintaining] = useState<ModelPricingItem | null>(null);
  const [channelDetailRow, setChannelDetailRow] = useState<ChannelPriceRow | null>(null);
  const [channelEditRow, setChannelEditRow] = useState<ChannelPriceRow | null>(null);
  const [appliedOfficialKeyword, setAppliedOfficialKeyword] = useState('');
  const [appliedChannelKeyword, setAppliedChannelKeyword] = useState('');
  const [appliedChannelStatus, setAppliedChannelStatus] = useState<ChannelPriceStatus | 'all'>('all');
  const [officialFilterForm] = Form.useForm();
  const [channelFilterForm] = Form.useForm();
  const [form] = Form.useForm();
  const [maintainForm] = Form.useForm();
  const [channelEditForm] = Form.useForm();
  const billingMode = (Form.useWatch('billingMode', form) as 'token' | 'count' | undefined) ?? 'token';
  const maintainSelectedChannelId = Form.useWatch(['priceMaintain', 0, 'channelId'], maintainForm) as string | undefined;
  const channelEditSelectedChannelId = Form.useWatch(['channelTabEdit', 0, 'channelId'], channelEditForm) as string | undefined;

  const channelDetailModel = useMemo(
    () => (channelDetailRow ? getModelById(models, channelDetailRow.modelId) : null),
    [channelDetailRow, models]
  );
  const channelEditModel = useMemo(
    () => (channelEditRow ? getModelById(models, channelEditRow.modelId) : null),
    [channelEditRow, models]
  );
  const editingModel = useMemo(
    () => (editing ? getModelById(models, editing.id) ?? editing : null),
    [editing, models]
  );
  const editingActiveChannelRows = useMemo(
    () => (editingModel ? buildActiveChannelPriceRows(editingModel) : []),
    [editingModel]
  );

  const filteredModels = models.filter((m) =>
    !appliedOfficialKeyword.trim()
    || m.modelName.toLowerCase().includes(appliedOfficialKeyword.trim().toLowerCase())
  );

  const allChannelRows = useMemo(() => flattenChannelPrices(models), [models]);

  const filteredChannelRows = useMemo(() => {
    const keyword = appliedChannelKeyword.trim().toLowerCase();
    return allChannelRows.filter((row) => {
      const matchKeyword = !keyword
        || row.modelName.toLowerCase().includes(keyword)
        || row.channelName.toLowerCase().includes(keyword);
      const status = getChannelPriceStatus(row, row.modelChannelPrices);
      const matchStatus = appliedChannelStatus === 'all' || status === appliedChannelStatus;
      return matchKeyword && matchStatus;
    });
  }, [allChannelRows, appliedChannelKeyword, appliedChannelStatus]);

  const handleOfficialSearch = () => {
    const { modelName } = officialFilterForm.getFieldsValue();
    setAppliedOfficialKeyword(modelName?.trim() || '');
    message.success('查询完成');
  };

  const handleOfficialReset = () => {
    officialFilterForm.resetFields();
    setAppliedOfficialKeyword('');
    message.info('筛选条件已重置');
  };

  const handleChannelSearch = () => {
    const { keyword, status } = channelFilterForm.getFieldsValue();
    setAppliedChannelKeyword(keyword?.trim() || '');
    setAppliedChannelStatus(status ?? 'all');
    message.success('查询完成');
  };

  const handleChannelReset = () => {
    channelFilterForm.resetFields();
    channelFilterForm.setFieldsValue({ status: 'all' });
    setAppliedChannelKeyword('');
    setAppliedChannelStatus('all');
    message.info('筛选条件已重置');
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ billingMode: 'token', tierPricing: false, channelPrices: [] });
    setDrawerOpen(true);
  };

  const openEdit = (record: ModelPricingItem) => {
    setEditing(record);
    form.setFieldsValue({ ...record });
    setDrawerOpen(true);
  };

  const openChannelDetail = (row: ChannelPriceRow) => {
    setChannelDetailRow(row);
    setChannelDetailOpen(true);
  };

  const openChannelEdit = (row: ChannelPriceRow) => {
    const model = getModelById(models, row.modelId);
    if (!model) return;
    if (getChannelPriceStatus(row, row.modelChannelPrices) !== 'pending') {
      message.warning('仅待生效记录支持编辑');
      return;
    }
    setChannelEditRow(row);
    channelEditForm.resetFields();
    channelEditForm.setFieldsValue({
      channelTabEdit: [channelItemToFormItem(row)]
    });
    setChannelEditOpen(true);
  };

  const openPriceMaintain = (record: ModelPricingItem) => {
    setMaintaining(record);
    maintainForm.resetFields();
    const hasAnyActive = record.channelPrices.some(
      (item) => getChannelPriceStatus(item, record.channelPrices) === 'active'
    );
    maintainForm.setFieldsValue({
      priceMaintain: [hasAnyActive ? createDefaultChannelPriceUpdateEntry() : createDefaultChannelPriceEntry()]
    });
    setMaintainDrawerOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const mode: 'token' | 'count' = values.billingMode ?? 'token';
    const official = getOfficialPrices(values, mode);
    const channelPrices = editing
      ? (editing.channelPrices ?? [])
      : buildChannelPricesFromForm(
        values.channelPrices as ChannelPriceFormItem[] | undefined,
        official,
        mode,
        []
      );
    const payload = {
      ...values,
      ...official,
      channelPrices,
      tierPricing: values.tierPricing ?? false
    };
    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    if (editing) {
      setModels((prev) => prev.map((m) => (m.id === editing.id ? { ...m, ...payload, updatedAt: now } : m)));
      message.success('官方价格已更新');
    } else {
      const pendingError = validateSinglePendingPerChannel(channelPrices);
      if (pendingError) {
        message.error(pendingError);
        return;
      }
      setModels((prev) => [...prev, { id: `m${Date.now()}`, updatedAt: now, ...payload }]);
      if (channelPrices.length > 0) {
        message.success(`模型已创建，${channelPrices.length} 条渠道价格已同步至「渠道价格管理」`);
      } else {
        message.success('模型官方价格已创建');
      }
    }
    setDrawerOpen(false);
  };

  const handleMaintainSave = async () => {
    if (!maintaining) return;
    const values = await maintainForm.validateFields();
    const items = values.priceMaintain as ChannelPriceFormItem[] | undefined;
    const item = items?.find((i) => i.channelId);
    if (item?.channelId) {
      const effective = formatChannelDateTime(item.effectiveDate);
      const isPending = effective != null && dayjs(effective).isAfter(dayjs());
      const existingPending = findPendingChannelPrice(item.channelId, maintaining.channelPrices ?? []);
      if (isPending && existingPending && existingPending.effectiveDate !== effective) {
        message.info('该渠道已有待生效价格，保存后将替换原记录');
      }
    }
    const official = getOfficialPrices(maintaining, maintaining.billingMode);
    const channelPrices = buildChannelPricesFromForm(
      items,
      official,
      maintaining.billingMode,
      maintaining.channelPrices ?? []
    );
    const pendingError = validateSinglePendingPerChannel(channelPrices);
    if (pendingError) {
      message.error(pendingError);
      return;
    }
    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    setModels((prev) => prev.map((m) => (
      m.id === maintaining.id ? { ...m, channelPrices, updatedAt: now } : m
    )));
    const submitted = items?.filter((i) => i.channelId)?.length ?? 0;
    message.success(
      submitted > 0
        ? '渠道价格已保存，已同步至「渠道价格管理」'
        : '未提交渠道价格变更'
    );
    setMaintainDrawerOpen(false);
  };

  const handleChannelEditSave = async () => {
    if (!channelEditRow || !channelEditModel) return;
    const values = await channelEditForm.validateFields();
    const items = values.channelTabEdit as ChannelPriceFormItem[] | undefined;
    const item = items?.[0];
    if (!item?.channelId) return;

    const effective = formatChannelDateTime(item.effectiveDate);
    if (!effective || !dayjs(effective).isAfter(dayjs())) {
      message.error('待生效价格须设置未来生效时间');
      return;
    }

    const official = getOfficialPrices(channelEditModel, channelEditModel.billingMode);
    const record = buildChannelPriceRecord(
      item,
      official,
      channelEditModel.billingMode,
      effective
    );

    const otherPending = (channelEditModel.channelPrices ?? []).filter(
      (p) =>
        p.channelId === item.channelId
        && getChannelPriceStatus(p, channelEditModel.channelPrices) === 'pending'
        && p.effectiveDate !== channelEditRow.effectiveDate
    );
    if (otherPending.length > 0) {
      message.error(`同一模型、同一渠道「${record.channelName}」仅允许存在一条待生效价格`);
      return;
    }

    const channelPrices = replaceChannelPriceItem(
      channelEditModel,
      { channelId: channelEditRow.channelId, effectiveDate: channelEditRow.effectiveDate },
      record
    ).channelPrices;

    const pendingError = validateSinglePendingPerChannel(channelPrices);
    if (pendingError) {
      message.error(pendingError);
      return;
    }

    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    setModels((prev) => prev.map((m) => (
      m.id === channelEditModel.id ? { ...m, channelPrices, updatedAt: now } : m
    )));
    message.success('待生效渠道价格已更新');
    setChannelEditOpen(false);
  };

  const handleChannelDelete = (row: ChannelPriceRow) => {
    if (getChannelPriceStatus(row, row.modelChannelPrices) !== 'pending') {
      message.warning('仅待生效记录支持删除');
      return;
    }
    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    setModels((prev) => prev.map((m) => {
      if (m.id !== row.modelId) return m;
      return { ...removeChannelPriceItem(m, { channelId: row.channelId, effectiveDate: row.effectiveDate }), updatedAt: now };
    }));
    message.success('待生效渠道价格已删除');
  };

  const officialColumns: ColumnsType<ModelPricingItem> = [
    { title: '模型名称', dataIndex: 'modelName', width: 160 },
    {
      title: '模式',
      width: 90,
      render: (_, r) => <Tag>{r.billingMode === 'token' ? '按 Token' : '按次数'}</Tag>
    },
    {
      title: '官方价格摘要',
      width: 280,
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
      render: (_, r) => getEffectiveChannelPrices(r.channelPrices).length
    },
    {
      title: '渠道商摘要',
      width: 200,
      ellipsis: true,
      render: (_, r) => formatChannelSummary(r.channelPrices)
    },
    { title: '更新时间', dataIndex: 'updatedAt', width: 168 },
    {
      title: '操作',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space className="table-actions" size={0} wrap>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Button type="link" size="small" icon={<ToolOutlined />} onClick={() => openPriceMaintain(record)}>渠道价格维护</Button>
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
        description="渠道价格更新采用待生效排期：同模型同渠道仅一条待生效，到达生效日后切换为最新价并用于用量统计。"
        extra={
          activeTab === 'official' ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增模型
            </Button>
          ) : null
        }
      />

      <Card bordered={false} className="page-card model-pricing-tabs-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'official',
              label: '模型官方价格管理',
              children: (
                <>
                  <Form form={officialFilterForm} layout="vertical" className="filter-panel">
                    <Row gutter={16}>
                      <Col xs={24} sm={12} lg={6}>
                        <Form.Item name="modelName" label="模型名称">
                          <Input placeholder="模糊查询" allowClear />
                        </Form.Item>
                      </Col>
                      <Col xs={24} lg={6} className="filter-actions">
                        <FilterActions onSearch={handleOfficialSearch} onReset={handleOfficialReset} />
                      </Col>
                    </Row>
                  </Form>
                  <div className="table-summary">
                    共 <strong>{filteredModels.length}</strong> 个模型 · 单价统一 9 位小数
                  </div>
                  <Table
                    key={appliedOfficialKeyword || '__all__'}
                    rowKey="id"
                    columns={officialColumns}
                    dataSource={filteredModels}
                    scroll={{ x: 1280 }}
                    pagination={TABLE_LIST_PAGINATION}
                    size="middle"
                  />
                </>
              )
            },
            {
              key: 'channel',
              label: '渠道价格管理',
              children: (
                <>
                  <Typography.Paragraph type="secondary" style={{ marginBottom: 16, fontSize: 13 }}>
                    汇总展示全部渠道价格记录；同一模型同一渠道仅允许一条待生效价格。生效中/已失效可查看详情，待生效可编辑或删除。
                  </Typography.Paragraph>
                  <Form
                    form={channelFilterForm}
                    layout="vertical"
                    className="filter-panel"
                    initialValues={{ status: 'all' }}
                  >
                    <Row gutter={16}>
                      <Col xs={24} sm={12} lg={6}>
                        <Form.Item name="keyword" label="模型名称 / 渠道来源">
                          <Input placeholder="模糊查询" allowClear />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} lg={4}>
                        <Form.Item name="status" label="状态">
                          <Select options={CHANNEL_STATUS_FILTER_OPTIONS} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} lg={6} className="filter-actions">
                        <FilterActions onSearch={handleChannelSearch} onReset={handleChannelReset} />
                      </Col>
                    </Row>
                  </Form>
                  <div className="table-summary">
                    共 <strong>{filteredChannelRows.length}</strong> 条渠道价格记录
                  </div>
                  <ChannelPriceViewTable
                    dataSource={filteredChannelRows}
                    showStatus
                    showUpdatedAt
                    variant="compact"
                    showActions
                    sortBy="updatedAt"
                    paginated
                    paginationKey={`${appliedChannelKeyword}-${appliedChannelStatus}`}
                    onDetail={openChannelDetail}
                    onEdit={openChannelEdit}
                    onDelete={handleChannelDelete}
                  />
                </>
              )
            }
          ]}
        />
      </Card>

      <AppDrawer
        title={editing ? '编辑官方价格' : '新增模型官方价格'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={PRICING_DRAWER_WIDTH}
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

          {!editing ? (
            <FormSection title="渠道价格管理">
              <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
                渠道来源取自「渠道管理」；若该渠道已有生效中价格，新价格须设置未来生效时间（待生效），同渠道仅一条待生效。
              </Typography.Paragraph>
              <Form.List name="channelPrices">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field) => (
                      <ChannelPriceEntry
                        key={field.key}
                        listField={field}
                        listName="channelPrices"
                        billingMode={billingMode}
                        form={form}
                        existingChannelPrices={[]}
                        onRemove={() => remove(field.name)}
                      />
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => add(createDefaultChannelPriceEntry())}
                      block
                      icon={<PlusOutlined />}
                    >
                      添加渠道价格
                    </Button>
                  </>
                )}
              </Form.List>
            </FormSection>
          ) : (
            <FormSection title="渠道价格列表">
              <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
                仅展示状态为「生效中」的渠道价格；待生效、已失效记录不在此展示。如需新增或调整渠道价格，请使用列表【渠道价格维护】。
              </Typography.Paragraph>
              <ChannelPriceViewTable
                dataSource={editingActiveChannelRows}
                showModel={false}
                showStatus
                variant="compact"
                emptyText="暂无生效中的渠道价格"
              />
            </FormSection>
          )}
        </Form>
      </AppDrawer>

      <AppDrawer
        title="渠道价格维护"
        open={maintainDrawerOpen}
        onClose={() => setMaintainDrawerOpen(false)}
        width={PRICING_DRAWER_WIDTH}
        extra={
          <Space>
            <Button onClick={() => setMaintainDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleMaintainSave}>保存</Button>
          </Space>
        }
      >
        {maintaining ? (
          <Form form={maintainForm} layout="vertical" requiredMark="optional">
            <FormSection title="模型基本信息">
              <ModelBasicInfoReadOnly model={maintaining} />
            </FormSection>

            <FormSection
              title={
                maintaining.billingMode === 'count'
                  ? '官方价格（CNY）'
                  : '官方价格（CNY / 1M Tokens）'
              }
            >
              <OfficialPriceReadOnly model={maintaining} />
            </FormSection>

            <FormSection title="渠道价格维护">
              <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
                字段同「渠道价格管理」；若该渠道已有生效中价格，须设置未来生效时间（待生效）。
              </Typography.Paragraph>
              <Form.List name="priceMaintain">
                {(fields) => (
                  <>
                    {fields.map((field) => (
                      <div key={field.key}>
                        <ChannelPriceEntry
                          listField={field}
                          listName="priceMaintain"
                          billingMode={maintaining.billingMode}
                          form={maintainForm}
                          existingChannelPrices={maintaining.channelPrices ?? []}
                          hideRemove
                          onRemove={() => undefined}
                        />
                        <ChannelPriceStatusReference
                          channelId={maintainSelectedChannelId}
                          channelPrices={maintaining.channelPrices ?? []}
                          billingMode={maintaining.billingMode}
                        />
                      </div>
                    ))}
                  </>
                )}
              </Form.List>
            </FormSection>
          </Form>
        ) : null}
      </AppDrawer>

      <AppDrawer
        title="渠道价格详情"
        open={channelDetailOpen}
        onClose={() => setChannelDetailOpen(false)}
        width={PRICING_DRAWER_WIDTH}
        extra={<Button onClick={() => setChannelDetailOpen(false)}>关闭</Button>}
      >
        {channelDetailRow && channelDetailModel ? (
          <>
            <FormSection title="模型基本信息">
              <ModelBasicInfoReadOnly model={channelDetailModel} />
            </FormSection>
            <FormSection
              title={
                channelDetailModel.billingMode === 'count'
                  ? '官方价格（CNY）'
                  : '官方价格（CNY / 1M Tokens）'
              }
            >
              <OfficialPriceReadOnly model={channelDetailModel} />
            </FormSection>
            <FormSection title="渠道价格详情">
              <ChannelPriceFullReadOnly
                item={channelDetailRow}
                billingMode={channelDetailRow.billingMode}
                channelPrices={channelDetailRow.modelChannelPrices}
              />
              <ChannelPriceStatusReference
                channelId={channelDetailRow.channelId}
                channelPrices={channelDetailRow.modelChannelPrices}
                billingMode={channelDetailRow.billingMode}
              />
            </FormSection>
          </>
        ) : null}
      </AppDrawer>

      <AppDrawer
        title="编辑待生效渠道价格"
        open={channelEditOpen}
        onClose={() => setChannelEditOpen(false)}
        width={PRICING_DRAWER_WIDTH}
        extra={
          <Space>
            <Button onClick={() => setChannelEditOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleChannelEditSave}>保存</Button>
          </Space>
        }
      >
        {channelEditRow && channelEditModel ? (
          <Form form={channelEditForm} layout="vertical" requiredMark="optional">
            <FormSection title="模型基本信息">
              <ModelBasicInfoReadOnly model={channelEditModel} />
            </FormSection>
            <FormSection
              title={
                channelEditModel.billingMode === 'count'
                  ? '官方价格（CNY）'
                  : '官方价格（CNY / 1M Tokens）'
              }
            >
              <OfficialPriceReadOnly model={channelEditModel} />
            </FormSection>
            <FormSection title="渠道价格维护">
              <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
                界面参考「渠道价格维护」；渠道来源不可编辑。须保持为未来生效时间（待生效）。
              </Typography.Paragraph>
              <Form.List name="channelTabEdit">
                {(fields) => (
                  <>
                    {fields.map((field) => (
                      <div key={field.key}>
                        <ChannelPriceEntry
                          listField={field}
                          listName="channelTabEdit"
                          billingMode={channelEditModel.billingMode}
                          form={channelEditForm}
                          existingChannelPrices={channelEditModel.channelPrices ?? []}
                          officialPriceSource={channelEditModel}
                          channelIdDisabled
                          requireFutureEffective
                          hideRemove
                          onRemove={() => undefined}
                        />
                        <ChannelPriceStatusReference
                          channelId={channelEditSelectedChannelId ?? channelEditRow.channelId}
                          channelPrices={channelEditModel.channelPrices ?? []}
                          billingMode={channelEditModel.billingMode}
                        />
                      </div>
                    ))}
                  </>
                )}
              </Form.List>
            </FormSection>
          </Form>
        ) : null}
      </AppDrawer>
    </div>
  );
}
