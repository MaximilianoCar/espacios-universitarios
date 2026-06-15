// features/rooms/roomsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../axiosConfig';

const buildQueryKey = ({ page = 1, pageSize = 12, search = '' } = {}) =>
  `${page}|${pageSize}|${String(search || '')
    .trim()
    .toLowerCase()}`;

export const fetchRooms = createAsyncThunk(
  'rooms/fetchRooms',
  async ({ page = 1, pageSize = 12, search = '' } = {}) => {
    const res = await axiosInstance.get('/rooms', {
      params: { page, pageSize, search },
    });
    return { ...(res.data || {}), query: { page, pageSize, search } };
  }
);

export const createRoom = createAsyncThunk(
  'rooms/createRoom',
  async (payload, { rejectWithValue }) => {
    try {
      // Determinar si es FormData para establecer el header correcto
      const isFormData = payload instanceof FormData;

      const res = await axiosInstance.post('/rooms', payload, {
        headers: isFormData
          ? {
              'Content-Type': 'multipart/form-data',
            }
          : {
              'Content-Type': 'application/json',
            },
      });

      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateRoom = createAsyncThunk(
  'rooms/updateRoom',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const isFormData = data instanceof FormData;

      const res = await axiosInstance.put(`/rooms/${id}`, data, {
        headers: isFormData
          ? {
              'Content-Type': 'multipart/form-data',
            }
          : {
              'Content-Type': 'application/json',
            },
      });

      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteRoom = createAsyncThunk('rooms/deleteRoom', async id => {
  await axiosInstance.delete(`/rooms/${id}`);
  return id;
});

const roomsSlice = createSlice({
  name: 'rooms',
  initialState: {
    items: [],
    loading: false,
    lastFetched: null,
    error: null,
    totalRooms: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 12,
    lastQueryKey: null,
  },
  reducers: {
    invalidateRooms(state) {
      state.lastFetched = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchRooms.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload || {};
        const rooms = Array.isArray(payload.rooms)
          ? payload.rooms
          : Array.isArray(payload)
            ? payload
            : [];
        state.items = rooms;
        state.totalRooms = Number(payload.totalRooms || 0);
        state.totalPages = Number(payload.totalPages || 1);
        const query = payload.query || {};
        state.currentPage = Number(query.page || 1);
        state.pageSize = Number(query.pageSize || state.pageSize || 12);
        state.lastQueryKey = buildQueryKey(query);
        state.lastFetched = Date.now();
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createRoom.fulfilled, state => {
        state.lastFetched = null;
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(updateRoom.fulfilled, state => {
        state.lastFetched = null;
      })
      .addCase(updateRoom.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(deleteRoom.fulfilled, state => {
        state.lastFetched = null;
      });
  },
});

export const { invalidateRooms } = roomsSlice.actions;
export const selectRooms = state => state.rooms.items;
export const selectRoomsLoading = state => state.rooms.loading;
export const selectRoomsLastFetched = state => state.rooms.lastFetched;

export const selectRoomsTotalPages = state => state.rooms.totalPages;
export const selectRoomsTotalRooms = state => state.rooms.totalRooms;
export const selectRoomsCurrentPage = state => state.rooms.currentPage;
export const selectRoomsPageSize = state => state.rooms.pageSize;

export default roomsSlice.reducer;
