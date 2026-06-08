export interface GroupItem {
  id: string;
  name: string;
  ratio: number;
  visible: boolean;
  remark: string;
}

export type ChannelPriceConfigMode = 'discount' | 'custom';

export interface ChannelPriceItem {
  channelId: string;
  channelName: string;
  /** 价格配置：折扣（按官方价 × 折扣系数）或自定义 */
  priceConfigMode?: ChannelPriceConfigMode;
  /** 折扣系数，仅 priceConfigMode 为 discount 时有效 */
  discountRate?: number;
  /** 按 Token 计费 */
  inputPrice?: number;
  completionPrice?: number;
  cacheWritePrice?: number;
  cacheReadPrice?: number;
  imageInputPrice?: number;
  imageOutputPrice?: number;
  imageCacheReadPrice?: number;
  audioInputPrice?: number;
  audioOutputPrice?: number;
  videoOutputPrice?: number;
  /** 按次数计费：每次价格 CNY */
  perCallPrice?: number;
}

export interface ModelPricingItem {
  id: string;
  modelName: string;
  modelType: 'vector' | 'text' | 'image' | 'video';
  remark?: string;
  billingMode: 'token' | 'count';
  tierPricing: boolean;
  /** 按 Token 计费 */
  inputPrice?: number;
  /** 按次数计费：每次价格 CNY，9 位小数 */
  perCallPrice?: number;
  completionPrice?: number;
  cacheWritePrice?: number;
  cacheReadPrice?: number;
  imageInputPrice?: number;
  imageOutputPrice?: number;
  imageCacheReadPrice?: number;
  audioInputPrice?: number;
  audioOutputPrice?: number;
  videoOutputPrice?: number;
  channelPrices: ChannelPriceItem[];
  updatedAt: string;
}

export interface ModelMappingItem {
  originalModel: string;
  replaceModel: string;
}

export type QuotaMode = 'limited' | 'unlimited';

export interface ChannelItem {
  id: string;
  name: string;
  type: string;
  status: 'enabled' | 'disabled';
  groupIds: string[];
  /** 已使用金额 CNY */
  used: number;
  /** 剩余金额 CNY */
  remaining: number;
  /** 充值金额 CNY（创建/编辑时配置） */
  rechargeAmount?: number;
  responseTime: string;
  lastTestTime: string;
  apiUrl: string;
  keyMode: 'single' | 'multi';
  apiKeys: string;
  multiKeyStrategy?: 'random' | 'round';
  modelIds: string[];
  modelMappings: ModelMappingItem[];
}

/**
 * 渠道充值/扣款历史记录（仅记账，不写入使用日志；
 * 参考余额可为负，不限制调用，除非上游返回余额不足）
 */
export interface ChannelRechargeRecord {
  id: string;
  channelId: string;
  type: 'recharge' | 'deduct';
  /** 金额 CNY，正数 */
  amount: number;
  time: string;
  operator?: string;
  remark?: string;
}

export type ProjectStatus = 'enabled' | 'disabled';

export interface ProjectItem {
  id: string;
  code: string;
  name: string;
  type: 'local' | 'saas';
  /** 项目状态 */
  status: ProjectStatus;
  company: string;
  contact: string;
  phone: string;
  groupId?: string;
  remark: string;
  quotaMode: QuotaMode;
  totalQuota: number;
  remainingQuota: number;
  /** 无限制时的累计消费（CNY） */
  consumptionTotal: number;
  updatedAt: string;
}

export interface ApiKeyItem {
  id: string;
  projectId: string;
  name: string;
  status: 'active' | 'closed';
  apiKey: string;
  quotaMode: QuotaMode;
  totalQuota: number;
  remainingQuota: number;
  consumptionTotal: number;
  groupId: string;
  allowedModels: string[];
  ipLimit: string;
  createdAt: string;
  lastUsedAt: string;
}

