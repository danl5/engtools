import { Button, Container, TextField, Typography, Alert, Box, Card, CardContent, IconButton, InputAdornment } from '@mui/material'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import api from '../api'
import { setToken, setLoading, setError, openSnackbar } from '../store'
import { RootState } from '../store'

export default function Login() {
  const dispatch = useDispatch()
  const error = useSelector((s: RootState) => s.ui.error)
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [showPwd, setShowPwd] = useState(false)
  const onSubmit = async () => {
    if (!username || !password) { dispatch(setError('Please enter username and password')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/auth/login', { username, password })
      dispatch(setToken(data.token))
      dispatch(setError(''))
      dispatch(openSnackbar({ message: 'Signed in successfully', severity: 'success' }))
    } catch (e: any) {
      dispatch(setError('Sign in failed'))
      dispatch(openSnackbar({ message: 'Sign in failed', severity: 'error' }))
    } finally {
      dispatch(setLoading(false))
    }
  }
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card sx={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Sign In</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField label="Username" value={username} onChange={e=>setUsername(e.target.value)} fullWidth required />
            <TextField label="Password" type={showPwd ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)} fullWidth required InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={()=>setShowPwd(s=>!s)}>{showPwd ? '🙈' : '👁️'}</IconButton></InputAdornment> }} />
            <Button variant="contained" onClick={onSubmit}>Sign In</Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}