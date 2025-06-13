import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  draggedData: [], // Data fetched from drag-and-drop
};

const revisionFloatSlice = createSlice({
  name: 'revisionFloat',
  initialState,
  reducers: {
    setDroppedObjectData(state, action) {
      state.draggedData = action.payload;
    },
  },
});

export const { setDroppedObjectData } = revisionFloatSlice.actions;

export default revisionFloatSlice.reducer;
