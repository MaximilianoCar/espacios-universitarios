import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: localStorage.getItem('user'),
  role: localStorage.getItem('role'),
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: localStorage.getItem('isAuthenticated'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.name;
      state.role = action.payload.role;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
    logout: state => {
      state.user = null;
      state.role = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },
    refreshAccessToken: (state, action) => {
      state.token = action.payload.token;
      localStorage.setItem('token', action.payload.token);
    },
    updateUserRole: (state, action) => {
      state.role = action.payload.role;
      localStorage.setItem('role', action.payload.role);
    },
  },
});

export const { loginSuccess, logout, refreshAccessToken, updateUserRole } =
  authSlice.actions;

export default authSlice.reducer;
