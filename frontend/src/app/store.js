import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import roomsReducer from '../features/rooms/roomsSlice';
import eventsReducer from '../features/events/eventsSlice';
import requestsReducer from '../features/requests/requestsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    rooms: roomsReducer,
    events: eventsReducer,
    requests: requestsReducer,
  },
});
