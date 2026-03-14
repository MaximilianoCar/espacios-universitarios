import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../axiosConfig';

const CACHE_TTL_MS = 10 * 60 * 1000;

const buildQueryKey = ({ page = 1, pageSize = 25, search = '' } = {}) =>
  `${page}|${pageSize}|${String(search).trim().toLowerCase()}`;

const extractEventFromPayload = payload => {
  if (!payload) return null;
  if (payload.event && typeof payload.event === 'object') return payload.event;
  if (payload.id) return payload;
  return null;
};

const mergeEvent = (prev, next) => ({
  ...prev,
  ...next,
  room: next?.room || prev?.room,
  user: next?.user || prev?.user,
  schedules: next?.schedules || prev?.schedules,
});

const eventMatchesSearch = (event, search) => {
  const normalizedSearch = String(search || '')
    .trim()
    .toLowerCase();

  if (!normalizedSearch) return true;

  const haystack = [
    event?.name,
    event?.description,
    event?.contact,
    event?.room?.name,
    event?.user?.name,
    event?.user?.email,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalizedSearch);
};

const upsertEventInState = (
  state,
  incomingEvent,
  { addIfMissing = true } = {}
) => {
  if (!incomingEvent || !incomingEvent.id) return;

  const eventId = Number(incomingEvent.id);
  const existingIndex = state.data.findIndex(
    item => Number(item.id) === eventId
  );

  if (existingIndex >= 0) {
    state.data[existingIndex] = mergeEvent(
      state.data[existingIndex],
      incomingEvent
    );
  } else if (addIfMissing) {
    state.data.unshift(incomingEvent);
  }
};

