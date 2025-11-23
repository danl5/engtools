import axios from 'axios'
import { store, RootState } from './store'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const state: RootState = store.getState() as RootState
  const token = state.auth.token
  if (token) config.headers!.Authorization = token
  return config
})

export default api