import {
  loadOpenPlatformApplyRecords,
  loadOpsApplyRecords,
  markApplyRecordIgnored,
  markApplyRecordProcessed,
  mergeIncrementalApplyRecords,
  type EnterpriseApplyProcessStatus,
  type StoredApplyRecord,
} from './applyRecords';

export type EnterpriseApplicationProcessFilter = 'all' | EnterpriseApplyProcessStatus;

export interface EnterpriseApplicationQuery {
  processStatus?: EnterpriseApplicationProcessFilter;
  companyName?: string;
}

export interface FetchApplyListResult {
  addedCount: number;
  fetchedAt: string;
}

export function filterEnterpriseApplications(
  records: StoredApplyRecord[],
  query: EnterpriseApplicationQuery = {},
): StoredApplyRecord[] {
  const status = query.processStatus ?? 'all';
  const nameKeyword = query.companyName?.trim().toLowerCase() ?? '';

  return records.filter((record) => {
    if (status !== 'all' && record.processStatus !== status) return false;
    if (nameKeyword && !record.companyName.toLowerCase().includes(nameKeyword)) return false;
    return true;
  });
}

export function fetchEnterpriseApplications(
  query: EnterpriseApplicationQuery = {},
): Promise<StoredApplyRecord[]> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve(filterEnterpriseApplications(loadOpsApplyRecords(), query));
    }, 200);
  });
}

/** 调用灵数 API 开放平台接口，按创建时间增量获取企业接入申请（不含状态字段） */
export function fetchApplyListFromOpenPlatform(): Promise<FetchApplyListResult> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const remoteRecords = loadOpenPlatformApplyRecords();
      const { addedCount } = mergeIncrementalApplyRecords(remoteRecords);
      resolve({
        addedCount,
        fetchedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      });
    }, 480);
  });
}

export function processEnterpriseApplication(id: string): Promise<StoredApplyRecord | null> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(markApplyRecordProcessed(id)), 220);
  });
}

export function ignoreEnterpriseApplication(id: string): Promise<StoredApplyRecord | null> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(markApplyRecordIgnored(id)), 220);
  });
}
