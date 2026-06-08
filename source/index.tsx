/**
 * @name 开发平台界面
 *
 * 参考资料：
 * - /src/resources/需求文档/开发平台相关界面.md
 * - /src/themes/lingshu-dev-platform/DESIGN.md
 */

import './style.css';

import React, { Suspense, lazy } from 'react';
import {
  ApiOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  CloudServerOutlined,
  DashboardOutlined,
  HomeOutlined,
  MonitorOutlined,
} from '@ant-design/icons';
import { Breadcrumb, ConfigProvider, Layout, Menu, Spin, Typography } from 'antd';
import type { MenuProps } from 'antd';

import { defineHashPageRoute, useHashPage } from '../../common/useHashPage';

const ResourceDashboardPage = lazy(() => import('./pages/resource-dashboard'));
const UsageStatsPage = lazy(() => import('./pages/usage-stats'));

const { Content, Sider } = Layout;
const { Text } = Typography;

const route = defineHashPageRoute(
  [
    { id: 'model-resources', title: 'AI大模型资源' },
    { id: 'resource-monitor', title: '资源监控' },
    { id: 'resource-dashboard', title: '模型资源看板' },
    { id: 'usage-stats', title: '模型用量统计' },
  ],
  { defaultPageId: 'resource-dashboard' },
);

const menuLabels: Record<string, string> = {
  'model-resources': 'AI大模型资源',
  'resource-monitor': '资源监控',
  'resource-dashboard': '模型资源看板',
  'usage-stats': '模型用量统计',
};

const menuItems: MenuProps['items'] = [
  {
    key: 'ai-center',
    icon: <CloudServerOutlined />,
    label: 'AI资源中心',
    children: [
      { key: 'model-resources', icon: <ApiOutlined />, label: 'AI大模型资源' },
      { key: 'resource-monitor', icon: <MonitorOutlined />, label: '资源监控' },
      { key: 'resource-dashboard', icon: <DashboardOutlined />, label: '模型资源看板' },
      { key: 'usage-stats', icon: <BarChartOutlined />, label: '模型用量统计' },
    ],
  },
];

function PageLoading() {
  return (
    <div className="page-loading">
      <Spin size="large" />
    </div>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="placeholder-page">
      <AppstoreOutlined className="placeholder-page-icon" />
      <Text type="secondary">{title}（占位）</Text>
      <Text type="secondary" style={{ fontSize: 12 }}>该功能将在后续迭代中实现</Text>
    </div>
  );
}

function renderPage(pageId: string) {
  switch (pageId) {
    case 'resource-dashboard':
      return <ResourceDashboardPage />;
    case 'usage-stats':
      return <UsageStatsPage />;
    case 'model-resources':
      return <PlaceholderPage title="AI大模型资源" />;
    case 'resource-monitor':
      return <PlaceholderPage title="资源监控" />;
    default:
      return <ResourceDashboardPage />;
  }
}

export default function DevPlatformApp() {
  const { page, setPage } = useHashPage(route);
  const currentLabel = menuLabels[page] || '模型资源看板';

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 4,
          fontSize: 14,
          fontFamily: "'PingFang SC', 'Microsoft YaHei UI', system-ui, sans-serif",
        },
      }}
    >
      <Layout className="dev-platform-layout">
        <Sider width={208} className="dev-platform-sider" theme="light">
          <div className="sider-brand">
            <div className="brand-logo">灵</div>
            <span className="brand-text">灵数开发平台</span>
          </div>
          <Menu
            mode="inline"
            theme="light"
            selectedKeys={[page]}
            defaultOpenKeys={['ai-center']}
            items={menuItems}
            onClick={({ key }) => setPage(key)}
            className="dev-platform-menu"
          />
        </Sider>

        <Layout className="dev-platform-main">
          <div className="dev-platform-header">
            <Breadcrumb
              items={[
                { title: <><HomeOutlined /> 首页</> },
                { title: 'AI资源中心' },
                { title: currentLabel },
              ]}
            />
          </div>
          <Content className="dev-platform-content">
            <Suspense fallback={<PageLoading />}>
              {renderPage(page)}
            </Suspense>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
