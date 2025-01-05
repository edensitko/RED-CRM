import { ReactNode } from 'react';
import { SvgIconComponent } from '@mui/icons-material';

export interface WidgetProps {
  data?: any;
  settings?: Record<string, any>;
  preview?: boolean;
  onRefresh?: () => void;
}

export interface PreviewData {
  title: string;
  subtitle?: string;
  content?: ReactNode;
  loading?: boolean;
  error?: string;
}

export interface WidgetPreviewProps {
  data: PreviewData;
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  widget: string;
  settings?: Record<string, any>;
}

export interface WidgetDefinition {
  type: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  defaultSize: { w: number; h: number };
  icon: SvgIconComponent;
  previewData: any;
}

export const DefaultPreview: PreviewData = {
  title: 'No Data Available',
  subtitle: 'Loading data...',
  loading: true,
};

export const ErrorPreview: PreviewData = {
  title: 'Error Loading Data',
  subtitle: 'Please try again later',
  error: 'Failed to load widget data',
};
