// 【重要】必须使用 const Component 作为组件变量名
// 灵数运营管理平台 — Axhub Runtime 高精度单文件版（对齐 src/prototypes/token-platform）
// 粘贴到 Axhub「React 组件」编辑器；勿与「复制 Runtime 组件」(// axvg) 混用

const Component = function () {
  var menuLabels = {
    dashboard: '数据看板',
    'usage-log': '使用日志',
    project: '项目管理',
    channel: '渠道管理',
    'model-pricing': '模型定价管理',
    group: '分组管理'
  };

  var menuIcons = {
    dashboard: '\u25C8',
    'usage-log': '\u25CE',
    project: '\u25A3',
    channel: '\u2601',
    'model-pricing': '\u00A5',
    group: '\u25C9'
  };

  var mockGroups = [
  { id: 'g1', name: '默认分组', ratio: 1.0, visible: true, remark: '系统默认分组，适用于常规渠道' },
  { id: 'g2', name: 'VIP渠道组', ratio: 1.5, visible: true, remark: '高优先级渠道分组' },
  { id: 'g3', name: '测试分组', ratio: 0.85, visible: false, remark: '内部测试使用，密钥创建不可见' },
  { id: 'g4', name: '企业客户组', ratio: 2.0, visible: true, remark: '企业级客户专用分组' }
];

  var mockModels = [
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

  var mockChannels = [
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

  var mockProjects = [
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

  var mockUsageLogsAll = [
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

  function formatCny2(n) {
    var v = Number(n);
    if (isNaN(v)) return '-';
    var rounded = Math.round(v * 100) / 100;
    return '\u00A5' + rounded.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatMoney(n) {
    return formatCny2(n);
  }

  function formatUnitPrice(n) {
    var v = Number(n);
    if (isNaN(v)) return '-';
    return '\u00A5' + v.toFixed(4);
  }

  function getModelTypeLabel(t) {
    if (t === 'vector') return '\u5411\u91CF\u6A21\u578B';
    if (t === 'text') return '\u6587\u672C\u6A21\u578B';
    if (t === 'image') return '\u56FE\u50CF\u751F\u6210';
    if (t === 'video') return '\u89C6\u9891\u751F\u6210';
    return t || '-';
  }

  function formatNum(n, fd) {
    return Number(n).toLocaleString('zh-CN', { minimumFractionDigits: fd, maximumFractionDigits: fd });
  }

  function getGroupName(id) {
    for (var i = 0; i < mockGroups.length; i++) {
      if (mockGroups[i].id === id) return mockGroups[i].name;
    }
    return '-';
  }

  function getProjectKeyCount(projectId) {
    var c = 0;
    for (var i = 0; i < mockApiKeys.length; i++) {
      if (mockApiKeys[i].projectId === projectId) c++;
    }
    return c;
  }

  function formatChannelSummary(channelPrices) {
    var names = [];
    for (var i = 0; i < channelPrices.length; i++) {
      if (channelPrices[i].channelName) names.push(channelPrices[i].channelName);
    }
    if (names.length === 0) return '-';
    if (names.length <= 2) return names.join('\u3001');
    return names.slice(0, 2).join('\u3001') + '\u2026';
  }

  function filterLogsForUsageLogPage(logs) {
    var out = [];
    for (var i = 0; i < logs.length; i++) {
      var log = logs[i];
      if (log.type === '充值' || log.type === '扣款') {
        if (log.projectBalanceOp === true) out.push(log);
      } else {
        out.push(log);
      }
    }
    return out;
  }

  function isProjectBalanceOpLog(log) {
    return log.projectBalanceOp === true && (log.type === '充值' || log.type === '扣款');
  }

  function shouldShowBalanceAfter(log) {
    return log.projectBalanceOp === true && log.balanceAfter != null && !isNaN(log.balanceAfter);
  }

  function matchesUsageLogTypeFilter(log, logType) {
    if (!logType) return true;
    if (logType === '充值') return log.type === '充值' && log.projectBalanceOp === true;
    if (logType === '扣款') return log.type === '扣款' && log.projectBalanceOp === true;
    return log.type === logType;
  }

  var mockUsageLogs = filterLogsForUsageLogPage(mockUsageLogsAll);

  function getChannelUsedStats(channelName) {
    var usedAmount = 0;
    var usedTokens = 0;
    for (var i = 0; i < mockUsageLogsAll.length; i++) {
      var l = mockUsageLogsAll[i];
      if (l.channel === channelName && l.type === '消耗') {
        usedAmount += Math.max(0, l.cost);
        usedTokens += l.inputTokens + l.outputTokens;
      }
    }
    return { usedAmount: usedAmount, usedTokens: usedTokens };
  }

  var mockApiKeys = [
    { id: 'k1', projectId: 'p1', name: '生产环境密钥', status: 'active', apiKey: 'sk-ls-a1b2c3d4e5f6g7h8', quotaMode: 'limited', totalQuota: 5000, remainingQuota: 3245.5, consumptionTotal: 0, groupId: 'g2', allowedModels: ['gpt-4o', 'gpt-4o-mini'], ipLimit: '192.168.1.0/24', createdAt: '2025-04-01 10:00:00', lastUsedAt: '2025-05-25 08:55:00' },
    { id: 'k2', projectId: 'p1', name: '测试密钥', status: 'active', apiKey: 'sk-ls-test9876543210', quotaMode: 'limited', totalQuota: 500, remainingQuota: 0, consumptionTotal: 0, groupId: 'g1', allowedModels: ['gpt-4o-mini'], ipLimit: '', createdAt: '2025-04-15 14:20:00', lastUsedAt: '2025-05-24 18:30:00' },
    { id: 'k3', projectId: 'p2', name: '内部调用密钥', status: 'closed', apiKey: 'sk-ls-local0011223344', quotaMode: 'limited', totalQuota: 2000, remainingQuota: 0, consumptionTotal: 0, groupId: 'g1', allowedModels: ['claude-3-5-sonnet'], ipLimit: '10.0.0.0/8', createdAt: '2025-03-20 09:00:00', lastUsedAt: '2025-05-10 12:00:00' },
    { id: 'k4', projectId: 'p3', name: '客服密钥', status: 'active', apiKey: 'sk-ls-cs888888888888', quotaMode: 'unlimited', totalQuota: 0, remainingQuota: 0, consumptionTotal: 1256.789012, groupId: 'g4', allowedModels: [], ipLimit: '', createdAt: '2025-05-01 10:00:00', lastUsedAt: '2025-05-21 14:00:00' }
  ];

  var chartDates = ['05-19', '05-20', '05-21', '05-22', '05-23', '05-24', '05-25'];
  var channelLineSeries = [
    { name: 'Token 消耗', color: '#1677ff', data: [42000, 58000, 51000, 72000, 65000, 89000, 76000] },
    { name: '消费金额 (CNY)', color: '#52c41a', data: [320, 450, 380, 520, 490, 610, 540] },
    { name: '渠道成本 (CNY)', color: '#13c2c2', data: [280, 390, 330, 460, 420, 530, 470] },
    { name: '利润 (CNY)', color: '#fa8c16', data: [40, 60, 50, 60, 70, 80, 70] }
  ];
  var projectLineSeries = [
    { name: 'Token 消耗', color: '#1677ff', data: [38000, 52000, 48000, 68000, 61000, 82000, 71000] },
    { name: '消费金额 (CNY)', color: '#52c41a', data: [290, 410, 360, 490, 450, 570, 500] },
    { name: '利润 (CNY)', color: '#fa8c16', data: [50, 70, 55, 75, 65, 90, 80] }
  ];
  var barModelsAll = {
    dates: chartDates,
    series: [
      { name: 'gpt-4o', data: [42, 38, 45, 52, 48, 55, 50] },
      { name: 'gpt-4o-mini', data: [28, 32, 30, 35, 33, 40, 36] },
      { name: 'claude-3-5-sonnet', data: [18, 22, 20, 25, 24, 28, 26] }
    ]
  };

  var collapsedState = React.useState(false);
  var collapsed = collapsedState[0];
  var setCollapsed = collapsedState[1];
  var selectedKeyState = React.useState('dashboard');
  var selectedKey = selectedKeyState[0];
  var setSelectedKey = selectedKeyState[1];
  var openKeysState = React.useState(['token-project']);
  var openKeys = openKeysState[0];
  var setOpenKeys = openKeysState[1];
  var toastState = React.useState(null);
  var toast = toastState[0];
  var setToast = toastState[1];
  var dashTabState = React.useState('channel');
  var dashTab = dashTabState[0];
  var setDashTab = dashTabState[1];
  var channelChartModelState = React.useState('all');
  var channelChartModel = channelChartModelState[0];
  var setChannelChartModel = channelChartModelState[1];
  var projectChartModelState = React.useState('all');
  var projectChartModel = projectChartModelState[0];
  var setProjectChartModel = projectChartModelState[1];
  var dashFilterIdState = React.useState('all');
  var dashFilterId = dashFilterIdState[0];
  var setDashFilterId = dashFilterIdState[1];
  var dashScopeLabelState = React.useState('\u5168\u90E8\u6E20\u9053\uFF08\u9ED8\u8BA4\uFF09');
  var dashScopeLabel = dashScopeLabelState[0];
  var setDashScopeLabel = dashScopeLabelState[1];

  var usageDataState = React.useState(function () { return filterLogsForUsageLogPage(mockUsageLogs); });
  var usageData = usageDataState[0];
  var setUsageData = usageDataState[1];
  var usageFilterState = React.useState({ projectName: '', channel: '', model: '', groupId: '', logType: '' });
  var usageFilter = usageFilterState[0];
  var setUsageFilter = usageFilterState[1];

  var projectFilterState = React.useState({ keyword: '', type: '', status: '' });
  var projectFilter = projectFilterState[0];
  var setProjectFilter = projectFilterState[1];
  var channelFilterState = React.useState({ name: '', type: '', status: '' });
  var channelFilter = channelFilterState[0];
  var setChannelFilter = channelFilterState[1];
  var modelSearchState = React.useState('');
  var modelSearch = modelSearchState[0];
  var setModelSearch = modelSearchState[1];

  function showToast(msg, type) {
    setToast({ text: msg, type: type || 'success' });
    setTimeout(function () { setToast(null); }, 2800);
  }

  var logTypeColors = { 消耗: 'blue', 扣款: 'orange', 充值: 'green' };

  var styles = {
    layout: { display: 'flex', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Microsoft YaHei", sans-serif', backgroundColor: '#f0f2f5', color: 'rgba(0,0,0,0.88)' },
    sider: { width: collapsed ? 64 : 240, backgroundColor: '#001529', color: '#fff', flexShrink: 0, transition: 'width 0.2s', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 },
    brand: { display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', minHeight: 64, boxSizing: 'border-box' },
    logo: { width: 32, height: 32, borderRadius: 6, backgroundColor: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 },
    brandText: { marginLeft: 10, fontSize: 14, fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 },
    collapseBtn: { cursor: 'pointer', padding: '4px 8px', color: 'rgba(255,255,255,0.65)', fontSize: 14, flexShrink: 0 },
    menuWrap: { flex: 1, overflowY: 'auto', padding: '8px 0' },
    menuGroupTitle: { padding: '8px 16px', fontSize: 12, color: 'rgba(255,255,255,0.45)' },
    menuItem: { padding: '10px 16px 10px 24px', cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,0.85)', borderRadius: 6, margin: '2px 8px', display: 'flex', alignItems: 'center', gap: 8 },
    menuItemSelected: { backgroundColor: '#1677ff', color: '#fff' },
    menuItemDisabled: { color: 'rgba(255,255,255,0.25)', cursor: 'not-allowed', padding: '8px 16px 8px 40px', fontSize: 13 },
    submenuTitle: { padding: '10px 16px', cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    main: { marginLeft: collapsed ? 64 : 240, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', transition: 'margin-left 0.2s' },
    header: { position: 'sticky', top: 0, zIndex: 99, backgroundColor: '#fff', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
    breadcrumb: { fontSize: 14, color: 'rgba(0,0,0,0.45)' },
    breadcrumbActive: { color: 'rgba(0,0,0,0.88)' },
    headerRight: { display: 'flex', alignItems: 'center', gap: 20, fontSize: 14, color: 'rgba(0,0,0,0.65)' },
    bellWrap: { position: 'relative', cursor: 'pointer', fontSize: 18 },
    badge: { position: 'absolute', top: -6, right: -10, backgroundColor: '#ff4d4f', color: '#fff', fontSize: 10, borderRadius: 10, padding: '0 5px', lineHeight: '16px', minWidth: 16, textAlign: 'center' },
    avatar: { width: 32, height: 32, borderRadius: '50%', backgroundColor: '#1677ff', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, marginRight: 8 },
    content: { padding: 24, flex: 1, overflow: 'auto' },
    contentInner: { maxWidth: 1600, margin: '0 auto' },
    card: { backgroundColor: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 16 },
    pageHeader: { marginBottom: 16 },
    pageTitle: { fontSize: 20, fontWeight: 600, margin: 0, color: 'rgba(0,0,0,0.88)' },
    pageDesc: { marginTop: 8, fontSize: 14, color: 'rgba(0,0,0,0.45)', lineHeight: 1.6, maxWidth: 900 },
    pageHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 },
    filterPanel: { padding: 20, background: 'linear-gradient(180deg, #fafafa 0%, #fff 100%)', borderBottom: '1px solid #f0f0f0' },
    filterRow: { display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' },
    filterItem: { flex: '1 1 180px', minWidth: 140 },
    filterLabel: { display: 'block', fontSize: 13, color: 'rgba(0,0,0,0.65)', marginBottom: 6 },
    input: { width: '100%', padding: '6px 11px', fontSize: 14, border: '1px solid #d9d9d9', borderRadius: 6, boxSizing: 'border-box', outline: 'none' },
    select: { width: '100%', padding: '6px 11px', fontSize: 14, border: '1px solid #d9d9d9', borderRadius: 6, boxSizing: 'border-box', backgroundColor: '#fff' },
    btnPrimary: { padding: '6px 16px', fontSize: 14, borderRadius: 6, border: 'none', backgroundColor: '#1677ff', color: '#fff', cursor: 'pointer' },
    btnDefault: { padding: '6px 16px', fontSize: 14, borderRadius: 6, border: '1px solid #d9d9d9', backgroundColor: '#fff', color: 'rgba(0,0,0,0.88)', cursor: 'pointer', marginLeft: 8 },
    btnLink: { padding: 0, fontSize: 14, border: 'none', background: 'none', color: '#1677ff', cursor: 'pointer', marginRight: 12 },
    tableWrap: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    th: { textAlign: 'left', padding: '12px 16px', backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0', fontWeight: 600, whiteSpace: 'nowrap' },
    td: { padding: '12px 16px', borderBottom: '1px solid #f0f0f0', color: 'rgba(0,0,0,0.65)' },
    trHover: { backgroundColor: '#f5f9ff' },
    pagination: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '16px', gap: 8, fontSize: 13, color: 'rgba(0,0,0,0.65)' },
    statGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 },
    statCard: { backgroundColor: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' },
    statIcon: { width: 48, height: 48, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
    statTitle: { fontSize: 13, color: 'rgba(0,0,0,0.45)', marginBottom: 4 },
    statValue: { fontSize: 24, fontWeight: 600 },
    chartCard: { padding: 20 },
    chartTitle: { fontSize: 15, fontWeight: 600, marginBottom: 16 },
    tabs: { display: 'flex', borderBottom: '1px solid #f0f0f0', marginBottom: 0 },
    tab: { padding: '12px 24px', cursor: 'pointer', fontSize: 14, color: 'rgba(0,0,0,0.65)', borderBottom: '2px solid transparent', marginBottom: -1 },
    tabActive: { color: '#1677ff', borderBottomColor: '#1677ff', fontWeight: 500 },
    scopeBar: { padding: '12px 16px', backgroundColor: '#e6f4ff', borderRadius: 6, marginBottom: 16, fontSize: 13, color: 'rgba(0,0,0,0.65)' },
    toast: { position: 'fixed', top: 24, right: 24, zIndex: 9999, padding: '12px 20px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: 14, maxWidth: 360 },
    tableSummary: { padding: '12px 16px 0', fontSize: 13, color: 'rgba(0,0,0,0.65)' }
  };

  function TagEl(props) {
    var color = props.color || 'default';
    var colors = {
      success: { bg: '#f6ffed', border: '#b7eb8f', text: '#52c41a' },
      default: { bg: '#fafafa', border: '#d9d9d9', text: 'rgba(0,0,0,0.65)' },
      blue: { bg: '#e6f4ff', border: '#91caff', text: '#1677ff' },
      orange: { bg: '#fff7e6', border: '#ffd591', text: '#fa8c16' },
      green: { bg: '#f6ffed', border: '#b7eb8f', text: '#389e0d' }
    };
    var c = colors[color] || colors.default;
    return React.createElement('span', {
      style: { display: 'inline-block', padding: '2px 8px', fontSize: 12, lineHeight: '20px', borderRadius: 4, backgroundColor: c.bg, border: '1px solid ' + c.border, color: c.text }
    }, props.children);
  }

  function PageHeaderEl(props) {
    return React.createElement('div', { style: styles.pageHeader },
      React.createElement('div', { style: styles.pageHeaderRow },
        React.createElement('div', null,
          React.createElement('h1', { style: styles.pageTitle }, props.title),
          props.description ? React.createElement('p', { style: styles.pageDesc }, props.description) : null
        ),
        props.extra || null
      )
    );
  }

  function FilterPanelEl(props) {
    return React.createElement('div', { style: styles.filterPanel }, props.children);
  }

  function BtnPrimary(props) {
    return React.createElement('button', {
      type: 'button',
      style: styles.btnPrimary,
      onClick: props.onClick
    }, props.children);
  }

  function BtnDefault(props) {
    return React.createElement('button', {
      type: 'button',
      style: Object.assign({}, styles.btnDefault, props.style || {}),
      onClick: props.onClick
    }, props.children);
  }

  function BtnLink(props) {
    return React.createElement('button', {
      type: 'button',
      style: styles.btnLink,
      onClick: props.onClick
    }, props.children);
  }

  function StatCardEl(props) {
    return React.createElement('div', { style: styles.statCard },
      React.createElement('div', { style: Object.assign({}, styles.statIcon, { backgroundColor: props.bg, color: props.color }) }, props.icon),
      React.createElement('div', { style: { flex: 1 } },
        React.createElement('div', { style: styles.statTitle, title: props.tip },
          props.title, ' ', React.createElement('span', { style: { color: 'rgba(0,0,0,0.25)', cursor: 'help' } }, '\u24D8')
        ),
        React.createElement('div', { style: Object.assign({}, styles.statValue, { color: props.color }) },
          props.prefix || '', formatNum(props.value, props.precision != null ? props.precision : 0), props.suffix || ''
        )
      )
    );
  }

  function DataTable(props) {
    var pageState = React.useState(1);
    var page = pageState[0];
    var setPage = pageState[1];
    var pageSize = props.pageSize || 10;
    var data = props.dataSource || [];
    var total = data.length;
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    var start = (page - 1) * pageSize;
    var pageData = data.slice(start, start + pageSize);
    var hoverKeyState = React.useState(null);
    var hoverKey = hoverKeyState[0];
    var setHoverKey = hoverKeyState[1];

    return React.createElement('div', null,
      props.summary ? React.createElement('div', { style: styles.tableSummary }, props.summary) : null,
      React.createElement('div', { style: styles.tableWrap },
        React.createElement('table', { style: styles.table },
          React.createElement('thead', null,
            React.createElement('tr', null,
              props.columns.map(function (col) {
                return React.createElement('th', { key: col.key, style: Object.assign({}, styles.th, col.align ? { textAlign: col.align } : {}) }, col.title);
              })
            )
          ),
          React.createElement('tbody', null,
            pageData.map(function (row, ri) {
              var rk = row[props.rowKey] || ('row-' + ri);
              var isHover = hoverKey === rk;
              return React.createElement('tr', {
                key: rk,
                style: isHover ? styles.trHover : {},
                onMouseEnter: function () { setHoverKey(rk); },
                onMouseLeave: function () { setHoverKey(null); }
              },
                props.columns.map(function (col) {
                  var val = col.dataIndex ? row[col.dataIndex] : undefined;
                  var content = col.render ? col.render(val, row, ri) : val;
                  return React.createElement('td', { key: col.key, style: Object.assign({}, styles.td, col.align ? { textAlign: col.align } : {}) }, content);
                })
              );
            })
          )
        )
      ),
      React.createElement('div', { style: styles.pagination },
        React.createElement('span', null, '\u5171 ' + total + ' \u6761'),
        React.createElement(BtnDefault, {
          onClick: function () { if (page > 1) setPage(page - 1); },
          style: { marginLeft: 16 }
        }, '\u4E0A\u4E00\u9875'),
        React.createElement('span', { style: { margin: '0 8px' } }, page + ' / ' + totalPages),
        React.createElement(BtnDefault, {
          onClick: function () { if (page < totalPages) setPage(page + 1); }
        }, '\u4E0B\u4E00\u9875')
      )
    );
  }

  function LineChartSVG(props) {
    var w = props.width || 560;
    var h = props.height || 220;
    var pad = { top: 20, right: 20, bottom: 36, left: 52 };
    var iw = w - pad.left - pad.right;
    var ih = h - pad.top - pad.bottom;
    var series = props.series || [];
    var dates = props.dates || [];
    var maxV = 1;
    var si, di;
    for (si = 0; si < series.length; si++) {
      for (di = 0; di < series[si].data.length; di++) {
        if (series[si].data[di] > maxV) maxV = series[si].data[di];
      }
    }
    var paths = [];
    for (si = 0; si < series.length; si++) {
      var pts = [];
      for (di = 0; di < series[si].data.length; di++) {
        var x = pad.left + (dates.length <= 1 ? 0 : (di / (dates.length - 1)) * iw);
        var y = pad.top + ih - (series[si].data[di] / maxV) * ih;
        pts.push(x + ',' + y);
      }
      paths.push(React.createElement('polyline', {
        key: 's-' + si,
        fill: 'none',
        stroke: series[si].color,
        strokeWidth: 2,
        points: pts.join(' ')
      }));
    }
    var labels = [];
    for (di = 0; di < dates.length; di++) {
      var lx = pad.left + (dates.length <= 1 ? 0 : (di / (dates.length - 1)) * iw);
      labels.push(React.createElement('text', {
        key: 'd-' + di,
        x: lx,
        y: h - 8,
        textAnchor: 'middle',
        fontSize: 11,
        fill: 'rgba(0,0,0,0.45)'
      }, dates[di]));
    }
    var legend = [];
    for (si = 0; si < series.length; si++) {
      legend.push(React.createElement('g', { key: 'leg-' + si, transform: 'translate(' + (pad.left + si * 120) + ',12)' },
        React.createElement('rect', { width: 12, height: 3, fill: series[si].color, y: 6 }),
        React.createElement('text', { x: 18, y: 12, fontSize: 11, fill: 'rgba(0,0,0,0.65)' }, series[si].name)
      ));
    }
    return React.createElement('svg', { width: '100%', viewBox: '0 0 ' + w + ' ' + h, style: { display: 'block' } },
      React.createElement('line', { x1: pad.left, y1: pad.top + ih, x2: pad.left + iw, y2: pad.top + ih, stroke: '#f0f0f0' }),
      paths,
      labels,
      legend
    );
  }

  function BarChartSVG(props) {
    var w = props.width || 560;
    var h = props.height || 220;
    var pad = { top: 32, right: 20, bottom: 36, left: 48 };
    var iw = w - pad.left - pad.right;
    var ih = h - pad.top - pad.bottom;
    var dates = props.dates || [];
    var series = props.series || [];
    var colors = ['#722ed1', '#1677ff', '#52c41a', '#fa8c16', '#13c2c2'];
    var maxV = 1;
    var si, di;
    for (si = 0; si < series.length; si++) {
      for (di = 0; di < series[si].data.length; di++) {
        if (series[si].data[di] > maxV) maxV = series[si].data[di];
      }
    }
    var groupW = iw / dates.length;
    var barW = Math.min(16, (groupW / Math.max(series.length, 1)) * 0.7);
    var bars = [];
    for (di = 0; di < dates.length; di++) {
      for (si = 0; si < series.length; si++) {
        var bh = (series[si].data[di] / maxV) * ih;
        var bx = pad.left + di * groupW + (groupW - barW * series.length) / 2 + si * barW;
        var by = pad.top + ih - bh;
        bars.push(React.createElement('rect', {
          key: 'b-' + di + '-' + si,
          x: bx,
          y: by,
          width: barW,
          height: bh,
          fill: colors[si % colors.length],
          rx: 4
        }));
      }
    }
    var labels = [];
    for (di = 0; di < dates.length; di++) {
      labels.push(React.createElement('text', {
        key: 'bd-' + di,
        x: pad.left + di * groupW + groupW / 2,
        y: h - 8,
        textAnchor: 'middle',
        fontSize: 11,
        fill: 'rgba(0,0,0,0.45)'
      }, dates[di]));
    }
    var legend = [];
    for (si = 0; si < series.length; si++) {
      legend.push(React.createElement('g', { key: 'bl-' + si, transform: 'translate(' + (pad.left + si * 100) + ',8)' },
        React.createElement('rect', { width: 10, height: 10, fill: colors[si % colors.length], rx: 2 }),
        React.createElement('text', { x: 16, y: 10, fontSize: 11, fill: 'rgba(0,0,0,0.65)' }, series[si].name)
      ));
    }
    return React.createElement('svg', { width: '100%', viewBox: '0 0 ' + w + ' ' + h, style: { display: 'block' } },
      React.createElement('line', { x1: pad.left, y1: pad.top + ih, x2: pad.left + iw, y2: pad.top + ih, stroke: '#f0f0f0' }),
      bars,
      labels,
      legend
    );
  }

  function getBarSeries(modelFilter) {
    if (modelFilter === 'all') return barModelsAll.series;
    var out = [];
    for (var i = 0; i < barModelsAll.series.length; i++) {
      if (barModelsAll.series[i].name === modelFilter) out.push(barModelsAll.series[i]);
    }
    return out.length ? out : barModelsAll.series;
  }

  function toggleOpenKey(key) {
    var next = openKeys.slice();
    var idx = next.indexOf(key);
    if (idx >= 0) next.splice(idx, 1);
    else next.push(key);
    setOpenKeys(next);
  }

  function isOpen(key) {
    return openKeys.indexOf(key) >= 0;
  }

  function renderMenuItem(key, label) {
    var selected = selectedKey === key;
    var itemStyle = Object.assign({}, styles.menuItem, { paddingLeft: 48 });
    if (selected) itemStyle = Object.assign({}, itemStyle, styles.menuItemSelected);
    var icon = menuIcons[key] || '';
    return React.createElement('div', {
      key: key,
      style: itemStyle,
      onClick: function () { setSelectedKey(key); }
    }, React.createElement('span', { style: { opacity: 0.85 } }, icon), label);
  }

  function renderSideMenu() {
    var tokenOpen = isOpen('token-project');
    var children = [];
    if (tokenOpen) {
      children.push(renderMenuItem('dashboard', menuLabels.dashboard));
      children.push(renderMenuItem('usage-log', menuLabels['usage-log']));
      children.push(renderMenuItem('project', menuLabels.project));
      children.push(renderMenuItem('channel', menuLabels.channel));
      children.push(renderMenuItem('model-pricing', menuLabels['model-pricing']));
      children.push(renderMenuItem('group', menuLabels.group));
    }
    var ifaceChildren = ['数据看板', '计价管理', '接口管理', '成本管理'];
  return React.createElement('div', { style: styles.menuWrap },
      React.createElement('div', { style: Object.assign({}, styles.menuGroupTitle, { cursor: 'not-allowed' }) }, '\u63A5\u53E3\u9879\u76EE'),
      ifaceChildren.map(function (c, i) {
        return React.createElement('div', { key: 'iface-' + i, style: styles.menuItemDisabled }, c);
      }),
      React.createElement('div', {
        style: styles.submenuTitle,
        onClick: function () { toggleOpenKey('token-project'); }
      }, React.createElement('span', null, 'token\u9879\u76EE'), React.createElement('span', null, tokenOpen ? '\u25BC' : '\u25B6')),
      children,
      React.createElement('div', { style: Object.assign({}, styles.menuGroupTitle, { marginTop: 8, cursor: 'not-allowed' }) }, '\u7CFB\u7EDF\u7BA1\u7406')
    );
  }

  function renderDashboard() {
    var channelStats = [
      { title: '\u603B\u8C03\u7528 Token \u6570', tip: '\u542B\u6E20\u9053\u6D4B\u8BD5\u5728\u5185\u7684 Token \u6D88\u8017\u603B\u91CF', value: 284560, suffix: ' tokens', color: '#1677ff', bg: 'rgba(22,119,255,0.1)', icon: '\u26A1' },
      { title: '\u603B Token \u6D88\u8D39\u6210\u672C\u91D1\u989D', tip: '\u6E20\u9053\u5355\u4EF7 \u00D7 Token \u6570\u91CF\uFF08\u542B\u6E20\u9053\u6D4B\u8BD5\uFF0CCNY\uFF09', value: 89234.56, prefix: '\u00A5', precision: 2, color: '#13c2c2', bg: 'rgba(19,194,194,0.1)', icon: '\u00A5' },
      { title: '\u603B\u5229\u6DA6', tip: '\u5BA2\u6237\u5355\u4EF7 \u00D7 Token \u2212 \u6E20\u9053\u5355\u4EF7 \u00D7 Token\uFF08CNY\uFF09', value: 15230.8, prefix: '\u00A5', precision: 2, color: '#fa8c16', bg: 'rgba(250,140,22,0.1)', icon: '\u2197' },
      { title: '\u603B\u6A21\u578B\u8C03\u7528\u6B21\u6570', tip: '\u300C\u6D88\u8017\u300D\u7C7B\u65E5\u5FD7\u6761\u6570', value: 12458, suffix: ' \u6B21', color: '#722ed1', bg: 'rgba(114,46,209,0.1)', icon: '\u2699' }
    ];
    var projectStats = [
      { title: '\u603B\u8C03\u7528 Token \u6570', tip: '\u9879\u76EE\u7BA1\u7406\u5185\u9879\u76EE\u7684 Token \u6D88\u8017\u603B\u91CF', value: 256890, suffix: ' tokens', color: '#1677ff', bg: 'rgba(22,119,255,0.1)', icon: '\u26A1' },
      { title: '\u603B Token \u6D88\u8D39\u91D1\u989D', tip: '\u5BA2\u6237\u5355\u4EF7 \u00D7 Token \u6570\uFF08CNY\uFF09', value: 76890.12, prefix: '\u00A5', precision: 2, color: '#52c41a', bg: 'rgba(82,196,26,0.1)', icon: '\u00A5' },
      { title: '\u603B\u5229\u6DA6', tip: '\u5BA2\u6237\u6D88\u8D39 \u2212 \u6E20\u9053\u6210\u672C\uFF08CNY\uFF09', value: 12890.5, prefix: '\u00A5', precision: 2, color: '#fa8c16', bg: 'rgba(250,140,22,0.1)', icon: '\u2197' },
      { title: '\u603B\u6A21\u578B\u8C03\u7528\u6B21\u6570', tip: '\u300C\u6D88\u8017\u300D\u7C7B\u65E5\u5FD7\u6761\u6570', value: 10234, suffix: ' \u6B21', color: '#722ed1', bg: 'rgba(114,46,209,0.1)', icon: '\u2699' }
    ];
    var activeStats = dashTab === 'channel' ? channelStats : projectStats;
    var lineSeries = dashTab === 'channel' ? channelLineSeries : projectLineSeries;
    var chartModel = dashTab === 'channel' ? channelChartModel : projectChartModel;
    var setChartModel = dashTab === 'channel' ? setChannelChartModel : setProjectChartModel;

    return React.createElement('div', null,
      PageHeaderEl({
        title: '\u6570\u636E\u770B\u677F',
        description: '\u901A\u8FC7 Tab \u5207\u6362\u6E20\u9053\u4FA7\u6210\u672C\u4E0E\u9879\u76EE\u6D88\u8D39\u7EDF\u8BA1\uFF1B\u6A21\u578B\u8C03\u7528\u8D8B\u52BF\u56FE\u652F\u6301\u6309\u6A21\u578B\u7B5B\u9009\u3002'
      }),
      React.createElement('div', { style: styles.card },
        React.createElement('div', { style: styles.tabs },
          React.createElement('div', {
            style: Object.assign({}, styles.tab, dashTab === 'channel' ? styles.tabActive : {}),
            onClick: function () {
              setDashTab('channel');
              setDashFilterId('all');
              setDashScopeLabel('\u5168\u90E8\u6E20\u9053\uFF08\u9ED8\u8BA4\uFF09');
            }
          }, '\u6E20\u9053\u770B\u677F'),
          React.createElement('div', {
            style: Object.assign({}, styles.tab, dashTab === 'project' ? styles.tabActive : {}),
            onClick: function () {
              setDashTab('project');
              setDashFilterId('all');
              setDashScopeLabel('\u5168\u90E8\u9879\u76EE\uFF08\u9ED8\u8BA4\uFF09');
            }
          }, '\u9879\u76EE\u770B\u677F')
        ),
        React.createElement('div', { style: { padding: 20 } },
          React.createElement(FilterPanelEl, null,
            React.createElement('div', { style: { fontWeight: 600, marginBottom: 12, fontSize: 14 } }, '\u25BD \u7B5B\u9009\u6761\u4EF6'),
            React.createElement('div', { style: styles.filterRow },
              React.createElement('div', { style: styles.filterItem },
                React.createElement('label', { style: styles.filterLabel }, dashTab === 'channel' ? '\u6240\u5C5E\u6E20\u9053' : '\u6240\u5C5E\u9879\u76EE'),
                React.createElement('select', {
                  style: styles.select,
                  value: dashFilterId,
                  onChange: function (e) { setDashFilterId(e.target.value); }
                },
                  React.createElement('option', { value: 'all' }, dashTab === 'channel' ? '\u5168\u90E8\u6E20\u9053\uFF08\u9ED8\u8BA4\uFF09' : '\u5168\u90E8\u9879\u76EE\uFF08\u9ED8\u8BA4\uFF09'),
                  dashTab === 'channel'
                    ? mockChannels.map(function (c) { return React.createElement('option', { key: c.id, value: c.id }, c.name); })
                    : mockProjects.map(function (p) { return React.createElement('option', { key: p.id, value: p.id }, p.name); })
                )
              ),
              React.createElement('div', { style: Object.assign({}, styles.filterItem, { flex: '2 1 280px' }) },
                React.createElement('label', { style: styles.filterLabel }, '\u7EDF\u8BA1\u65F6\u95F4\u6BB5'),
                React.createElement('input', { style: styles.input, placeholder: 'YYYY-MM-DD HH:mm \u2014 YYYY-MM-DD HH:mm' })
              ),
              React.createElement('div', { style: { flex: '0 0 auto', paddingBottom: 2 } },
                BtnPrimary({
                  onClick: function () {
                    var label = dashTab === 'channel' ? '\u5168\u90E8\u6E20\u9053\uFF08\u9ED8\u8BA4\uFF09' : '\u5168\u90E8\u9879\u76EE\uFF08\u9ED8\u8BA4\uFF09';
                    if (dashFilterId !== 'all') {
                      var i;
                      if (dashTab === 'channel') {
                        for (i = 0; i < mockChannels.length; i++) {
                          if (mockChannels[i].id === dashFilterId) label = mockChannels[i].name;
                        }
                      } else {
                        for (i = 0; i < mockProjects.length; i++) {
                          if (mockProjects[i].id === dashFilterId) label = mockProjects[i].name;
                        }
                      }
                    }
                    setDashScopeLabel(label);
                    showToast('\u7EDF\u8BA1\u6570\u636E\u5DF2\u66F4\u65B0');
                  },
                  children: '\u67E5\u8BE2'
                }),
                BtnDefault({
                  onClick: function () {
                    setDashFilterId('all');
                    setDashScopeLabel(dashTab === 'channel' ? '\u5168\u90E8\u6E20\u9053\uFF08\u9ED8\u8BA4\uFF09' : '\u5168\u90E8\u9879\u76EE\uFF08\u9ED8\u8BA4\uFF09');
                    showToast('\u7B5B\u9009\u5DF2\u91CD\u7F6E', 'info');
                  },
                  children: '\u91CD\u7F6E'
                })
              )
            )
          ),
          React.createElement('div', { style: styles.scopeBar },
            '\u5F53\u524D\u7EDF\u8BA1\u8303\u56F4\uFF1A', dashScopeLabel
          ),
          React.createElement('div', { style: styles.statGrid },
            activeStats.map(function (s, i) {
              return React.createElement(StatCardEl, {
                key: 'st-' + i,
                title: s.title,
                tip: s.tip,
                value: s.value,
                suffix: s.suffix,
                prefix: s.prefix,
                precision: s.precision,
                color: s.color,
                bg: s.bg,
                icon: s.icon
              });
            })
          ),
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } },
            React.createElement('div', { style: Object.assign({}, styles.card, styles.chartCard) },
              React.createElement('div', { style: styles.chartTitle }, 'Token / \u91D1\u989D\u8D8B\u52BF'),
              LineChartSVG({ dates: chartDates, series: lineSeries, width: 600, height: 240 })
            ),
            React.createElement('div', { style: Object.assign({}, styles.card, styles.chartCard) },
              React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
                React.createElement('div', { style: styles.chartTitle, marginBottom: 0 }, '\u6A21\u578B\u8C03\u7528\u6B21\u6570'),
                React.createElement('div', { style: { fontSize: 13 } },
                  React.createElement('span', { style: { color: 'rgba(0,0,0,0.45)', marginRight: 8 } }, '\u6A21\u578B\u7B5B\u9009'),
                  React.createElement('select', {
                    style: Object.assign({}, styles.select, { width: 180, display: 'inline-block' }),
                    value: chartModel,
                    onChange: function (e) { setChartModel(e.target.value); }
                  },
                    React.createElement('option', { value: 'all' }, '\u5168\u90E8\u6A21\u578B'),
                    React.createElement('option', { value: 'gpt-4o' }, 'gpt-4o'),
                    React.createElement('option', { value: 'gpt-4o-mini' }, 'gpt-4o-mini'),
                    React.createElement('option', { value: 'claude-3-5-sonnet' }, 'claude-3-5-sonnet')
                  )
                )
              ),
              BarChartSVG({ dates: barModelsAll.dates, series: getBarSeries(chartModel), width: 600, height: 240 })
            )
          )
        )
      )
    );
  }

  function renderUsageLog() {
    function handleSearch() {
      var rows = filterLogsForUsageLogPage(mockUsageLogs);
      var kw, gname, gi;
      if (usageFilter.projectName && usageFilter.projectName.trim()) {
        kw = usageFilter.projectName.trim().toLowerCase();
        rows = rows.filter(function (r) { return r.projectName.toLowerCase().indexOf(kw) >= 0; });
      }
      if (usageFilter.channel && usageFilter.channel.trim()) {
        kw = usageFilter.channel.trim().toLowerCase();
        rows = rows.filter(function (r) { return r.channel.toLowerCase().indexOf(kw) >= 0; });
      }
      if (usageFilter.model && usageFilter.model.trim()) {
        kw = usageFilter.model.trim().toLowerCase();
        rows = rows.filter(function (r) { return r.model.toLowerCase().indexOf(kw) >= 0; });
      }
      if (usageFilter.groupId) {
        gname = getGroupName(usageFilter.groupId);
        rows = rows.filter(function (r) { return r.token.indexOf(gname) >= 0; });
      }
      if (usageFilter.logType) {
        rows = rows.filter(function (r) { return matchesUsageLogTypeFilter(r, usageFilter.logType); });
      }
      setUsageData(rows);
      showToast('\u67E5\u8BE2\u5B8C\u6210');
    }

    var columns = [
      { key: 'projectName', title: '\u9879\u76EE\u540D\u79F0', dataIndex: 'projectName' },
      { key: 'type', title: '\u7C7B\u578B', dataIndex: 'type', render: function (v) { return TagEl({ color: logTypeColors[v], children: v }); } },
      { key: 'time', title: '\u65F6\u95F4', dataIndex: 'time' },
      { key: 'channel', title: '\u6E20\u9053', dataIndex: 'channel' },
      { key: 'token', title: '\u4EE4\u724C', dataIndex: 'token' },
      { key: 'model', title: '\u6A21\u578B', dataIndex: 'model' },
      { key: 'duration', title: '\u8017\u65F6', dataIndex: 'duration' },
      { key: 'tokens', title: 'Tokens', render: function (_, r) {
        if (r.inputTokens === 0 && r.outputTokens === 0) return '-';
        return formatNum(r.inputTokens, 0) + ' / ' + formatNum(r.outputTokens, 0) + ' (' + formatNum(r.inputTokens + r.outputTokens, 0) + ')';
      }, align: 'right' },
      { key: 'cost', title: '\u8D39\u7528 (CNY)', dataIndex: 'cost', align: 'right', render: function (v, r) {
        if (isProjectBalanceOpLog(r)) {
          var isDeduct = r.type === '\u6263\u6B3E';
          return React.createElement('span', { style: { fontFamily: 'monospace', fontSize: 12, color: isDeduct ? '#cf1322' : '#389e0d', fontWeight: 500 } },
            isDeduct ? '\u2212' : '+', formatCny2(Math.abs(v)));
        }
        return React.createElement('span', { style: { fontFamily: 'monospace', fontSize: 12, color: v < 0 ? '#fa8c16' : undefined } }, formatCny2(v));
      } },
      { key: 'balance', title: '\u5F53\u524D\u4F59\u989D (CNY)', align: 'right', render: function (_, r) {
        return shouldShowBalanceAfter(r)
          ? React.createElement('span', { style: { fontFamily: 'monospace', fontSize: 12 } }, formatCny2(r.balanceAfter))
          : React.createElement('span', { style: { color: 'rgba(0,0,0,0.25)' } }, '-');
      } },
      { key: 'remark', title: '\u8BE6\u60C5/\u5907\u6CE8', dataIndex: 'remark' }
    ];

    return React.createElement('div', null,
      PageHeaderEl({
        title: '\u4F7F\u7528\u65E5\u5FD7',
        description: '\u6309\u65F6\u95F4\u6BB5\u3001\u9879\u76EE\u540D\u79F0\u3001\u6E20\u9053\u3001\u6A21\u578B\u3001\u5206\u7EC4\u4E0E\u65E5\u5FD7\u7C7B\u578B\u67E5\u8BE2\u3002\u300C\u5145\u503C\u300D\u300C\u6263\u6B3E\u300D\u5747\u4EC5\u542B\u9879\u76EE\u4F59\u989D\u53D8\u52A8\uFF08\u8FD0\u8425\u7BA1\u7406\uFF09\uFF1B\u8C03\u7528\u5931\u8D25\u6263\u6B3E\u3001\u5BC6\u94A5\u76F8\u5173\u53D8\u52A8\u4E0D\u8BA1\u5165\u3002\u5F53\u524D\u4F59\u989D\u4EC5\u4E0A\u8FF0\u8BB0\u5F55\u6709\u503C\u3002\u6E20\u9053\u6D4B\u8BD5\u8BB0\u4E3A\u300C\u7075\u6570\u8FD0\u8425\u5E73\u53F0\u300D\u3002'
      }),
      React.createElement('div', { style: styles.card },
        React.createElement(FilterPanelEl, null,
          React.createElement('div', { style: styles.filterRow },
            React.createElement('div', { style: Object.assign({}, styles.filterItem, { flex: '2 1 240px' }) },
              React.createElement('label', { style: styles.filterLabel }, '\u65F6\u95F4\u6BB5'),
              React.createElement('input', { style: styles.input, placeholder: 'YYYY-MM-DD HH:mm' })
            ),
            React.createElement('div', { style: styles.filterItem },
              React.createElement('label', { style: styles.filterLabel }, '\u9879\u76EE\u540D\u79F0'),
              React.createElement('input', { style: styles.input, placeholder: '\u6A21\u7CCA\u67E5\u8BE2', value: usageFilter.projectName, onChange: function (e) { setUsageFilter(Object.assign({}, usageFilter, { projectName: e.target.value })); } })
            ),
            React.createElement('div', { style: styles.filterItem },
              React.createElement('label', { style: styles.filterLabel }, '\u6E20\u9053\u540D\u79F0'),
              React.createElement('input', { style: styles.input, placeholder: '\u6A21\u7CCA\u67E5\u8BE2', value: usageFilter.channel, onChange: function (e) { setUsageFilter(Object.assign({}, usageFilter, { channel: e.target.value })); } })
            ),
            React.createElement('div', { style: styles.filterItem },
              React.createElement('label', { style: styles.filterLabel }, '\u6A21\u578B\u540D\u79F0'),
              React.createElement('input', { style: styles.input, placeholder: '\u8BF7\u8F93\u5165', value: usageFilter.model, onChange: function (e) { setUsageFilter(Object.assign({}, usageFilter, { model: e.target.value })); } })
            ),
            React.createElement('div', { style: styles.filterItem },
              React.createElement('label', { style: styles.filterLabel }, '\u5206\u7EC4'),
              React.createElement('select', { style: styles.select, value: usageFilter.groupId, onChange: function (e) { setUsageFilter(Object.assign({}, usageFilter, { groupId: e.target.value })); } },
                React.createElement('option', { value: '' }, '\u5168\u90E8'),
                mockGroups.map(function (g) { return React.createElement('option', { key: g.id, value: g.id }, g.name); })
              )
            ),
            React.createElement('div', { style: styles.filterItem },
              React.createElement('label', { style: styles.filterLabel }, '\u65E5\u5FD7\u7C7B\u578B'),
              React.createElement('select', { style: styles.select, value: usageFilter.logType, onChange: function (e) { setUsageFilter(Object.assign({}, usageFilter, { logType: e.target.value })); } },
                React.createElement('option', { value: '' }, '\u5168\u90E8'),
                React.createElement('option', { value: '\u6D88\u8017' }, '\u6D88\u8017'),
                React.createElement('option', { value: '\u6263\u6B3E' }, '\u6263\u6B3E'),
                React.createElement('option', { value: '\u5145\u503C' }, '\u5145\u503C')
              )
            ),
            React.createElement('div', { style: { flex: '0 0 auto' } },
              BtnPrimary({ onClick: handleSearch, children: '\u67E5\u8BE2' }),
              BtnDefault({ onClick: function () { setUsageFilter({ projectName: '', channel: '', model: '', groupId: '', logType: '' }); setUsageData(filterLogsForUsageLogPage(mockUsageLogs)); showToast('\u5DF2\u91CD\u7F6E', 'info'); }, children: '\u91CD\u7F6E' }),
              BtnDefault({ onClick: function () { showToast('\u5BFC\u51FA\u529F\u80FD\u539F\u578B\u6F14\u793A', 'info'); }, children: '\u5BFC\u51FA' })
            )
          )
        ),
        DataTable({ rowKey: 'id', columns: columns, dataSource: usageData, pageSize: 10, summary: React.createElement('span', null, '\u5171 ', React.createElement('strong', null, usageData.length), ' \u6761\u8BB0\u5F55') })
      )
    );
  }

  function filterProjects() {
    return mockProjects.filter(function (p) {
      if (projectFilter.keyword && projectFilter.keyword.trim()) {
        var kw = projectFilter.keyword.trim().toLowerCase();
        if (p.name.toLowerCase().indexOf(kw) < 0 && p.code.toLowerCase().indexOf(kw) < 0) return false;
      }
      if (projectFilter.type && p.type !== projectFilter.type) return false;
      if (projectFilter.status && p.status !== projectFilter.status) return false;
      return true;
    });
  }

  function renderProject() {
    var projCols = [
      { key: 'idx', title: '\u5E8F\u53F7', render: function (_, __, i) { return i + 1; } },
      { key: 'code', title: '\u9879\u76EE\u7F16\u53F7', dataIndex: 'code' },
      { key: 'name', title: '\u9879\u76EE\u540D\u79F0', dataIndex: 'name' },
      { key: 'type', title: '\u9879\u76EE\u7C7B\u578B', render: function (_, r) { return r.type === 'saas' ? TagEl({ color: 'blue', children: 'SaaS' }) : TagEl({ color: 'default', children: '\u672C\u5730\u5316\u90E8\u7F72' }); } },
      { key: 'status', title: '\u72B6\u6001', render: function (_, r) { return TagEl({ color: r.status === 'enabled' ? 'success' : 'default', children: r.status === 'enabled' ? '\u5DF2\u542F\u7528' : '\u5DF2\u7981\u7528' }); } },
      { key: 'company', title: '\u516C\u53F8', dataIndex: 'company' },
      { key: 'remark', title: '\u5907\u6CE8', dataIndex: 'remark' },
      { key: 'keys', title: '\u5BC6\u94A5\u6570\u91CF\u603B\u548C', render: function (_, r) { return getProjectKeyCount(r.id); } },
      { key: 'quotaMode', title: '\u989D\u5EA6\u9650\u5236', render: function (_, r) { return TagEl({ color: r.quotaMode === 'unlimited' ? 'orange' : 'blue', children: r.quotaMode === 'unlimited' ? '\u65E0\u9650\u5236' : '\u9650\u989D' }); } },
      { key: 'quota', title: '\u9879\u76EE\u989D\u5EA6/\u6D88\u8D39\u603B\u989D', render: function (_, r) {
        if (r.quotaMode === 'unlimited') return React.createElement('span', { style: { fontFamily: 'monospace', fontSize: 12 } }, '\u6D88\u8D39 ' + formatCny2(r.consumptionTotal));
        return React.createElement('span', { style: { fontFamily: 'monospace', fontSize: 12 } }, formatCny2(r.remainingQuota) + ' / ' + formatCny2(r.totalQuota));
      } },
      { key: 'updatedAt', title: '\u66F4\u65B0\u65F6\u95F4', dataIndex: 'updatedAt' },
      { key: 'actions', title: '\u64CD\u4F5C', render: function (_, r) {
        return React.createElement('span', null,
          BtnLink({ onClick: function () { showToast('\u7F16\u8F91\u9879\u76EE\uFF1A' + r.name); }, children: '\u7F16\u8F91' }),
          BtnLink({ onClick: function () { showToast('\u5BC6\u94A5\u914D\u7F6E\uFF1A' + r.name); }, children: '\u5BC6\u94A5' }),
          BtnLink({ onClick: function () { showToast('\u67E5\u770B\u7528\u91CF\uFF1A' + r.name); }, children: '\u7528\u91CF' }),
          BtnLink({ onClick: function () { showToast(r.status === 'enabled' ? '\u5145\u503C/\u505C\u7528' : '\u5145\u503C/\u542F\u7528'); }, children: r.status === 'enabled' ? '\u5145\u503C/\u505C\u7528' : '\u5145\u503C/\u542F\u7528' })
        );
      } }
    ];
    return React.createElement('div', null,
      PageHeaderEl({
        title: '\u9879\u76EE\u7BA1\u7406',
        description: '\u7BA1\u7406 token \u9879\u76EE\u53CA API \u5BC6\u94A5\uFF0C\u652F\u6301\u672C\u5730\u5316\u90E8\u7F72\u4E0E SaaS\uFF1B\u53EF\u914D\u7F6E\u5BC6\u94A5\u3001\u67E5\u770B\u9879\u76EE\u4F7F\u7528\u65E5\u5FD7\u3002',
        extra: BtnPrimary({ onClick: function () { showToast('\u65B0\u5EFA\u9879\u76EE\uFF08\u6F14\u793A\uFF09'); }, children: '\u65B0\u5EFA\u9879\u76EE' })
      }),
      React.createElement('div', { style: styles.card },
        React.createElement(FilterPanelEl, null,
          React.createElement('div', { style: styles.filterRow },
            React.createElement('div', { style: styles.filterItem },
              React.createElement('label', { style: styles.filterLabel }, '\u9879\u76EE\u540D\u79F0/\u7F16\u53F7'),
              React.createElement('input', { style: styles.input, placeholder: '\u6A21\u7CCA\u67E5\u8BE2', value: projectFilter.keyword, onChange: function (e) { setProjectFilter(Object.assign({}, projectFilter, { keyword: e.target.value })); } })
            ),
            React.createElement('div', { style: styles.filterItem },
              React.createElement('label', { style: styles.filterLabel }, '\u9879\u76EE\u7C7B\u578B'),
              React.createElement('select', { style: styles.select, value: projectFilter.type, onChange: function (e) { setProjectFilter(Object.assign({}, projectFilter, { type: e.target.value })); } },
                React.createElement('option', { value: '' }, '\u5168\u90E8'),
                React.createElement('option', { value: 'local' }, '\u672C\u5730\u5316\u90E8\u7F72'),
                React.createElement('option', { value: 'saas' }, 'SaaS')
              )
            ),
            React.createElement('div', { style: styles.filterItem },
              React.createElement('label', { style: styles.filterLabel }, '\u72B6\u6001'),
              React.createElement('select', { style: styles.select, value: projectFilter.status, onChange: function (e) { setProjectFilter(Object.assign({}, projectFilter, { status: e.target.value })); } },
                React.createElement('option', { value: '' }, '\u5168\u90E8'),
                React.createElement('option', { value: 'enabled' }, '\u5DF2\u542F\u7528'),
                React.createElement('option', { value: 'disabled' }, '\u5DF2\u7981\u7528')
              )
            ),
            React.createElement('div', { style: { flex: '0 0 auto' } },
              BtnPrimary({ onClick: function () { showToast('\u67E5\u8BE2\u5B8C\u6210'); }, children: '\u67E5\u8BE2' }),
              BtnDefault({ onClick: function () { setProjectFilter({ keyword: '', type: '', status: '' }); showToast('\u5DF2\u91CD\u7F6E', 'info'); }, children: '\u91CD\u7F6E' })
            )
          )
        ),
        DataTable({ rowKey: 'id', columns: projCols, dataSource: filterProjects(), pageSize: 10 })
      )
    );
  }

  function filterChannels() {
    return mockChannels.filter(function (c) {
      if (channelFilter.name && channelFilter.name.trim()) {
        var kw = channelFilter.name.trim().toLowerCase();
        if (c.name.toLowerCase().indexOf(kw) < 0) return false;
      }
      if (channelFilter.type && c.type !== channelFilter.type) return false;
      if (channelFilter.status && c.status !== channelFilter.status) return false;
      return true;
    });
  }

  function renderChannel() {
    var chCols = [
      { key: 'name', title: '\u540D\u79F0', dataIndex: 'name' },
      { key: 'type', title: '\u7C7B\u578B', dataIndex: 'type' },
      { key: 'status', title: '\u72B6\u6001', render: function (_, r) { return TagEl({ color: r.status === 'enabled' ? 'success' : 'default', children: r.status === 'enabled' ? '\u542F\u7528' : '\u7981\u7528' }); } },
      { key: 'groups', title: '\u5206\u7EC4', render: function (_, r) {
        var names = [];
        for (var i = 0; i < r.groupIds.length; i++) names.push(getGroupName(r.groupIds[i]));
        return names.join(', ');
      } },
      { key: 'used', title: '\u5DF2\u4F7F\u7528\u91D1\u989D / \u5DF2\u4F7F\u7528 Token \u603B\u6570', render: function (_, r) {
        var st = getChannelUsedStats(r.name);
        return React.createElement('span', { style: { fontFamily: 'monospace', fontSize: 12 } }, formatCny2(st.usedAmount) + ' / ' + formatNum(st.usedTokens, 0));
      } },
      { key: 'remaining', title: '\u53C2\u8003\u4F59\u989D', align: 'right', render: function (_, r) {
        return React.createElement('span', { style: { fontFamily: 'monospace', fontSize: 12, color: '#1677ff' } }, formatCny2(r.remaining));
      } },
      { key: 'responseTime', title: '\u54CD\u5E94', dataIndex: 'responseTime' },
      { key: 'lastTestTime', title: '\u4E0A\u6B21\u6D4B\u8BD5', dataIndex: 'lastTestTime' },
      { key: 'actions', title: '\u64CD\u4F5C', render: function (_, r) {
        return React.createElement('span', null,
          BtnLink({ onClick: function () { showToast('\u7F16\u8F91\u6E20\u9053\uFF1A' + r.name); }, children: '\u7F16\u8F91' }),
          BtnLink({ onClick: function () { showToast('\u5145\u503C\uFF1A' + r.name); }, children: '\u5145\u503C' }),
          BtnLink({ onClick: function () { showToast('\u67E5\u8BE2\u7528\u91CF\uFF1A' + r.name); }, children: '\u7528\u91CF' }),
          BtnLink({ onClick: function () { showToast('\u66F4\u591A\u64CD\u4F5C'); }, children: '\u66F4\u591A' })
        );
      } }
    ];
    return React.createElement('div', null,
      PageHeaderEl({
        title: '\u6E20\u9053\u7BA1\u7406',
        description: '\u7BA1\u7406 API \u6E20\u9053\u914D\u7F6E\uFF1B\u6E20\u9053\u5145\u503C/\u6263\u6B3E\u4EC5\u8BB0\u8D26\u3001\u4E0D\u8BA1\u5165\u4F7F\u7528\u65E5\u5FD7\uFF1B\u5217\u8868\u5C55\u793A\u5DF2\u4F7F\u7528\u91D1\u989D\u4E0E Token\uFF08\u542B\u6E20\u9053\u6D4B\u8BD5\uFF09\u3002',
        extra: BtnPrimary({ onClick: function () { showToast('\u65B0\u589E\u6E20\u9053\uFF08\u6F14\u793A\uFF09'); }, children: '\u65B0\u589E\u6E20\u9053' })
      }),
      React.createElement('div', { style: styles.card },
        React.createElement(FilterPanelEl, null,
          React.createElement('div', { style: styles.filterRow },
            React.createElement('div', { style: styles.filterItem },
              React.createElement('label', { style: styles.filterLabel }, '\u6E20\u9053\u540D\u79F0'),
              React.createElement('input', { style: styles.input, placeholder: '\u6A21\u7CCA\u641C\u7D22', value: channelFilter.name, onChange: function (e) { setChannelFilter(Object.assign({}, channelFilter, { name: e.target.value })); } })
            ),
            React.createElement('div', { style: styles.filterItem },
              React.createElement('label', { style: styles.filterLabel }, '\u7C7B\u578B'),
              React.createElement('select', { style: styles.select, value: channelFilter.type, onChange: function (e) { setChannelFilter(Object.assign({}, channelFilter, { type: e.target.value })); } },
                React.createElement('option', { value: '' }, '\u5168\u90E8'),
                React.createElement('option', { value: 'OpenAI' }, 'OpenAI'),
                React.createElement('option', { value: 'Anthropic' }, 'Anthropic'),
                React.createElement('option', { value: 'Gemini' }, 'Gemini')
              )
            ),
            React.createElement('div', { style: styles.filterItem },
              React.createElement('label', { style: styles.filterLabel }, '\u72B6\u6001'),
              React.createElement('select', { style: styles.select, value: channelFilter.status, onChange: function (e) { setChannelFilter(Object.assign({}, channelFilter, { status: e.target.value })); } },
                React.createElement('option', { value: '' }, '\u5168\u90E8'),
                React.createElement('option', { value: 'enabled' }, '\u542F\u7528'),
                React.createElement('option', { value: 'disabled' }, '\u7981\u7528')
              )
            ),
            React.createElement('div', { style: { flex: '0 0 auto' } },
              BtnPrimary({ onClick: function () { showToast('\u67E5\u8BE2\u5B8C\u6210'); }, children: '\u67E5\u8BE2' }),
              BtnDefault({ onClick: function () { setChannelFilter({ name: '', type: '', status: '' }); showToast('\u5DF2\u91CD\u7F6E', 'info'); }, children: '\u91CD\u7F6E' })
            )
          )
        ),
        DataTable({ rowKey: 'id', columns: chCols, dataSource: filterChannels(), pageSize: 10 })
      )
    );
  }

  function renderModelPricing() {
    var filtered = mockModels.filter(function (m) {
      if (!modelSearch.trim()) return true;
      return m.modelName.toLowerCase().indexOf(modelSearch.trim().toLowerCase()) >= 0;
    });
    var mCols = [
      { key: 'modelName', title: '\u6A21\u578B\u540D\u79F0', dataIndex: 'modelName' },
      { key: 'modelType', title: '\u7C7B\u578B', render: function (_, r) { return TagEl({ color: 'default', children: getModelTypeLabel(r.modelType) }); } },
      { key: 'mode', title: '\u6A21\u5F0F', render: function (_, r) { return TagEl({ color: 'blue', children: r.billingMode === 'token' ? '\u6309 Token' : '\u6309\u6B21\u6570' }); } },
      { key: 'official', title: '\u5B98\u65B9\u4EF7\u683C\u6458\u8981', render: function (_, r) {
        if (r.billingMode === 'count') return React.createElement('span', { style: { fontSize: 12, color: 'rgba(0,0,0,0.45)' } }, formatUnitPrice(r.perCallPrice || 0) + ' / \u6B21');
        return React.createElement('span', { style: { fontSize: 12, color: 'rgba(0,0,0,0.45)' } }, '\u8F93\u5165 ' + formatUnitPrice(r.inputPrice || 0) + ' / \u8F93\u51FA ' + formatUnitPrice(r.completionPrice || 0) + ' (CNY / 1M Tokens)');
      } },
      { key: 'updatedAt', title: '\u66F4\u65B0\u65F6\u95F4', dataIndex: 'updatedAt' },
      { key: 'cnt', title: '\u6E20\u9053\u5546\u6570\u91CF', align: 'center', render: function (_, r) { return r.channelPrices.length; } },
      { key: 'summary', title: '\u6E20\u9053\u5546\u6458\u8981', render: function (_, r) { return formatChannelSummary(r.channelPrices); } },
      { key: 'actions', title: '\u64CD\u4F5C', render: function (_, r) {
        return React.createElement('span', null,
          BtnLink({ onClick: function () { showToast('\u7F16\u8F91\uFF1A' + r.modelName); }, children: '\u7F16\u8F91' }),
          BtnLink({ onClick: function () { showToast('\u5220\u9664\uFF08\u6F14\u793A\uFF09', 'info'); }, children: '\u5220\u9664' })
        );
      } }
    ];
    return React.createElement('div', null,
      PageHeaderEl({
        title: '\u6A21\u578B\u5B9A\u4EF7\u7BA1\u7406',
        description: '\u7BA1\u7406\u6A21\u578B\u4EF7\u683C\uFF0C\u7EDF\u4E00\u4EBA\u6C11\u5E01\u8BA1\u4EF7\uFF1B\u7F16\u8F91\u65F6\u6A21\u578B\u540D\u79F0\u4E0D\u53EF\u4FEE\u6539\uFF0C\u652F\u6301\u540C\u4E00\u6A21\u578B\u4E0B\u591A\u7EC4\u6E20\u9053\u5546\u4EF7\u683C\u3002',
        extra: BtnPrimary({ onClick: function () { showToast('\u65B0\u589E\u6A21\u578B\uFF08\u6F14\u793A\uFF09'); }, children: '\u65B0\u589E\u6A21\u578B' })
      }),
      React.createElement('div', { style: styles.card },
        React.createElement(FilterPanelEl, null,
          React.createElement('div', { style: styles.filterRow },
            React.createElement('div', { style: styles.filterItem },
              React.createElement('label', { style: styles.filterLabel }, '\u6A21\u578B\u540D\u79F0'),
              React.createElement('input', { style: styles.input, placeholder: '\u6A21\u7CCA\u641C\u7D22', value: modelSearch, onChange: function (e) { setModelSearch(e.target.value); } })
            ),
            BtnPrimary({ onClick: function () { showToast('\u67E5\u8BE2\u5B8C\u6210'); }, children: '\u67E5\u8BE2' })
          )
        ),
        DataTable({ rowKey: 'id', columns: mCols, dataSource: filtered, pageSize: 10 })
      )
    );
  }

  function renderGroup() {
    var gCols = [
      { key: 'name', title: '\u5206\u7EC4\u540D\u79F0', dataIndex: 'name' },
      { key: 'ratio', title: '\u500D\u7387', render: function (_, r) { return React.createElement('code', { style: { fontSize: 12 } }, r.ratio.toFixed(2)); } },
      { key: 'visible', title: '\u5BC6\u94A5\u521B\u5EFA\u53EF\u89C1', render: function (_, r) { return TagEl({ color: r.visible ? 'success' : 'default', children: r.visible ? '\u53EF\u89C1' : '\u9690\u85CF' }); } },
      { key: 'remark', title: '\u5907\u6CE8', dataIndex: 'remark' },
      { key: 'actions', title: '\u64CD\u4F5C', render: function (_, r) {
        return React.createElement('span', null,
          BtnLink({ onClick: function () { showToast('\u7F16\u8F91\uFF1A' + r.name); }, children: '\u7F16\u8F91' }),
          BtnLink({ onClick: function () { showToast('\u5220\u9664\uFF08\u6F14\u793A\uFF09', 'info'); }, children: '\u5220\u9664' })
        );
      } }
    ];
    return React.createElement('div', null,
      PageHeaderEl({
        title: '\u5206\u7EC4\u7BA1\u7406',
        description: '\u914D\u7F6E\u6E20\u9053\u3001\u5BC6\u94A5\u4E0E\u9879\u76EE\u7684\u5206\u7EC4\uFF1B\u500D\u7387\u4FDD\u7559\u4E24\u4F4D\u5C0F\u6570\uFF0C\u52FE\u9009\u540E\u5BC6\u94A5\u521B\u5EFA\u65F6\u8BE5\u5206\u7EC4\u53EF\u89C1\u3002',
        extra: BtnPrimary({ onClick: function () { showToast('\u65B0\u589E\u5206\u7EC4\uFF08\u6F14\u793A\uFF09'); }, children: '\u65B0\u589E\u5206\u7EC4' })
      }),
      React.createElement('div', { style: styles.card },
        React.createElement('div', { style: styles.tableSummary }, '\u5171 ', React.createElement('strong', null, mockGroups.length), ' \u4E2A\u5206\u7EC4'),
        DataTable({ rowKey: 'id', columns: gCols, dataSource: mockGroups, pageSize: 10 })
      )
    );
  }

  function renderContent() {
    if (selectedKey === 'dashboard') return renderDashboard();
    if (selectedKey === 'usage-log') return renderUsageLog();
    if (selectedKey === 'project') return renderProject();
    if (selectedKey === 'channel') return renderChannel();
    if (selectedKey === 'model-pricing') return renderModelPricing();
    if (selectedKey === 'group') return renderGroup();
    return null;
  }

  var currentLabel = menuLabels[selectedKey] || '';
  var toastStyle = Object.assign({}, styles.toast, {
    backgroundColor: toast && toast.type === 'info' ? '#fff' : '#f6ffed',
    border: '1px solid ' + (toast && toast.type === 'info' ? '#d9d9d9' : '#b7eb8f'),
    color: 'rgba(0,0,0,0.88)'
  });

  return React.createElement('div', { style: styles.layout },
    React.createElement('div', { style: styles.sider },
      React.createElement('div', { style: styles.brand },
        React.createElement('div', { style: styles.logo }, '\u7075'),
        collapsed ? null : React.createElement('span', { style: styles.brandText }, '\u7075\u6570\u8FD0\u8425\u7BA1\u7406\u5E73\u53F0'),
        React.createElement('span', { style: styles.collapseBtn, onClick: function () { setCollapsed(!collapsed); } }, collapsed ? '\u2630' : '\u00AB')
      ),
      collapsed ? null : renderSideMenu()
    ),
    React.createElement('div', { style: styles.main },
      React.createElement('div', { style: styles.header },
        React.createElement('div', { style: styles.breadcrumb },
          React.createElement('span', null, '\u2302 \u9996\u9875 / '),
          React.createElement('span', null, 'token\u9879\u76EE / '),
          React.createElement('span', { style: styles.breadcrumbActive }, currentLabel)
        ),
        React.createElement('div', { style: styles.headerRight },
          React.createElement('span', { style: styles.bellWrap }, '\uD83D\uDD14', React.createElement('span', { style: styles.badge }, '3')),
          React.createElement('span', { style: { display: 'flex', alignItems: 'center' } },
            React.createElement('span', { style: styles.avatar }, '\u7BA1'),
            '\u7BA1\u7406\u5458'
          )
        )
      ),
      React.createElement('div', { style: styles.content },
        React.createElement('div', { style: styles.contentInner }, renderContent())
      )
    ),
    toast ? React.createElement('div', { style: toastStyle }, toast.text) : null
  );

};