export interface UsageLogItem {
  id: string;
  projectId?: string;
  projectName: string;
  type: '消耗' | '扣款' | '充值';
  /** 项目级充值/扣款；为 true 时在使用日志列表展示「当前余额」 */
  projectBalanceOp?: boolean;
  time: string;
  channel: string;
  token: string;
  model: string;
  duration: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  /** 项目级充值/扣款后的余额 CNY；仅 projectBalanceOp 为 true 时有值 */
  balanceAfter?: number;
  remark: string;
}

export const mockGroups: GroupItem[] = [
  { id: 'g1', name: '默认分组', ratio: 1.0, visible: true, remark: '系统默认分组，适用于常规渠道' },
  { id: 'g2', name: 'VIP渠道组', ratio: 1.5, visible: true, remark: '高优先级渠道分组' },
  { id: 'g3', name: '测试分组', ratio: 0.85, visible: false, remark: '内部测试使用，密钥创建不可见' },
  { id: 'g4', name: '企业客户组', ratio: 2.0, visible: true, remark: '企业级客户专用分组' }
];

export const mockModels: ModelPricingItem[] = [
  {
    id: 'm1',
    modelName: 'gpt-4o',
    modelType: 'text',
    billingMode: 'token',
    tierPricing: false,
    inputPrice: 18.0,
    completionPrice: 72.0,
    cacheReadPrice: 9.0,
    cacheWritePrice: 3.6,
    channelPrices: [
      {
        channelId: 'c1',
        channelName: 'OpenAI-主渠道',
        priceConfigMode: 'discount',
        discountRate: 0.889,
        inputPrice: 16.0,
        completionPrice: 64.01,
        cacheReadPrice: 7.99,
        cacheWritePrice: 3.2
      },
      {
        channelId: 'c2',
        channelName: 'OpenAI-备用',
        priceConfigMode: 'custom',
        inputPrice: 17.5,
        completionPrice: 70.0
      }
    ],
    updatedAt: '2025-05-20 14:30:00'
  },
  {
    id: 'm2',
    modelName: 'gpt-4o-mini',
    modelType: 'text',
    billingMode: 'token',
    tierPricing: false,
    inputPrice: 1.08,
    completionPrice: 4.32,
    channelPrices: [
      {
        channelId: 'c1',
        channelName: 'OpenAI-主渠道',
        priceConfigMode: 'custom',
        inputPrice: 1.0,
        completionPrice: 4.0
      }
    ],
    updatedAt: '2025-05-18 09:15:00'
  },
  {
    id: 'm3',
    modelName: 'claude-3-5-sonnet',
    modelType: 'text',
    billingMode: 'token',
    tierPricing: false,
    inputPrice: 21.6,
    completionPrice: 108.0,
    cacheReadPrice: 2.16,
    cacheWritePrice: 27.0,
    channelPrices: [{ channelId: 'c2', channelName: 'Anthropic-备用', inputPrice: 20.0, completionPrice: 100.0 }],
    updatedAt: '2025-05-19 16:45:00'
  },
  {
    id: 'm4',
    modelName: 'gemini-1.5-pro',
    modelType: 'image',
    billingMode: 'token',
    tierPricing: false,
    inputPrice: 9.0,
    completionPrice: 36.0,
    imageInputPrice: 0.014,
    imageOutputPrice: 0.028,
    channelPrices: [],
    updatedAt: '2025-05-17 11:20:00'
  },
  {
    id: 'm5',
    modelName: 'whisper-1',
    modelType: 'video',
    billingMode: 'token',
    tierPricing: false,
    inputPrice: 0,
    audioInputPrice: 0.043,
    audioOutputPrice: 0.172,
    channelPrices: [{ channelId: 'c3', channelName: 'Gemini-测试', inputPrice: 0.04, audioOutputPrice: 0.16 }],
    updatedAt: '2025-05-15 08:00:00'
  },
  {
    id: 'm6',
    modelName: 'dall-e-3',
    modelType: 'image',
    billingMode: 'count',
    tierPricing: false,
    perCallPrice: 0.08,
    channelPrices: [
      {
        channelId: 'c1',
        channelName: 'OpenAI-主渠道',
        priceConfigMode: 'discount',
        discountRate: 0.9,
        perCallPrice: 0.072
      },
      {
        channelId: 'c2',
        channelName: 'OpenAI-备用',
        priceConfigMode: 'custom',
        perCallPrice: 0.075
      }
    ],
    updatedAt: '2025-05-21 10:00:00'
  }
];

