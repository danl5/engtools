import { Container, Typography, Grid, TextField, Button, Alert, MenuItem, Select, FormControl, InputLabel, Card, CardContent } from '@mui/material'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import api from '../api'
import { setLoading, setError } from '../store'
import { RootState } from '../store'

export default function Crypto() {
  const dispatch = useDispatch()
  const error = useSelector((s: RootState) => s.ui.error)
  const [key, setKey] = useState('')
  const [plaintext, setPlaintext] = useState('')
  const [nonce, setNonce] = useState('')
  const [cipher, setCipher] = useState('')
  const [privKey, setPrivKey] = useState('')
  const [pubKey, setPubKey] = useState('')
  const [rsaPlain, setRsaPlain] = useState('')
  const [rsaCipher, setRsaCipher] = useState('')
  const [shaAlg, setShaAlg] = useState('sha256')
  const [shaInput, setShaInput] = useState('')
  const [shaOut, setShaOut] = useState('')
  const [active, setActive] = useState<'aes' | 'rsa' | 'sha'>('aes')
  const genKey = () => {
    const arr = new Uint8Array(32); crypto.getRandomValues(arr)
    setKey(btoa(String.fromCharCode(...arr)))
  }
  const doEncrypt = async () => {
    if (!key || !plaintext) { dispatch(setError('Please enter key and plaintext')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/crypto/aes/encrypt', { key, plaintext })
      setNonce(data.nonce); setCipher(data.cipher); dispatch(setError(''))
    } catch { dispatch(setError('Encryption failed')) } finally { dispatch(setLoading(false)) }
  }
  const doDecrypt = async () => {
    if (!key || !nonce || !cipher) { dispatch(setError('Please enter key, nonce and ciphertext')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/crypto/aes/decrypt', { key, nonce, cipher })
      setPlaintext(data.plaintext); dispatch(setError(''))
    } catch { dispatch(setError('Decryption failed')) } finally { dispatch(setLoading(false)) }
  }
  const rsaGenerate = async () => {
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/crypto/rsa/generate', { bits: 2048 })
      setPrivKey(data.private); setPubKey(data.public); dispatch(setError(''))
    } catch { dispatch(setError('Key generation failed')) } finally { dispatch(setLoading(false)) }
  }
  const rsaEncrypt = async () => {
    if (!pubKey || !rsaPlain) { dispatch(setError('Please enter public key and plaintext')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/crypto/rsa/encrypt', { key: pubKey, data: rsaPlain })
      setRsaCipher(data.cipher); dispatch(setError(''))
    } catch { dispatch(setError('RSA encryption failed')) } finally { dispatch(setLoading(false)) }
  }
  const rsaDecrypt = async () => {
    if (!privKey || !rsaCipher) { dispatch(setError('Please enter private key and ciphertext')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/crypto/rsa/decrypt', { key: privKey, data: rsaCipher })
      setRsaPlain(data.plaintext); dispatch(setError(''))
    } catch { dispatch(setError('RSA decryption failed')) } finally { dispatch(setLoading(false)) }
  }
  const shaHash = async () => {
    if (!shaInput) { dispatch(setError('Please enter hash input')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/crypto/sha/hash', { alg: shaAlg, data: shaInput })
      setShaOut(data.hex); dispatch(setError(''))
    } catch { dispatch(setError('Hashing failed')) } finally { dispatch(setLoading(false)) }
  }
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Crypto Tools</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="active-alg">Algorithm</InputLabel>
            <Select labelId="active-alg" label="Algorithm" value={active} onChange={e=>setActive(e.target.value as any)}>
              <MenuItem value="aes">AES-GCM</MenuItem>
              <MenuItem value="rsa">RSA</MenuItem>
              <MenuItem value="sha">SHA</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {active === 'aes' && (
          <>
            <Grid item xs={12}>
              <Button variant="outlined" onClick={genKey}>Generate Random Key</Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}><CardContent>
                <TextField label="Key(Base64)" value={key} onChange={e=>setKey(e.target.value)} fullWidth required />
                <TextField sx={{ mt:1 }} label="Plaintext" value={plaintext} onChange={e=>setPlaintext(e.target.value)} fullWidth multiline rows={4} required />
                <Button sx={{ mt: 1 }} variant="contained" onClick={doEncrypt}>Encrypt</Button>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}><CardContent>
                <TextField label="Nonce(Base64)" value={nonce} onChange={e=>setNonce(e.target.value)} fullWidth required />
                <TextField sx={{ mt:1 }} label="Ciphertext(Base64)" value={cipher} onChange={e=>setCipher(e.target.value)} fullWidth multiline rows={4} required />
                <Button sx={{ mt: 1 }} variant="outlined" onClick={doDecrypt}>Decrypt</Button>
              </CardContent></Card>
            </Grid>
          </>
        )}
        {active === 'rsa' && (
          <>
            <Grid item xs={12}>
              <Button variant="outlined" onClick={rsaGenerate}>Generate RSA Keys (2048)</Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}><CardContent>
                <TextField label="Public Key(Base64-PEM)" value={pubKey} onChange={e=>setPubKey(e.target.value)} fullWidth multiline rows={4} required />
                <TextField sx={{ mt:1 }} label="Plaintext" value={rsaPlain} onChange={e=>setRsaPlain(e.target.value)} fullWidth multiline rows={4} required />
                <Button sx={{ mt: 1 }} variant="contained" onClick={rsaEncrypt}>RSA Encrypt</Button>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}><CardContent>
                <TextField label="Private Key(Base64-PEM)" value={privKey} onChange={e=>setPrivKey(e.target.value)} fullWidth multiline rows={4} required />
                <TextField sx={{ mt:1 }} label="Ciphertext(Base64)" value={rsaCipher} onChange={e=>setRsaCipher(e.target.value)} fullWidth multiline rows={4} required />
                <Button sx={{ mt: 1 }} variant="outlined" onClick={rsaDecrypt}>RSA Decrypt</Button>
              </CardContent></Card>
            </Grid>
          </>
        )}
        {active === 'sha' && (
          <Grid item xs={12} md={8}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
              <CardContent>
                <FormControl fullWidth>
                  <InputLabel id="sha-alg">Algorithm</InputLabel>
                  <Select labelId="sha-alg" label="Algorithm" value={shaAlg} onChange={e=>setShaAlg(e.target.value as string)}>
                    <MenuItem value="sha1">SHA1</MenuItem>
                    <MenuItem value="sha256">SHA256</MenuItem>
                    <MenuItem value="sha512">SHA512</MenuItem>
                  </Select>
                </FormControl>
                <TextField sx={{ mt:2 }} label="Input" value={shaInput} onChange={e=>setShaInput(e.target.value)} fullWidth multiline rows={4} />
                <Button sx={{ mt: 2 }} variant="contained" onClick={shaHash}>Compute Hash</Button>
                <TextField sx={{ mt:2 }} label="Output(Base64)" value={shaOut} fullWidth multiline rows={4} />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  )
}