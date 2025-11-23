import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit'

const initialToken = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''
const authSlice = createSlice({
  name: 'auth',
  initialState: { token: initialToken },
  reducers: {
    setToken: (state, action: PayloadAction<string>) => { state.token = action.payload },
    clearToken: (state) => { state.token = '' }
  }
})

const uiSlice = createSlice({
  name: 'ui',
  initialState: { loading: false, error: '', snackbar: { open: false, message: '', severity: 'info' as 'success' | 'error' | 'info' | 'warning' } },
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => { state.loading = action.payload },
    setError: (state, action: PayloadAction<string>) => { state.error = action.payload },
    openSnackbar: (state, action: PayloadAction<{ message: string; severity?: 'success' | 'error' | 'info' | 'warning' }>) => {
      state.snackbar.open = true
      state.snackbar.message = action.payload.message
      state.snackbar.severity = action.payload.severity || 'info'
    },
    closeSnackbar: (state) => { state.snackbar.open = false }
  }
})

export const { setToken, clearToken } = authSlice.actions
export const { setLoading, setError, openSnackbar, closeSnackbar } = uiSlice.actions

export const store = configureStore({ reducer: { auth: authSlice.reducer, ui: uiSlice.reducer } })
store.subscribe(() => {
  const s = store.getState() as any
  if (typeof window !== 'undefined') localStorage.setItem('token', s.auth.token)
})
export type RootState = ReturnType<typeof store.getState>