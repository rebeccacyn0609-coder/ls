import { Grid } from 'antd';

export function useResponsive() {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md !== true;
  const isTablet = screens.md === true && screens.lg !== true;
  const isDesktop = screens.lg === true;

  return { isMobile, isTablet, isDesktop, screens };
}

export function resolveDrawerWidth(
  width: number | string | undefined,
  isMobile: boolean,
  isTablet: boolean
): number | string {
  if (isMobile) return '100%';
  if (isTablet) return typeof width === 'number' ? Math.min(width, 520) : '92%';
  return width ?? 640;
}

export function resolveModalWidth(
  width: number | string | undefined,
  isMobile: boolean,
  isTablet: boolean
): number | string {
  if (isMobile) return 'calc(100vw - 32px)';
  if (isTablet) return typeof width === 'number' ? Math.min(width, 560) : '90%';
  return width ?? 520;
}
