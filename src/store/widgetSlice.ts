import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WidgetState {
  dashboardLayout: any[];
  widgetSettings: Record<string, any>;
}

const initialState: WidgetState = {
  dashboardLayout: [],
  widgetSettings: {},
};

const widgetSlice = createSlice({
  name: 'widgets',
  initialState,
  reducers: {
    updateDashboardLayout: (state, action: PayloadAction<any[]>) => {
      state.dashboardLayout = action.payload;
    },
    updateWidgetSettings: (state, action: PayloadAction<{ id: string, settings: any }>) => {
      const { id, settings } = action.payload;
      state.widgetSettings[id] = settings;
    },
    resetWidgetSettings: (state) => {
      state.widgetSettings = {};
    },
  },
});

export const { updateDashboardLayout, updateWidgetSettings, resetWidgetSettings } = widgetSlice.actions;
export default widgetSlice.reducer;