export const mockChannels: ChannelItem[] = [
  {
    id: 'c1',
    name: 'OpenAI-主渠道',
    type: 'OpenAI',
    status: 'enabled',
    groupIds: ['g1', 'g2'],
    used: 12580.123456,
    remaining: 87419.876544,
    rechargeAmount: 100000.0,
    responseTime: '320ms',
    lastTestTime: '2025-05-25 08:30:00',
    apiUrl: 'https://api.openai.com/v1',
    keyMode: 'multi',
    apiKeys: 'sk-proj-****\nsk-proj-****',
    multiKeyStrategy: 'round',
    modelIds: ['m1', 'm2'],
    modelMappings: [{ originalModel: 'gpt-4o-fast', replaceModel: 'gpt-4o' }]
  },
  {
    id: 'c2',
    name: 'Anthropic-备用',
    type: 'Anthropic',
    status: 'enabled',
    groupIds: ['g1'],
    used: 3256.789012,
    remaining: 96743.210988,
    rechargeAmount: 100000.0,
    responseTime: '450ms',
    lastTestTime: '2025-05-24 22:15:00',
    apiUrl: 'https://api.anthropic.com',
    keyMode: 'single',
    apiKeys: 'sk-ant-****',
    modelIds: ['m3'],
    modelMappings: []
  },
  {
    id: 'c3',
    name: 'Gemini-测试',
    type: 'Gemini',
    status: 'disabled',
    groupIds: ['g3'],
    used: 89.456789,
    remaining: 9910.543211,
    rechargeAmount: 10000.0,
    responseTime: '-',
    lastTestTime: '2025-05-20 10:00:00',
    apiUrl: 'https://generativelanguage.googleapis.com',
    keyMode: 'single',
    apiKeys: 'AIza****',
    modelIds: ['m4'],
    modelMappings: [{ originalModel: 'gemini-pro', replaceModel: 'gemini-1.5-pro' }]
  }
];

export const mockChannelRechargeRecords: ChannelRechargeRecord[] = [
  {
    id: 'cr1',
    channelId: 'c1',
    type: 'recharge',
    amount: 100000,
    time: '2025-05-01 10:00:00',
    operator: '系统管理员',
    remark: '渠道初始充值'
  },
  {
    id: 'cr2',
    channelId: 'c1',
    type: 'recharge',
    amount: 20000,
    time: '2025-05-18 15:30:00',
    operator: '财务',
    remark: '补充额度'
  },
  {
    id: 'cr3',
    channelId: 'c1',
    type: 'deduct',
    amount: 1500,
    time: '2025-05-20 11:00:00',
    operator: '系统管理员',
    remark: '对账扣减'
  },
  {
    id: 'cr4',
    channelId: 'c2',
    type: 'recharge',
    amount: 100000,
    time: '2025-05-02 09:00:00',
    operator: '系统管理员',
    remark: '渠道初始充值'
  },
  {
    id: 'cr5',
    channelId: 'c2',
    type: 'deduct',
    amount: 800,
    time: '2025-05-22 16:20:00',
    operator: '运维',
    remark: '异常调用扣款'
  },
  {
    id: 'cr6',
    channelId: 'c3',
    type: 'recharge',
    amount: 10000,
    time: '2025-05-10 08:00:00',
    operator: '测试账号',
    remark: '测试环境充值'
  }
];

