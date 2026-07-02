import { ENTERPRISE_APPLY_PROCESS_LABELS, type StoredApplyRecord } from './applyRecords';

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatRow(cells: Array<string | number>): string {
  return cells.map(escapeCsvCell).join(',');
}

function formatExportFileTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join('');
}

function formatExportDisplayTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export interface ExportApplyRecordsOptions {
  records: StoredApplyRecord[];
  exportedAt?: Date;
}

export function buildApplyRecordsCsv({
  records,
  exportedAt = new Date(),
}: ExportApplyRecordsOptions): string {
  const exportTime = formatExportDisplayTime(exportedAt);
  const header = [
    '申请ID',
    '企业名称',
    '统一社会信用代码',
    '联系人',
    '联系电话',
    '联系邮箱',
    '使用场景说明',
    '创建时间',
    '状态',
  ];

  const lines: string[] = [
    formatRow(['导出时间', exportTime]),
    formatRow(['导出条数', records.length]),
    '',
    formatRow(header),
    ...records.map((record) => formatRow([
      record.id,
      record.companyName,
      record.creditCode?.trim() || '',
      record.contactName,
      record.contactPhone,
      record.contactEmail,
      record.usageScene,
      record.submittedAt,
      ENTERPRISE_APPLY_PROCESS_LABELS[record.processStatus],
    ])),
  ];

  return `\uFEFF${lines.join('\r\n')}`;
}

export function downloadApplyRecordsCsv(options: ExportApplyRecordsOptions): string {
  const exportedAt = options.exportedAt ?? new Date();
  const fileName = `企业接入申请导出${formatExportFileTimestamp(exportedAt)}.csv`;
  const content = buildApplyRecordsCsv({ ...options, exportedAt });
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  return fileName;
}