export const fetchRequests = createAsyncThunk(
  'requests/fetchRequests',
  async (
    { page = 1, pageSize = 25, search = '' } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.get('/admin/events', {
        params: { page, pageSize, search },
      });

      return {
        ...response.data,
        query: { page, pageSize, search },
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
  {
    condition: (args = {}, { getState }) => {
      const state = getState();
      const requestsState = state.requests;

      if (!requestsState) return true;
      if (args.force) return true;
      if (requestsState.status === 'loading') return false;
      if (!Array.isArray(requestsState.data) || requestsState.data.length === 0)
        return true;
      if (!requestsState.lastFetched) return true;

      const isExpired = Date.now() - requestsState.lastFetched > CACHE_TTL_MS;
      if (isExpired) return true;

      const requestedQueryKey = buildQueryKey(args);
      return requestsState.lastQueryKey !== requestedQueryKey;
    },
  }
);

export const createRequest = createAsyncThunk(
  'requests/createRequest',
  async (payload, { rejectWithValue, dispatch, getState }) => {
    try {
      const isFormData = payload instanceof FormData;

      const response = await axiosInstance.post('/events', payload, {
        headers: isFormData
          ? { 'Content-Type': 'multipart/form-data' }
          : { 'Content-Type': 'application/json' },
      });

      // Invalidate cache so next fetchRequests will reload data.
      dispatch(invalidateRequests());

      // Ensure we fetch updated data immediately for the current query.
      const state = getState();
      const requestsState = state.requests || {};
      const currentPage = Number(requestsState.currentPage || 1);
      const pageSize = Number(requestsState.pageSize || 25);
      const currentSearch = requestsState.currentSearch || '';

      dispatch(
        fetchRequests({
          page: currentPage,
          pageSize,
          search: currentSearch,
          force: true,
        })
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateRequest = createAsyncThunk(
  'requests/updateRequest',
  async ({ eventId, payload }, { rejectWithValue }) => {
    try {
      const isFormData = payload instanceof FormData;

      const response = await axiosInstance.put(`/events/${eventId}`, payload, {
        headers: isFormData
          ? { 'Content-Type': 'multipart/form-data' }
          : { 'Content-Type': 'application/json' },
      });

      let returned = response.data;

      const updatedEvent = extractEventFromPayload(returned);
      const needsRoomRefresh =
        updatedEvent &&
        updatedEvent.roomId &&
        (!updatedEvent.room ||
          Number(updatedEvent.room.id) !== Number(updatedEvent.roomId));

      if (needsRoomRefresh) {
        try {
          const fresh = await axiosInstance.get(`/events/${eventId}`);
          returned = fresh.data;
        } catch (e) {}
      }

      return returned;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteRequest = createAsyncThunk(
  'requests/deleteRequest',
  async (eventId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/events/${eventId}`);
      return Number(eventId);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const uploadRequestFiles = createAsyncThunk(
  'requests/uploadRequestFiles',
  async ({ eventId, payload }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/events/${eventId}/upload-files`,
        payload,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const uploadRequestBanner = createAsyncThunk(
  'requests/uploadRequestBanner',
  async ({ eventId, payload }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/events/${eventId}/upload-banner`,
        payload,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const removeRequestBanner = createAsyncThunk(
  'requests/removeRequestBanner',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/events/${eventId}/banner`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const uploadRequestImage = createAsyncThunk(
  'requests/uploadRequestImage',
  async ({ eventId, payload }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/events/${eventId}/upload-image`,
        payload,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const removeRequestImage = createAsyncThunk(
  'requests/removeRequestImage',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/events/${eventId}/image`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const removeRequestAgreement = createAsyncThunk(
  'requests/removeRequestAgreement',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(
        `/events/${eventId}/agreement`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const removeRequestProgram = createAsyncThunk(
  'requests/removeRequestProgram',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/events/${eventId}/program`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  data: [],
  status: 'idle',
  error: null,
  lastFetched: null,
  totalEvents: 0,
  totalPages: 1,
  currentPage: 1,
  pageSize: 25,
  currentSearch: '',
  lastQueryKey: null,
};

const requestsSlice = createSlice({
  name: 'requests',
  initialState,
  reducers: {
    invalidateRequests(state) {
      state.lastFetched = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchRequests.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchRequests.fulfilled, (state, action) => {
        const payload = action.payload || {};
        const events = Array.isArray(payload.events)
          ? payload.events
          : Array.isArray(payload)
            ? payload
            : [];

        state.status = 'succeeded';
        state.data = events;
        state.totalEvents = Number(payload.totalEvents || events.length || 0);
        state.totalPages = Number(payload.totalPages || 1);

        const query = payload.query || {};
        state.currentPage = Number(query.page || 1);
        state.pageSize = Number(query.pageSize || state.pageSize || 25);
        state.currentSearch = query.search || '';
        state.lastQueryKey = buildQueryKey(query);
        state.lastFetched = Date.now();
      })
      .addCase(fetchRequests.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      .addCase(createRequest.fulfilled, (state, action) => {
        const createdEvent = extractEventFromPayload(action.payload);

        if (!createdEvent) {
          return;
        }

        if (state.currentPage !== 1) {
          return;
        }

        if (!eventMatchesSearch(createdEvent, state.currentSearch)) {
          return;
        }

        upsertEventInState(state, createdEvent, { addIfMissing: true });
        state.totalEvents += 1;
        state.lastFetched = Date.now();
      })
      .addCase(createRequest.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(updateRequest.fulfilled, (state, action) => {
        const updatedEvent = extractEventFromPayload(action.payload);
        upsertEventInState(state, updatedEvent, { addIfMissing: false });
        state.lastFetched = Date.now();
      })
      .addCase(updateRequest.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(deleteRequest.fulfilled, (state, action) => {
        const eventId = Number(action.payload);
        const previousLength = state.data.length;

        state.data = state.data.filter(item => Number(item.id) !== eventId);

        if (state.data.length < previousLength) {
          state.totalEvents = Math.max(0, state.totalEvents - 1);
        }

        state.lastFetched = Date.now();
      })
      .addCase(deleteRequest.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(uploadRequestFiles.fulfilled, (state, action) => {
        const updatedEvent = extractEventFromPayload(action.payload);
        upsertEventInState(state, updatedEvent, { addIfMissing: false });
        state.lastFetched = Date.now();
      })
      .addCase(uploadRequestBanner.fulfilled, (state, action) => {
        const updatedEvent = extractEventFromPayload(action.payload);
        upsertEventInState(state, updatedEvent, { addIfMissing: false });
        state.lastFetched = Date.now();
      })
      .addCase(removeRequestBanner.fulfilled, (state, action) => {
        const updatedEvent = extractEventFromPayload(action.payload);
        upsertEventInState(state, updatedEvent, { addIfMissing: false });
        state.lastFetched = Date.now();
      })
      .addCase(uploadRequestImage.fulfilled, (state, action) => {
        const updatedEvent = extractEventFromPayload(action.payload);
        upsertEventInState(state, updatedEvent, { addIfMissing: false });
        state.lastFetched = Date.now();
      })
      .addCase(removeRequestImage.fulfilled, (state, action) => {
        const updatedEvent = extractEventFromPayload(action.payload);
        upsertEventInState(state, updatedEvent, { addIfMissing: false });
        state.lastFetched = Date.now();
      })
      .addCase(removeRequestAgreement.fulfilled, (state, action) => {
        const updatedEvent = extractEventFromPayload(action.payload);
        upsertEventInState(state, updatedEvent, { addIfMissing: false });
        state.lastFetched = Date.now();
      })
      .addCase(removeRequestProgram.fulfilled, (state, action) => {
        const updatedEvent = extractEventFromPayload(action.payload);
        upsertEventInState(state, updatedEvent, { addIfMissing: false });
        state.lastFetched = Date.now();
      });
  },
});

export const { invalidateRequests } = requestsSlice.actions;

export const selectRequests = state => state.requests.data;
export const selectRequestsStatus = state => state.requests.status;
export const selectRequestsError = state => state.requests.error;
export const selectRequestsLastFetched = state => state.requests.lastFetched;
export const selectRequestsTotalEvents = state => state.requests.totalEvents;
export const selectRequestsTotalPages = state => state.requests.totalPages;

export default requestsSlice.reducer;