export const mockProjects: ProjectItem[] = [
  {
    id: 'p1',
    code: 'PRJ-2025001',
    name: '智慧教育 SaaS',
    type: 'saas',
    status: 'enabled',
    company: '灵数科技有限公司',
    contact: '张经理',
    phone: '13800138001',
    groupId: 'g2',
    remark: '教育行业 SaaS 客户',
    quotaMode: 'limited',
    totalQuota: 20000,
    remainingQuota: 12580.5,
    consumptionTotal: 0,
    updatedAt: '2025-05-25 09:00:00'
  },
  {
    id: 'p2',
    code: 'PRJ-2025002',
    name: '企业内部 AI 助手',
    type: 'local',
    status: 'enabled',
    company: '某制造集团',
    contact: '李工',
    phone: '13900139002',
    groupId: 'g1',
    remark: '本地化部署项目',
    quotaMode: 'limited',
    totalQuota: 10000,
    remainingQuota: 8900.0,
    consumptionTotal: 0,
    updatedAt: '2025-05-24 16:30:00'
  },
  {
    id: 'p3',
    code: 'PRJ-2025003',
    name: '客服智能体平台',
    type: 'saas',
    status: 'disabled',
    company: '云服科技',
    contact: '王总',
    phone: '13700137003',
    groupId: 'g4',
    remark: '',
    quotaMode: 'unlimited',
    totalQuota: 0,
    remainingQuota: 0,
    consumptionTotal: 4580.123456,
    updatedAt: '2025-05-23 11:45:00'
  }
];

export const mockApiKeys: ApiKeyItem[] = [
  {
    id: 'k1',
    projectId: 'p1',
    name: '生产环境密钥',
    status: 'active',
    apiKey: 'sk-ls-a1b2c3d4e5f6g7h8',
    quotaMode: 'limited',
    totalQuota: 5000,
    remainingQuota: 3245.5,
    consumptionTotal: 0,
    groupId: 'g2',
    allowedModels: ['gpt-4o', 'gpt-4o-mini'],
    ipLimit: '192.168.1.0/24',
    createdAt: '2025-04-01 10:00:00',
    lastUsedAt: '2025-05-25 08:55:00'
  },
  {
    id: 'k2',
    projectId: 'p1',
    name: '测试密钥',
    status: 'active',
    apiKey: 'sk-ls-test9876543210',
    quotaMode: 'limited',
    totalQuota: 500,
    remainingQuota: 0,
    consumptionTotal: 0,
    groupId: 'g1',
    allowedModels: ['gpt-4o-mini'],
    ipLimit: '',
    createdAt: '2025-04-15 14:20:00',
    lastUsedAt: '2025-05-24 18:30:00'
  },
  {
    id: 'k3',
    projectId: 'p2',
    name: '内部调用密钥',
    status: 'closed',
    apiKey: 'sk-ls-local0011223344',
    quotaMode: 'limited',
    totalQuota: 2000,
    remainingQuota: 0,
    consumptionTotal: 0,
    groupId: 'g1',
    allowedModels: ['claude-3-5-sonnet'],
    ipLimit: '10.0.0.0/8',
    createdAt: '2025-03-20 09:00:00',
    lastUsedAt: '2025-05-10 12:00:00'
  },
  {
    id: 'k4',
    projectId: 'p3',
    name: '客服密钥',
    status: 'active',
    apiKey: 'sk-ls-cs888888888888',
    quotaMode: 'unlimited',
    totalQuota: 0,
    remainingQuota: 0,
    consumptionTotal: 1256.789012,
    groupId: 'g4',
    allowedModels: [],
    ipLimit: '',
    createdAt: '2025-05-01 10:00:00',
    lastUsedAt: '2025-05-21 14:00:00'
  }
];

