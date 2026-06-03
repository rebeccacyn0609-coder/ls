import React from 'react';
import { Progress, Tag, Tooltip, Typography } from 'antd';
import { formatCny2 } from './formatCny';

export type QuotaMode = 'limited' | 'unlimited';

export function QuotaLimitTag({ mode }: { mode: QuotaMode }) {
  return mode === 'limited' ? <Tag>有限</Tag> : <Tag color="processing">无限</Tag>;
}

type QuotaAmountCellProps = {
  mode: QuotaMode;
  totalQuota?: number;
  remainingQuota?: number;
  consumptionTotal?: number;
};

/** 有限：条形图 + 悬停额度明细；无限：消费总额 */
export function QuotaAmountCell({ mode, totalQuota = 0, remainingQuota = 0, consumptionTotal = 0 }: QuotaAmountCellProps) {
  if (mode === 'unlimited') {
    return (
      <div>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          消费总额
        </Typography.Text>
        <div style={{ fontFamily: 'monospace', fontSize: 12, marginTop: 4 }}>{formatCny2(consumptionTotal)}</div>
      </div>
    );
  }

  const total = totalQuota || 0;
  const remaining = Math.min(remainingQuota ?? 0, total);
  const used = Math.max(0, total - remaining);
  const percent = total > 0 ? Math.round((remaining / total) * 100) : 0;

  return (
    <Tooltip
      title={
        <span>
          已使用 {formatCny2(used)} / 未使用 {formatCny2(remaining)} / 总额度 {formatCny2(total)}
        </span>
      }
    >
      <div style={{ minWidth: 120 }}>
        <Progress percent={percent} size="small" showInfo={false} strokeColor="#1677ff" />
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          剩余 {formatCny2(remaining)}
        </Typography.Text>
      </div>
    </Tooltip>
  );
}
