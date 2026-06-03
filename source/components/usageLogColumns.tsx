import React from 'react';
import { Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { InfoCircleOutlined } from '@ant-design/icons';
import type { UsageLogItem } from './mockData';
import { formatCny2 } from './formatCny';
import { shouldShowBalanceAfter, isProjectBalanceOpLog } from './mockData';

export const logTypeColors: Record<string, string> = {
  消耗: 'blue',
  扣款: 'orange',
  充值: 'green'
};

export function buildUsageLogColumns(options?: { showProject?: boolean }): ColumnsType<UsageLogItem> {
  const cols: ColumnsType<UsageLogItem> = [];
  if (options?.showProject !== false) {
    cols.push({ title: '项目名称', dataIndex: 'projectName', width: 140, ellipsis: true });
  }
  cols.push(
    {
      title: '类型',
      dataIndex: 'type',
      width: 72,
      render: (type: string) => <Tag color={logTypeColors[type]}>{type}</Tag>
    },
    { title: '时间', dataIndex: 'time', width: 165 },
    { title: '渠道', dataIndex: 'channel', width: 130, ellipsis: true },
    { title: '令牌', dataIndex: 'token', width: 180, ellipsis: true },
    { title: '模型', dataIndex: 'model', width: 130 },
    { title: '耗时', dataIndex: 'duration', width: 72 },
    {
      title: 'Tokens',
      width: 120,
      align: 'right',
      render: (_, r) => {
        if (r.inputTokens === 0 && r.outputTokens === 0) return '-';
        const total = r.inputTokens + r.outputTokens;
        return `${r.inputTokens.toLocaleString()} / ${r.outputTokens.toLocaleString()} (${total.toLocaleString()})`;
      }
    },
    {
      title: '费用 (CNY)',
      dataIndex: 'cost',
      width: 115,
      align: 'right',
      render: (v: number, r) => {
        if (isProjectBalanceOpLog(r)) {
          const isDeduct = r.type === '扣款';
          return (
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 12,
                color: isDeduct ? '#cf1322' : '#389e0d',
                fontWeight: 500
              }}
            >
              {isDeduct ? '−' : '+'}
              {formatCny2(Math.abs(v))}
            </span>
          );
        }
        return (
          <span style={{ color: v < 0 ? '#fa8c16' : undefined, fontFamily: 'monospace', fontSize: 12 }}>
            {formatCny2(v)}
          </span>
        );
      }
    },
    {
      title: (
        <span>
          当前余额 (CNY){' '}
          <Tooltip title="仅项目余额充值/扣款后展示；与「充值」展示规则一致">
            <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.35)' }} />
          </Tooltip>
        </span>
      ),
      width: 130,
      align: 'right',
      render: (_, r) =>
        shouldShowBalanceAfter(r) ? (
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatCny2(r.balanceAfter!)}</span>
        ) : (
          <span style={{ color: 'rgba(0,0,0,.25)' }}>-</span>
        )
    },
    { title: '详情/备注', dataIndex: 'remark', ellipsis: true }
  );
  return cols;
}