export const mockUsageLogs: UsageLogItem[] = [
  {
    id: 'l1',
    projectId: 'p1',
    projectName: '智慧教育 SaaS',
    type: '消耗',
    time: '2025-05-25 08:55:12',
    channel: 'OpenAI-主渠道',
    token: '生产环境密钥 / VIP渠道组',
    model: 'gpt-4o',
    duration: '1.2s',
    inputTokens: 980,
    outputTokens: 600,
    cost: 0.168750,
    remark: '对话补全'
  },
  {
    id: 'l2',
    projectId: 'p1',
    projectName: '智慧教育 SaaS',
    type: '消耗',
    time: '2025-05-25 08:52:30',
    channel: 'OpenAI-主渠道',
    token: '测试密钥 / 默认分组',
    model: 'gpt-4o-mini',
    duration: '0.8s',
    inputTokens: 280,
    outputTokens: 140,
    cost: 0.002268,
    remark: '文本生成'
  },
  {
    id: 'l3',
    projectId: 'p1',
    projectName: '智慧教育 SaaS',
    type: '充值',
    projectBalanceOp: false,
    time: '2025-05-25 08:00:00',
    channel: '-',
    token: '生产环境密钥 / VIP渠道组',
    model: '-',
    duration: '-',
    inputTokens: 0,
    outputTokens: 0,
    cost: 1000.0,
    remark: '密钥余额充值（不计入使用日志-充值）'
  },
  {
    id: 'l4',
    projectId: 'p2',
    projectName: '企业内部 AI 助手',
    type: '消耗',
    time: '2025-05-24 22:10:05',
    channel: 'Anthropic-备用',
    token: '内部调用密钥 / 默认分组',
    model: 'claude-3-5-sonnet',
    duration: '2.1s',
    inputTokens: 2100,
    outputTokens: 1100,
    cost: 0.164160,
    remark: '长文本分析'
  },
  {
    id: 'l5',
    projectId: 'p1',
    projectName: '智慧教育 SaaS',
    type: '扣款',
    time: '2025-05-24 15:30:00',
    channel: 'OpenAI-主渠道',
    token: '测试密钥 / 默认分组',
    model: 'gpt-4o',
    duration: '-',
    inputTokens: 300,
    outputTokens: 200,
    cost: -0.021600,
    remark: '调用失败扣款（非项目余额变动，不展示当前余额）'
  },
  {
    id: 'l6',
    projectId: 'system',
    projectName: '灵数运营平台',
    type: '消耗',
    time: '2025-05-24 14:20:18',
    channel: 'Gemini-测试',
    token: '渠道测试',
    model: 'gemini-1.5-pro',
    duration: '1.5s',
    inputTokens: 520,
    outputTokens: 370,
    cost: 0.01206,
    remark: '渠道方模型测试'
  },
  {
    id: 'l7',
    projectId: 'p2',
    projectName: '企业内部 AI 助手',
    type: '充值',
    projectBalanceOp: true,
    time: '2025-05-23 10:00:00',
    channel: '-',
    token: '-',
    model: '-',
    duration: '-',
    inputTokens: 0,
    outputTokens: 0,
    cost: 800,
    balanceAfter: 8900,
    remark: '项目金额充值'
  },
  {
    id: 'l8',
    projectId: 'p3',
    projectName: '客服智能体平台',
    type: '充值',
    projectBalanceOp: true,
    time: '2025-05-22 09:30:00',
    channel: '-',
    token: '-',
    model: '-',
    duration: '-',
    inputTokens: 0,
    outputTokens: 0,
    cost: 500,
    balanceAfter: 9500,
    remark: '项目初始化余额 / 套餐续费'
  },
  {
    id: 'l9',
    projectId: 'p1',
    projectName: '智慧教育 SaaS',
    type: '消耗',
    time: '2025-05-23 16:20:00',
    channel: 'OpenAI-主渠道',
    token: '生产环境密钥 / VIP渠道组',
    model: 'gpt-4o',
    duration: '1.0s',
    inputTokens: 1200,
    outputTokens: 800,
    cost: 0.0792,
    remark: '批量批改'
  },
  {
    id: 'l10',
    projectId: 'p2',
    projectName: '企业内部 AI 助手',
    type: '消耗',
    time: '2025-05-22 11:05:00',
    channel: 'Anthropic-备用',
    token: '内部调用密钥 / 默认分组',
    model: 'claude-3-5-sonnet',
    duration: '1.8s',
    inputTokens: 1500,
    outputTokens: 900,
    cost: 0.1296,
    remark: '文档摘要'
  },
  {
    id: 'l11',
    projectId: 'p3',
    projectName: '客服智能体平台',
    type: '消耗',
    time: '2025-05-21 14:00:00',
    channel: 'OpenAI-主渠道',
    token: '客服密钥 / 企业客户组',
    model: 'gpt-4o-mini',
    duration: '0.6s',
    inputTokens: 400,
    outputTokens: 200,
    cost: 0.00324,
    remark: '客服回复'
  },
  {
    id: 'l12',
    projectId: 'p1',
    projectName: '智慧教育 SaaS',
    type: '消耗',
    time: '2025-05-20 09:15:00',
    channel: 'OpenAI-主渠道',
    token: '生产环境密钥 / VIP渠道组',
    model: 'gpt-4o-mini',
    duration: '0.7s',
    inputTokens: 350,
    outputTokens: 180,
    cost: 0.00284,
    remark: '试题生成'
  },
  {
    id: 'l13',
    projectId: 'p2',
    projectName: '企业内部 AI 助手',
    type: '消耗',
    time: '2025-05-20 15:40:00',
    channel: 'Anthropic-备用',
    token: '内部调用密钥 / 默认分组',
    model: 'claude-3-5-sonnet',
    duration: '2.0s',
    inputTokens: 1800,
    outputTokens: 950,
    cost: 0.14148,
    remark: '代码审查'
  },
  {
    id: 'l14',
    projectId: 'p1',
    projectName: '智慧教育 SaaS',
    type: '消耗',
    time: '2025-05-19 10:30:00',
    channel: 'OpenAI-主渠道',
    token: '测试密钥 / 默认分组',
    model: 'gpt-4o',
    duration: '1.1s',
    inputTokens: 600,
    outputTokens: 400,
    cost: 0.0396,
    remark: '功能验证'
  },
  {
    id: 'l15',
    projectId: 'p3',
    projectName: '客服智能体平台',
    type: '消耗',
    time: '2025-05-19 16:00:00',
    channel: 'OpenAI-主渠道',
    token: '客服密钥 / 企业客户组',
    model: 'gpt-4o-mini',
    duration: '0.5s',
    inputTokens: 220,
    outputTokens: 110,
    cost: 0.00178,
    remark: '意图识别'
  },
  {
    id: 'l16',
    projectId: 'p2',
    projectName: '企业内部 AI 助手',
    type: '扣款',
    projectBalanceOp: true,
    time: '2025-05-21 09:00:00',
    channel: '-',
    token: '-',
    model: '-',
    duration: '-',
    inputTokens: 0,
    outputTokens: 0,
    cost: -200,
    balanceAfter: 8700,
    remark: '项目余额扣款（运营管理）'
  }
];

