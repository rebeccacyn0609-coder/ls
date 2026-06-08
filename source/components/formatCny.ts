/** 单价（官方价/渠道价）输入与展示精度 */
export const UNIT_PRICE_DECIMALS = 9;

/** 折扣系数精度 */
export const DISCOUNT_RATE_DECIMALS = 3;

/** 列表/日志/额度等金额展示精度（四舍五入） */
export const AMOUNT_DISPLAY_DECIMALS = 2;

export const UNIT_PRICE_STEP = 0.000000001;

export function roundUnitPrice(value: number): number {
  const factor = 10 ** UNIT_PRICE_DECIMALS;
  return Math.round(value * factor) / factor;
}

export function roundDiscountRate(value: number): number {
  const factor = 10 ** DISCOUNT_RATE_DECIMALS;
  return Math.round(value * factor) / factor;
}

export function roundAmountDisplay(value: number): number {
  const factor = 10 ** AMOUNT_DISPLAY_DECIMALS;
  return Math.round(value * factor) / factor;
}

/** 金额展示：项目管理、使用日志、渠道管理等列表 */
export function formatCny2(value: number) {
  return `¥${roundAmountDisplay(value).toFixed(AMOUNT_DISPLAY_DECIMALS)}`;
}

/** 单价展示：模型定价列表摘要等 */
export function formatUnitPrice(value: number) {
  return `¥${roundUnitPrice(value).toFixed(UNIT_PRICE_DECIMALS)}`;
}

/** @deprecated 统一为 formatCny2（2 位小数展示） */
export function formatCny6(value: number) {
  return formatCny2(value);
}
