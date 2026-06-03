import React from 'react';
import { Button, Space } from 'antd';
import { SearchOutlined, ReloadOutlined, ExportOutlined } from '@ant-design/icons';

interface PageHeaderProps {
  title: string;
  description?: string;
  extra?: React.ReactNode;
}

export function PageHeader({ title, description, extra }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-main">
        <h4 className="page-header-title">{title}</h4>
        {description ? <p className="page-header-desc">{description}</p> : null}
      </div>
      {extra ? <div className="page-header-extra">{extra}</div> : null}
    </div>
  );
}

interface FilterActionsProps {
  onSearch?: () => void;
  onReset?: () => void;
  showExport?: boolean;
  onExport?: () => void;
}

export function FilterActions({ onSearch, onReset, showExport, onExport }: FilterActionsProps) {
  return (
    <Space wrap className="filter-actions-inner">
      <Button type="primary" icon={<SearchOutlined />} onClick={onSearch}>
        查询
      </Button>
      <Button icon={<ReloadOutlined />} onClick={onReset}>
        重置
      </Button>
      {showExport ? <Button icon={<ExportOutlined />} onClick={onExport}>导出</Button> : null}
    </Space>
  );
}
