import React from 'react';
import { Modal, Drawer, Row, Col } from 'antd';
import type { ModalProps, DrawerProps } from 'antd';

import { useResponsive, resolveDrawerWidth, resolveModalWidth } from './useResponsive';

interface FormSectionProps {
  title?: string;
  children: React.ReactNode;
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="form-section">
      {title ? <div className="form-section-title">{title}</div> : null}
      {children}
    </div>
  );
}

export function FormRow({ children }: { children: React.ReactNode }) {
  return <Row gutter={[16, 0]}>{children}</Row>;
}

export function FormCol({ span = 12, children }: { span?: number; children: React.ReactNode }) {
  return <Col xs={24} sm={24} lg={span}>{children}</Col>;
}

export function FormColFull({ children }: { children: React.ReactNode }) {
  return <Col span={24}>{children}</Col>;
}

export function AppModal({ className, width, ...props }: ModalProps) {
  const { isMobile, isTablet } = useResponsive();
  const baseWidth = typeof width === 'number' || typeof width === 'string' ? width : undefined;

  return (
    <Modal
      centered={!isMobile}
      okText="确定"
      cancelText="取消"
      destroyOnClose
      width={resolveModalWidth(baseWidth, isMobile, isTablet)}
      className={`form-modal ${isMobile ? 'form-modal-mobile' : ''} ${className || ''}`}
      {...props}
    />
  );
}

export function AppDrawer({ className, width, placement, ...props }: DrawerProps) {
  const { isMobile, isTablet } = useResponsive();
  const baseWidth = typeof width === 'number' || typeof width === 'string' ? width : undefined;

  return (
    <Drawer
      destroyOnClose
      placement={isMobile ? 'bottom' : placement ?? 'right'}
      height={isMobile ? '88vh' : undefined}
      width={isMobile ? undefined : resolveDrawerWidth(baseWidth, isMobile, isTablet)}
      className={`form-drawer ${isMobile ? 'form-drawer-mobile' : ''} ${className || ''}`}
      {...props}
    />
  );
}
