/**
 * @name 灵数运营管理平台
 * @mode axure
 *
 * 参考资料：
 * - /src/docs/灵数运营管理平台（token-项目）.md
 * - /rules/development-standards.md
 * - /src/themes/antd-new
 * - spec.md
 */

import './style.css';

import React, { useState, useCallback, forwardRef, useImperativeHandle, lazy, Suspense, useEffect } from 'react';
import {
  Layout,
  Menu,
  Typography,
  theme,
  Breadcrumb,
  Spin,
  ConfigProvider,
  Avatar,
  Space,
  Badge,
  Drawer,
  Button
} from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  ProjectOutlined,
  ApiOutlined,
  DollarOutlined,
  GroupOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  HomeOutlined,
  CloudServerOutlined,
  SettingOutlined
} from '@ant-design/icons';

import type { KeyDesc, DataDesc, ConfigItem, EventItem, AxureProps, AxureHandle } from '../../common/axure-types';
import { useResponsive } from './components/useResponsive';

const DashboardPage = lazy(() => import('./dashboard'));
const UsageLogPage = lazy(() => import('./usage-log'));
const ProjectPage = lazy(() => import('./project'));
const ChannelPage = lazy(() => import('./channel'));
const ModelPricingPage = lazy(() => import('./model-pricing'));
const ModelPricingCopyPage = lazy(() => import('./model-pricing-copy'));
const GroupPage = lazy(() => import('./group'));

const { Text } = Typography;
const { Content, Sider } = Layout;

const EVENT_LIST: EventItem[] = [
  { name: 'onMenuClick', desc: '点击菜单项时触发' }
];

const VAR_LIST: KeyDesc[] = [
  { name: 'current_menu', desc: '当前选中的菜单项 key' }
];

const CONFIG_LIST: ConfigItem[] = [
  { type: 'input', attributeId: 'title', displayName: '平台标题', info: '运营管理平台标题', initialValue: '灵数运营管理平台' }
];

const DATA_LIST: DataDesc[] = [];

const menuLabels: Record<string, string> = {
  dashboard: '数据看板',
  'usage-log': '使用日志',
  project: '项目管理',
  channel: '渠道管理',
  'model-pricing': '模型定价管理',
  group: '分组管理',
  'model-pricing-copy': '模型定价管理copy',
};

const moduleComponents: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  'usage-log': UsageLogPage,
  project: ProjectPage,
  channel: ChannelPage,
  'model-pricing': ModelPricingPage,
  group: GroupPage,
  'model-pricing-copy': ModelPricingCopyPage,
};

const menuItems = [
  {
    key: 'api-project',
    icon: <CloudServerOutlined />,
    label: '接口项目',
    disabled: true,
    children: [
      { key: 'api-dashboard', label: '数据看板', disabled: true },
      { key: 'api-pricing', label: '计价管理', disabled: true },
      { key: 'api-manage', label: '接口管理', disabled: true },
      { key: 'api-cost', label: '成本管理', disabled: true }
    ]
  },
  {
    key: 'token-project',
    icon: <ApiOutlined />,
    label: 'token项目',
    children: [
      { key: 'dashboard', icon: <DashboardOutlined />, label: '数据看板' },
      { key: 'usage-log', icon: <FileTextOutlined />, label: '使用日志' },
      { key: 'project', icon: <ProjectOutlined />, label: '项目管理' },
      { key: 'channel', icon: <ApiOutlined />, label: '渠道管理' },
      { key: 'model-pricing', icon: <DollarOutlined />, label: '模型定价管理' },
      { key: 'group', icon: <GroupOutlined />, label: '分组管理' },
      { key: 'model-pricing-copy', icon: <DollarOutlined />, label: '模型定价管理copy' }
    ]
  },
  {
    key: 'system',
    icon: <SettingOutlined />,
    label: '系统管理',
    disabled: true
  }
];