/** 渠道已使用统计（含渠道测试等全部消耗记录） */
export function getChannelUsedStats(channelName: string, logs = mockUsageLogs) {
  const rows = logs.filter((l) => l.channel === channelName && l.type === '消耗');
  return {
    usedAmount: rows.reduce((sum, l) => sum + Math.max(0, l.cost), 0),
    usedTokens: rows.reduce((sum, l) => sum + l.inputTokens + l.outputTokens, 0)
  };
}

export function getChannelRechargeRecords(channelId: string, records = mockChannelRechargeRecords) {
  return records
    .filter((r) => r.channelId === channelId)
    .sort((a, b) => b.time.localeCompare(a.time));
}

/** 渠道记账汇总（参考余额，可为负）；消耗仅统计使用日志中的「消耗」 */
export function getChannelRechargeSummary(
  channelId: string,
  channelName: string,
  records = mockChannelRechargeRecords,
  logs = mockUsageLogs
) {
  const channelRecords = records.filter((r) => r.channelId === channelId);
  const rechargeTotal = channelRecords
    .filter((r) => r.type === 'recharge')
    .reduce((sum, r) => sum + r.amount, 0);
  const deductMagnitude = channelRecords
    .filter((r) => r.type === 'deduct')
    .reduce((sum, r) => sum + r.amount, 0);
  const deductTotal = -deductMagnitude;
  const consumption = getChannelUsedStats(channelName, logs).usedAmount;
  const balance = rechargeTotal + deductTotal - consumption;
  return { rechargeTotal, deductTotal, deductMagnitude, consumption, balance };
}

