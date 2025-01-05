import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { LayoutItem } from '../../components/widgets/WidgetTypes';

// Local interface for internal use
interface DashboardLayoutItem extends LayoutItem {
  minW?: number;
  minH?: number;
  moved?: boolean;
  static?: boolean;
  settings?: Record<string, any>;
}

export type DashboardLayout = DashboardLayoutItem[];

const sanitizeLayout = (layout: DashboardLayout): DashboardLayout => {
  if (!Array.isArray(layout)) {
    console.warn('Invalid layout format:', layout);
    return [];
  }

  return layout
    .filter(widget => 
      widget && 
      typeof widget === 'object' &&
      widget.widget &&
      typeof widget.widget === 'string'
    )
    .map(widget => {
      const sanitized: DashboardLayoutItem = {
        i: String(widget.i || `widget-${Date.now()}`),
        x: Math.max(0, Math.floor(Number(widget.x) || 0)),
        y: Math.max(0, Math.floor(Number(widget.y) || 0)),
        w: Math.max(1, Math.floor(Number(widget.w) || 2)),
        h: Math.max(1, Math.floor(Number(widget.h) || 2)),
        widget: widget.widget,
      };

      // Only include settings if they exist and are not empty
      if (widget.settings && typeof widget.settings === 'object' && Object.keys(widget.settings).length > 0) {
        // Remove any undefined or null values from settings
        const cleanSettings = Object.entries(widget.settings)
          .filter(([_, value]) => value !== undefined && value !== null)
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
        
        if (Object.keys(cleanSettings).length > 0) {
          sanitized.settings = cleanSettings;
        }
      }

      return sanitized;
    });
};

const sanitizeLayoutItem = (item: any): DashboardLayoutItem => {
  return {
    i: String(item.i || `widget-${Date.now()}`),
    x: Math.max(0, Math.floor(Number(item.x) || 0)),
    y: Math.max(0, Math.floor(Number(item.y) || 0)),
    w: Math.max(1, Math.floor(Number(item.w) || 2)),
    h: Math.max(1, Math.floor(Number(item.h) || 2)),
    widget: item.widget || '',
    minW: item.minW !== undefined ? Math.max(1, Math.floor(Number(item.minW))) : undefined,
    minH: item.minH !== undefined ? Math.max(1, Math.floor(Number(item.minH))) : undefined,
    settings: item.settings && typeof item.settings === 'object' ? item.settings : undefined,
    moved: item.moved !== undefined ? Boolean(item.moved) : undefined,
    static: item.static !== undefined ? Boolean(item.static) : undefined
  };
};

export const getDashboardLayout = async (userId: string): Promise<DashboardLayout> => {
  try {
    const docRef = doc(db, 'dashboards', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return (data.layout || []).map(sanitizeLayoutItem);
    }
    
    // If no layout exists, create an empty one
    await setDoc(docRef, { layout: [] });
    return [];
  } catch (error) {
    console.error('Error getting dashboard layout:', error);
    throw error;
  }
};

export const saveDashboardLayout = async (userId: string, layout: DashboardLayout): Promise<void> => {
  try {
    if (!userId) {
      throw new Error('User ID is required to save dashboard layout');
    }

    if (!Array.isArray(layout)) {
      throw new Error('Layout must be an array');
    }

    const sanitizedLayout = layout.map(sanitizeLayoutItem);

    const docRef = doc(db, 'dashboards', userId);
    await setDoc(docRef, {
      layout: sanitizedLayout,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving dashboard layout:', error);
    throw error;
  }
};
