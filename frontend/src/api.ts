import axios from 'axios'
import { store, RootState } from './store'

const base = (import.meta as any).env?.VITE_API_BASE || '/api'
const api = axios.create({ baseURL: base })

api.interceptors.request.use((config) => {
  const state: RootState = store.getState() as RootState
  const token = state.auth.token
  if (token) config.headers!.Authorization = token
  return config
})

export default api