export function getGroupName(id: string, groups = mockGroups) {
  return groups.find((g) => g.id === id)?.name || '-';
}

export function getModelName(id: string, models = mockModels) {
  return models.find((m) => m.id === id)?.modelName || id;
}

export function getVisibleGroups(groups = mockGroups) {
  return groups.filter((g) => g.visible);
}

export function getProjectKeyCount(projectId: string, keys = mockApiKeys) {
  return keys.filter((k) => k.projectId === projectId).length;
}

export function formatChannelSummary(channelPrices: ChannelPriceItem[]) {
  const names = channelPrices.map((c) => c.channelName).filter(Boolean);
  if (names.length === 0) return '-';
  if (names.length <= 2) return names.join('、');
  return `${names.slice(0, 2).join('、')}…`;
}

export type ApiKeyDisplayStatus = 'active' | 'closed' | 'exhausted';

/** 密钥展示状态：已启用 / 已禁用 / 已耗尽 */
export function getApiKeyDisplayStatus(key: ApiKeyItem): ApiKeyDisplayStatus {
  if (key.status === 'closed') return 'closed';
  if (key.quotaMode === 'limited' && key.remainingQuota <= 0) return 'exhausted';
  return 'active';
}

export function getApiKeyStatusLabel(status: ApiKeyDisplayStatus): string {
  const map: Record<ApiKeyDisplayStatus, string> = {
    active: '已启用',
    closed: '已禁用',
    exhausted: '已耗尽'
  };
  return map[status];
}

export function getProjectStatusLabel(status: ProjectStatus): string {
  return status === 'enabled' ? '已启用' : '已禁用';
}

/** 使用日志页：「充值」「扣款」仅展示项目余额变动；密钥充值、调用失败扣款等不计入 */
export function filterLogsForUsageLogPage(logs: UsageLogItem[]): UsageLogItem[] {
  return logs.filter((log) => {
    if (log.type === '充值' || log.type === '扣款') {
      return log.projectBalanceOp === true;
    }
    return true;
  });
}

export function isProjectRechargeLog(log: UsageLogItem): boolean {
  return log.type === '充值' && log.projectBalanceOp === true;
}

/** 项目余额扣款（运营管理），展示逻辑与项目级「充值」一致 */
export function isProjectDeductLog(log: UsageLogItem): boolean {
  return log.type === '扣款' && log.projectBalanceOp === true;
}

export function isProjectBalanceOpLog(log: UsageLogItem): boolean {
  return log.projectBalanceOp === true && (log.type === '充值' || log.type === '扣款');
}

/** 按日志类型筛选；「充值」「扣款」均仅匹配项目余额变动记录 */
export function matchesUsageLogTypeFilter(log: UsageLogItem, logType?: string): boolean {
  if (!logType) return true;
  if (logType === '充值') return isProjectRechargeLog(log);
  if (logType === '扣款') return isProjectDeductLog(log);
  return log.type === logType;
}

/** 列表是否展示「当前余额」：仅项目级充值/扣款 */
export function shouldShowBalanceAfter(log: UsageLogItem): boolean {
  return log.projectBalanceOp === true && log.balanceAfter != null && !Number.isNaN(log.balanceAfter);
}