const Component = forwardRef<AxureHandle, AxureProps>(function TokenPlatform(innerProps, ref) {
  const configSource = innerProps?.config || {};
  const onEventHandler = typeof innerProps?.onEvent === 'function' ? innerProps.onEvent : () => undefined;

  const title = typeof configSource.title === 'string' && configSource.title ? configSource.title : '灵数运营管理平台';
  const { token } = theme.useToken();
  const { isMobile, isTablet } = useResponsive();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const [openKeys, setOpenKeys] = useState<string[]>(['token-project']);

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    } else if (isTablet) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [isMobile, isTablet]);

  const emitEvent = useCallback((eventName: string, payload?: any) => {
    try {
      onEventHandler(eventName, payload);
    } catch (error) {
      console.warn('onEvent 调用失败:', error);
    }
  }, [onEventHandler]);

  useImperativeHandle(ref, () => ({
    getVar: (name: string) => {
      const vars: Record<string, string> = { current_menu: selectedKey };
      return vars[name];
    },
    fireAction: (name: string, params?: string) => {
      console.log('fireAction:', name, params);
    },
    eventList: EVENT_LIST,
    actionList: [],
    varList: VAR_LIST,
    configList: CONFIG_LIST,
    dataList: DATA_LIST
  }), [selectedKey]);

  const handleMenuClick = useCallback(({ key }: { key: string }) => {
    if (moduleComponents[key]) {
      setSelectedKey(key);
      setMobileMenuOpen(false);
      emitEvent('onMenuClick', { menuKey: key, menuLabel: menuLabels[key] });
    }
  }, [emitEvent]);

  const renderContent = () => {
    const PageComponent = moduleComponents[selectedKey];
    if (!PageComponent) return null;

    return (
      <Suspense fallback={<PageLoading />}>
        <PageComponent />
      </Suspense>
    );
  };

  const sideMenu = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[selectedKey]}
      openKeys={openKeys}
      onOpenChange={setOpenKeys}
      onClick={handleMenuClick}
      items={menuItems}
      className="token-platform-menu"
    />
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
          fontSize: 14
        }
      }}
    >
      <Layout className={`token-platform-layout ${isMobile ? 'is-mobile' : ''} ${isTablet ? 'is-tablet' : ''}`}>
        {!isMobile && (
          <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={240}
            collapsedWidth={64}
            className="token-platform-sider"
            theme="dark"
          >
            <div className="sider-brand">
              <div className="brand-logo">灵</div>
              {!collapsed && <span className="brand-text">{title}</span>}
              <div className="collapse-trigger" onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </div>
            </div>
            {sideMenu}
          </Sider>
        )}

        <Layout className="token-platform-main">
          <div className="token-platform-header">
            <div className="header-left">
              {isMobile && (
                <Button
                  type="text"
                  icon={<MenuUnfoldOutlined />}
                  className="mobile-menu-btn"
                  onClick={() => setMobileMenuOpen(true)}
                />
              )}
              <Breadcrumb
                className="header-breadcrumb"
                items={
                  isMobile
                    ? [{ title: menuLabels[selectedKey] || 'token项目' }]
                    : [
                        { title: <><HomeOutlined /> 首页</> },
                        { title: 'token项目' },
                        { title: menuLabels[selectedKey] || '' }
                      ]
                }
              />
            </div>
            <Space size={isMobile ? 8 : 16} className="header-right">
              <Badge count={3} size="small">
                <BellOutlined style={{ fontSize: 16, color: token.colorTextSecondary, cursor: 'pointer' }} />
              </Badge>
              <Space size={8}>
                <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary }} />
                {!isMobile && <Text className="header-username">管理员</Text>}
              </Space>
            </Space>
          </div>
          <Content className="token-platform-content">
            <div className="token-platform-body">{renderContent()}</div>
          </Content>
        </Layout>

        <Drawer
          title={null}
          placement="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          width={280}
          rootClassName="token-platform-mobile-drawer"
        >
          <div className="mobile-drawer-brand">
            <div className="brand-logo">灵</div>
            <span className="brand-text">{title}</span>
          </div>
          {sideMenu}
        </Drawer>
      </Layout>
    </ConfigProvider>
  );
});

function PageLoading() {
  return (
    <div className="loading-container">
      <Spin size="large" />
      <Text type="secondary">加载中...</Text>
    </div>
  );
}

export default Component;

export { EVENT_LIST, VAR_LIST, CONFIG_LIST, DATA_LIST };
