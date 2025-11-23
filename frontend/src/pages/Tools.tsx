import { Container, Typography, Grid, TextField, Button, Alert, Card, CardContent } from '@mui/material'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import api from '../api'
import { setLoading, setError, openSnackbar } from '../store'
import { RootState } from '../store'

export default function Tools() {
  const dispatch = useDispatch()
  const error = useSelector((s: RootState) => s.ui.error)
  const [text, setText] = useState('')
  const [base64, setBase64] = useState('')
  const encode = async () => {
    if (!text) { dispatch(setError('Please enter text')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/tools/base64/encode', { value: text })
      setBase64(data.base64)
      dispatch(setError(''))
      dispatch(openSnackbar({ message: 'Encoded successfully', severity: 'success' }))
    } catch { dispatch(setError('Encoding failed')) } finally { dispatch(setLoading(false)) }
  }
  const decode = async () => {
    if (!base64) { dispatch(setError('Please enter Base64')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/tools/base64/decode', { value: base64 })
      setText(data.text)
      dispatch(setError(''))
      dispatch(openSnackbar({ message: 'Decoded successfully', severity: 'success' }))
    } catch { dispatch(setError('Decoding failed')) } finally { dispatch(setLoading(false)) }
  }
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Tools: Base64 and Text</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent>
              <TextField label="Text" value={text} onChange={e=>setText(e.target.value)} fullWidth multiline rows={5} required />
              <Button sx={{ mt: 1 }} variant="contained" onClick={encode}>Encode to Base64</Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent>
              <TextField label="Base64" value={base64} onChange={e=>setBase64(e.target.value)} fullWidth multiline rows={5} required />
              <Button sx={{ mt: 1 }} variant="outlined" onClick={decode}>Decode to Text</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}