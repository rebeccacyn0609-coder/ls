export type ApplyStatus = 'pending' | 'approved' | 'rejected';

export type EnterpriseApplyProcessStatus = 'unprocessed' | 'processed' | 'ignored';

export const ENTERPRISE_APPLY_PROCESS_LABELS: Record<EnterpriseApplyProcessStatus, string> = {
  unprocessed: '未处理',
  processed: '已处理',
  ignored: '不处理',
};

export interface EnterpriseApplyForm {
  companyName: string;
  creditCode: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  usageScene: string;
}

/** 灵数 API 开放平台返回的申请记录（不含处理状态） */
export interface OpenPlatformApplyRecord {
  id: string;
  companyName: string;
  creditCode: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  usageScene: string;
  createdAt: string;
}

export interface StoredApplyRecord extends EnterpriseApplyForm {
  id: string;
  /** 与开放平台 createdAt 一致，列表展示为创建时间 */
  submittedAt: string;
  status: ApplyStatus;
  /** 运营管理端本地维护，开放平台接口不返回 */
  processStatus: EnterpriseApplyProcessStatus;
}

const OPEN_PLATFORM_STORAGE_KEY = 'lingshu-saas-apply-records';
const OPS_STORAGE_KEY = 'lingshu-ops-apply-records';
const FETCH_CURSOR_KEY = 'lingshu-ops-apply-fetch-cursor';
const LEGACY_SHARED_STORAGE_KEY = 'lingshu-saas-apply-records';

function formatApplySubmittedAt(daysAgo: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleString('zh-CN', { hour12: false });
}

const SEED_APPLY_RECORDS: StoredApplyRecord[] = [
  {
    id: 'apply-seed-1',
    companyName: '汇特科技有限公司',
    creditCode: '91440300MA5F8K2X3P',
    contactName: '张明',
    contactPhone: '13800138001',
    contactEmail: 'zhangming@huitech.cn',
    usageScene: '智能客服与知识库问答，预计日调用量 50 万次。',
    submittedAt: formatApplySubmittedAt(0, 10, 25),
    status: 'pending',
    processStatus: 'unprocessed',
  },
  {
    id: 'apply-seed-2',
    companyName: '星云智能科技',
    creditCode: '91310115MA1K4D9E7W',
    contactName: '李薇',
    contactPhone: '13900139002',
    contactEmail: 'liwei@nebula-ai.com',
    usageScene: '代码辅助与文档分析，接入 GPT 与 Claude 系列模型。',
    submittedAt: formatApplySubmittedAt(1, 15, 40),
    status: 'pending',
    processStatus: 'processed',
  },
  {
    id: 'apply-seed-3',
    companyName: '蓝海数据服务',
    creditCode: '',
    contactName: '王浩',
    contactPhone: '13700137003',
    contactEmail: 'wanghao@blueocean-data.cn',
    usageScene: '数据标注与摘要提取，内部业务系统调用。',
    submittedAt: formatApplySubmittedAt(2, 9, 12),
    status: 'pending',
    processStatus: 'unprocessed',
  },
  {
    id: 'apply-seed-4',
    companyName: '匠心创新实验室',
    creditCode: '91110108MA01R5T67K',
    contactName: '陈悦',
    contactPhone: '13600136004',
    contactEmail: 'chenyue@jiangxin-lab.com',
    usageScene: '产品研发阶段的模型能力评测与对比。',
    submittedAt: formatApplySubmittedAt(4, 14, 8),
    status: 'pending',
    processStatus: 'processed',
  },
  {
    id: 'apply-seed-5',
    companyName: '明德教育集团',
    creditCode: '91440101MA59Y3H21L',
    contactName: '赵琳',
    contactPhone: '13500135005',
    contactEmail: 'zhaolin@mingde-edu.cn',
    usageScene: '教学辅助、作业批改与学情分析，需支持多模态模型。',
    submittedAt: formatApplySubmittedAt(0, 16, 52),
    status: 'pending',
    processStatus: 'unprocessed',
  },
  {
    id: 'apply-seed-6',
    companyName: '云帆物流科技',
    creditCode: '',
    contactName: '刘洋',
    contactPhone: '13300133006',
    contactEmail: 'liuyang@yunfan-logistics.com',
    usageScene: '运单 OCR 识别与智能调度对话助手。',
    submittedAt: formatApplySubmittedAt(6, 11, 30),
    status: 'pending',
    processStatus: 'processed',
  },
];

export function parseApplyCreatedAt(value: string): number {
  const ts = Date.parse(value.replace(/-/g, '/'));
  return Number.isNaN(ts) ? 0 : ts;
}

function normalizeApplyRecords(records: StoredApplyRecord[]): StoredApplyRecord[] {
  return records.map((record) => ({
    ...record,
    processStatus: normalizeProcessStatus(record.processStatus),
  }));
}

function normalizeProcessStatus(status?: EnterpriseApplyProcessStatus | 'deleted'): EnterpriseApplyProcessStatus {
  if (status === 'processed') return 'processed';
  if (status === 'ignored' || status === 'deleted') return 'ignored';
  return 'unprocessed';
}

