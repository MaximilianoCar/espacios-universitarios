import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../axiosConfig';

export const fetchEvents = createAsyncThunk('events/fetchEvents', async () => {
  const res = await axiosInstance.get('/events');
  return res.data || [];
});

const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    items: [],
    loading: false,
    lastFetched: null,
    error: null,
  },
  reducers: {
    invalidateEvents(state) {
      state.lastFetched = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchEvents.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { invalidateEvents } = eventsSlice.actions;

export const selectEvents = state => state.events.items;
export const selectEventsLoading = state => state.events.loading;
export const selectEventsLastFetched = state => state.events.lastFetched;

export default eventsSlice.reducer;
