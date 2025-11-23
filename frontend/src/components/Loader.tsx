import { Backdrop, CircularProgress } from '@mui/material'
import { useSelector } from 'react-redux'
import { RootState } from '../store'

export default function Loader() {
  const loading = useSelector((s: RootState) => s.ui.loading)
  return <Backdrop open={loading} sx={{ zIndex: 10000 }}><CircularProgress /></Backdrop>
}