function persistOpsApplyRecords(records: StoredApplyRecord[]) {
  sessionStorage.setItem(OPS_STORAGE_KEY, JSON.stringify(records));
}

function migrateLegacySharedRecords(): StoredApplyRecord[] | null {
  try {
    const raw = sessionStorage.getItem(LEGACY_SHARED_STORAGE_KEY);
    if (!raw) return null;
    const records = JSON.parse(raw) as StoredApplyRecord[];
    if (!Array.isArray(records) || records.length === 0) return null;
    return normalizeApplyRecords(records);
  } catch {
    return null;
  }
}

function initOpsApplyRecords(): StoredApplyRecord[] {
  const migrated = migrateLegacySharedRecords();
  const records = migrated ?? normalizeApplyRecords(SEED_APPLY_RECORDS);
  persistOpsApplyRecords(records);
  return records;
}

export function getApplyFetchCursor(): string | null {
  return sessionStorage.getItem(FETCH_CURSOR_KEY);
}

export function setApplyFetchCursor(cursor: string) {
  sessionStorage.setItem(FETCH_CURSOR_KEY, cursor);
}

export function loadOpsApplyRecords(): StoredApplyRecord[] {
  try {
    const raw = sessionStorage.getItem(OPS_STORAGE_KEY);
    if (!raw) return initOpsApplyRecords();
    const records = JSON.parse(raw) as StoredApplyRecord[];
    return normalizeApplyRecords(records);
  } catch {
    return initOpsApplyRecords();
  }
}

/** @deprecated 请使用 loadOpsApplyRecords */
export function loadApplyRecords(): StoredApplyRecord[] {
  return loadOpsApplyRecords();
}

export function loadOpenPlatformApplyRecords(): OpenPlatformApplyRecord[] {
  try {
    const raw = sessionStorage.getItem(OPEN_PLATFORM_STORAGE_KEY);
    if (!raw) return [];
    const records = JSON.parse(raw) as Array<StoredApplyRecord & { submittedAt: string }>;
    if (!Array.isArray(records)) return [];
    return records.map((record) => ({
      id: record.id,
      companyName: record.companyName,
      creditCode: record.creditCode ?? '',
      contactName: record.contactName,
      contactPhone: record.contactPhone,
      contactEmail: record.contactEmail,
      usageScene: record.usageScene,
      createdAt: record.submittedAt,
    }));
  } catch {
    return [];
  }
}

function pickLatestCreatedAt(records: Pick<StoredApplyRecord, 'submittedAt'>[]): string | null {
  if (records.length === 0) return null;
  let latest = records[0].submittedAt;
  for (const record of records) {
    if (parseApplyCreatedAt(record.submittedAt) > parseApplyCreatedAt(latest)) {
      latest = record.submittedAt;
    }
  }
  return latest;
}

export function mergeIncrementalApplyRecords(
  remoteRecords: OpenPlatformApplyRecord[],
): { addedCount: number; added: StoredApplyRecord[] } {
  const existing = loadOpsApplyRecords();
  const existingIds = new Set(existing.map((item) => item.id));
  const cursor = getApplyFetchCursor();
  const cursorTs = cursor ? parseApplyCreatedAt(cursor) : 0;

  const incremental = remoteRecords.filter((record) => {
    if (existingIds.has(record.id)) return false;
    if (!cursor) return true;
    return parseApplyCreatedAt(record.createdAt) > cursorTs;
  });

  const added: StoredApplyRecord[] = incremental.map((record) => ({
    id: record.id,
    companyName: record.companyName,
    creditCode: record.creditCode,
    contactName: record.contactName,
    contactPhone: record.contactPhone,
    contactEmail: record.contactEmail,
    usageScene: record.usageScene,
    submittedAt: record.createdAt,
    status: 'pending',
    processStatus: 'unprocessed',
  }));

  const merged = normalizeApplyRecords(
    [...added, ...existing].sort(
      (a, b) => parseApplyCreatedAt(b.submittedAt) - parseApplyCreatedAt(a.submittedAt),
    ),
  );
  persistOpsApplyRecords(merged);

  const latestCreatedAt = pickLatestCreatedAt(merged);
  if (latestCreatedAt) {
    setApplyFetchCursor(latestCreatedAt);
  }

  return { addedCount: added.length, added };
}

export function markApplyRecordProcessed(id: string): StoredApplyRecord | null {
  const records = loadOpsApplyRecords();
  const index = records.findIndex((item) => item.id === id);
  if (index < 0 || records[index].processStatus !== 'unprocessed') return null;
  records[index] = { ...records[index], processStatus: 'processed' };
  persistOpsApplyRecords(records);
  return records[index];
}

export function markApplyRecordIgnored(id: string): StoredApplyRecord | null {
  const records = loadOpsApplyRecords();
  const index = records.findIndex((item) => item.id === id);
  if (index < 0 || records[index].processStatus !== 'unprocessed') return null;
  records[index] = { ...records[index], processStatus: 'ignored' };
  persistOpsApplyRecords(records);
  return records[index];
}
