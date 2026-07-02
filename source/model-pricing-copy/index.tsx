/**
 * @name 模型定价管理 copy
 * 在官方版基础上支持阶梯价格：按输入区间维护官方价与渠道价
 */

import React from 'react';
import { ModelPricingPage } from '../model-pricing';
import { mockModelsForPricingCopy } from '../components/mockData';

export default function ModelPricingCopyPage() {
  return (
    <ModelPricingPage
      pageTitle="模型定价管理copy"
      pageDescription="支持阶梯价格：基本信息选择「阶梯价格=是」后，官方价格按输入区间（如 (0, 128]）维护；渠道自定义价格从官方区间下拉选择。"
      enableTierPromptPricing
      initialModels={mockModelsForPricingCopy}
    />
  );
}
