import { Container, Typography, Grid, TextField, Button, Alert, MenuItem, Select, FormControl, InputLabel, Card, CardContent } from '@mui/material'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import api from '../api'
import { setLoading, setError } from '../store'
import { RootState } from '../store'
import { trackEvent } from '../analytics'

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
  const [active, setActive] = useState<'aes' | 'aes_cbc' | 'chacha' | 'rsa' | 'sha' | 'hmac' | 'pbkdf2' | 'bcrypt'>('aes')
  const [iv, setIv] = useState('')
  const [hmacAlg, setHmacAlg] = useState('sha256')
  const [hmacKey, setHmacKey] = useState('')
  const [hmacInput, setHmacInput] = useState('')
  const [hmacOut, setHmacOut] = useState('')
  const [pbPassword, setPbPassword] = useState('')
  const [pbSalt, setPbSalt] = useState('')
  const [pbIter, setPbIter] = useState(100000)
  const [pbDkLen, setPbDkLen] = useState(32)
  const [pbAlg, setPbAlg] = useState('sha256')
  const [pbOutKey, setPbOutKey] = useState('')
  const [pbOutSalt, setPbOutSalt] = useState('')
  const [bcPassword, setBcPassword] = useState('')
  const [bcCost, setBcCost] = useState(10)
  const [bcHash, setBcHash] = useState('')
  const [bcVerifyOk, setBcVerifyOk] = useState<boolean | null>(null)
  const genKey = () => {
    const arr = new Uint8Array(32); crypto.getRandomValues(arr)
    setKey(btoa(String.fromCharCode(...arr)))
  }
  const doEncrypt = async () => {
    if (!key || !plaintext) { dispatch(setError('Please enter key and plaintext')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/crypto/aes/encrypt', { key: key.replace(/\s+/g, ''), plaintext })
      setNonce(data.nonce); setCipher(data.cipher); dispatch(setError(''))
      trackEvent('crypto_aes_encrypt')
    } catch { dispatch(setError('Encryption failed')) } finally { dispatch(setLoading(false)) }
  }
  const doDecrypt = async () => {
    if (!key || !nonce || !cipher) { dispatch(setError('Please enter key, nonce and ciphertext')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/crypto/aes/decrypt', { key: key.replace(/\s+/g, ''), nonce: nonce.replace(/\s+/g, ''), cipher: cipher.replace(/\s+/g, '') })
      setPlaintext(data.plaintext); dispatch(setError(''))
      trackEvent('crypto_aes_decrypt')
    } catch { dispatch(setError('Decryption failed')) } finally { dispatch(setLoading(false)) }
  }
  const doCbcEncrypt = async () => {
    if (!key || !plaintext) { dispatch(setError('Please enter key and plaintext')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/crypto/aes/cbc/encrypt', { key: key.replace(/\s+/g, ''), plaintext, iv: iv ? iv.replace(/\s+/g, '') : '' })
      setIv(data.iv); setCipher(data.cipher); dispatch(setError(''))
      trackEvent('crypto_aes_cbc_encrypt')
    } catch { dispatch(setError('AES-CBC encryption failed')) } finally { dispatch(setLoading(false)) }
  }
  const doCbcDecrypt = async () => {
    if (!key || !iv || !cipher) { dispatch(setError('Please enter key, iv and ciphertext')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/crypto/aes/cbc/decrypt', { key: key.replace(/\s+/g, ''), iv: iv.replace(/\s+/g, ''), cipher: cipher.replace(/\s+/g, '') })
      setPlaintext(data.plaintext); dispatch(setError(''))
      trackEvent('crypto_aes_cbc_decrypt')
    } catch { dispatch(setError('AES-CBC decryption failed')) } finally { dispatch(setLoading(false)) }
  }
  const doChaEncrypt = async () => {
    if (!key || !plaintext) { dispatch(setError('Please enter key and plaintext')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/crypto/chacha/encrypt', { key: key.replace(/\s+/g, ''), plaintext, nonce: nonce ? nonce.replace(/\s+/g, '') : '' })
      setNonce(data.nonce); setCipher(data.cipher); dispatch(setError(''))
      trackEvent('crypto_chacha_encrypt')
    } catch { dispatch(setError('ChaCha20-Poly1305 encryption failed')) } finally { dispatch(setLoading(false)) }
  }
  const doChaDecrypt = async () => {
    if (!key || !nonce || !cipher) { dispatch(setError('Please enter key, nonce and ciphertext')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/crypto/chacha/decrypt', { key: key.replace(/\s+/g, ''), nonce: nonce.replace(/\s+/g, ''), cipher: cipher.replace(/\s+/g, '') })
      setPlaintext(data.plaintext); dispatch(setError(''))
      trackEvent('crypto_chacha_decrypt')
    } catch { dispatch(setError('ChaCha20-Poly1305 decryption failed')) } finally { dispatch(setLoading(false)) }
  }
  const doHmac = async () => {
    if (!hmacKey || !hmacInput) { dispatch(setError('Please enter key and input')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/crypto/hmac/calc', { alg: hmacAlg, key: hmacKey.replace(/\s+/g, ''), data: hmacInput })
      setHmacOut(data.hex); dispatch(setError(''))
      trackEvent('crypto_hmac_calc', { alg: hmacAlg })
    } catch { dispatch(setError('HMAC failed')) } finally { dispatch(setLoading(false)) }
  }
  const doPBKDF2 = async () => {
    if (!pbPassword) { dispatch(setError('Please enter password')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/crypto/pbkdf2/derive', { password: pbPassword, salt: pbSalt ? pbSalt.replace(/\s+/g, '') : '', iter: pbIter, dkLen: pbDkLen, alg: pbAlg })
      setPbOutSalt(data.salt); setPbOutKey(data.key); dispatch(setError(''))
      trackEvent('crypto_pbkdf2_derive', { alg: pbAlg, iter: pbIter, dkLen: pbDkLen })
    } catch { dispatch(setError('PBKDF2 failed')) } finally { dispatch(setLoading(false)) }
  }
  const doBcryptHash = async () => {
    if (!bcPassword) { dispatch(setError('Please enter password')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/crypto/bcrypt/hash', { password: bcPassword, cost: bcCost })
      setBcHash(data.hash); dispatch(setError(''))
      trackEvent('crypto_bcrypt_hash', { cost: bcCost })
    } catch { dispatch(setError('Bcrypt hash failed')) } finally { dispatch(setLoading(false)) }
  }
  const doBcryptVerify = async () => {
    if (!bcPassword || !bcHash) { dispatch(setError('Please enter password and hash')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/crypto/bcrypt/verify', { password: bcPassword, hash: bcHash })
      setBcVerifyOk(!!data.ok); dispatch(setError(''))
      trackEvent('crypto_bcrypt_verify')
    } catch { dispatch(setError('Bcrypt verify failed')) } finally { dispatch(setLoading(false)) }
  }
  const rsaGenerate = async () => {
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/crypto/rsa/generate', { bits: 2048 })
      setPrivKey(data.private); setPubKey(data.public); dispatch(setError(''))
      trackEvent('crypto_rsa_generate', { bits: 2048 })
    } catch { dispatch(setError('Key generation failed')) } finally { dispatch(setLoading(false)) }
  }
  const rsaEncrypt = async () => {
    if (!pubKey || !rsaPlain) { dispatch(setError('Please enter public key and plaintext')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/crypto/rsa/encrypt', { key: pubKey.trim(), data: rsaPlain })
      setRsaCipher(data.cipher); dispatch(setError(''))
      trackEvent('crypto_rsa_encrypt')
    } catch { dispatch(setError('RSA encryption failed')) } finally { dispatch(setLoading(false)) }
  }
  const rsaDecrypt = async () => {
    if (!privKey || !rsaCipher) { dispatch(setError('Please enter private key and ciphertext')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/crypto/rsa/decrypt', { key: privKey.trim(), data: rsaCipher })
      setRsaPlain(data.plaintext); dispatch(setError(''))
      trackEvent('crypto_rsa_decrypt')
    } catch { dispatch(setError('RSA decryption failed')) } finally { dispatch(setLoading(false)) }
  }
  const shaHash = async () => {
    if (!shaInput) { dispatch(setError('Please enter hash input')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/crypto/sha/hash', { alg: shaAlg, data: shaInput })
      setShaOut(data.hex); dispatch(setError(''))
      trackEvent('crypto_sha_hash', { alg: shaAlg })
    } catch { dispatch(setError('Hashing failed')) } finally { dispatch(setLoading(false)) }
  }
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Crypto Tools</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="active-alg">Algorithm</InputLabel>
            <Select labelId="active-alg" label="Algorithm" value={active} onChange={e=>setActive(e.target.value as any)}>
              <MenuItem value="aes">AES-GCM</MenuItem>
              <MenuItem value="aes_cbc">AES-CBC</MenuItem>
              <MenuItem value="chacha">ChaCha20-Poly1305</MenuItem>
              <MenuItem value="rsa">RSA</MenuItem>
              <MenuItem value="sha">SHA</MenuItem>
              <MenuItem value="hmac">HMAC</MenuItem>
              <MenuItem value="pbkdf2">PBKDF2</MenuItem>
              <MenuItem value="bcrypt">bcrypt</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {active === 'aes' && (
          <Grid item xs={12}>
            <Grid container spacing={2}>
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
            </Grid>
          </Grid>
        )}
        {active === 'aes_cbc' && (
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}><CardContent>
                  <TextField label="Key(Base64)" value={key} onChange={e=>setKey(e.target.value)} fullWidth required />
                  <TextField sx={{ mt:1 }} label="Plaintext" value={plaintext} onChange={e=>setPlaintext(e.target.value)} fullWidth multiline rows={4} required />
                  <TextField sx={{ mt:1 }} label="IV(Base64, optional)" value={iv} onChange={e=>setIv(e.target.value)} fullWidth />
                  <Button sx={{ mt: 1 }} variant="contained" onClick={doCbcEncrypt}>Encrypt</Button>
                </CardContent></Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}><CardContent>
                  <TextField label="IV(Base64)" value={iv} onChange={e=>setIv(e.target.value)} fullWidth required />
                  <TextField sx={{ mt:1 }} label="Ciphertext(Base64)" value={cipher} onChange={e=>setCipher(e.target.value)} fullWidth multiline rows={4} required />
                  <Button sx={{ mt: 1 }} variant="outlined" onClick={doCbcDecrypt}>Decrypt</Button>
                </CardContent></Card>
              </Grid>
            </Grid>
          </Grid>
        )}
        {active === 'chacha' && (
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}><CardContent>
                  <TextField label="Key(Base64, 32 bytes)" value={key} onChange={e=>setKey(e.target.value)} fullWidth required />
                  <TextField sx={{ mt:1 }} label="Plaintext" value={plaintext} onChange={e=>setPlaintext(e.target.value)} fullWidth multiline rows={4} required />
                  <TextField sx={{ mt:1 }} label="Nonce(Base64, optional)" value={nonce} onChange={e=>setNonce(e.target.value)} fullWidth />
                  <Button sx={{ mt: 1 }} variant="contained" onClick={doChaEncrypt}>Encrypt</Button>
                </CardContent></Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}><CardContent>
                  <TextField label="Nonce(Base64, 12 bytes)" value={nonce} onChange={e=>setNonce(e.target.value)} fullWidth required />
                  <TextField sx={{ mt:1 }} label="Ciphertext(Base64)" value={cipher} onChange={e=>setCipher(e.target.value)} fullWidth multiline rows={4} required />
                  <Button sx={{ mt: 1 }} variant="outlined" onClick={doChaDecrypt}>Decrypt</Button>
                </CardContent></Card>
              </Grid>
            </Grid>
          </Grid>
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
        {active === 'hmac' && (
          <Grid item xs={12} md={8}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
              <CardContent>
                <FormControl fullWidth>
                  <InputLabel id="hmac-alg">Algorithm</InputLabel>
                  <Select labelId="hmac-alg" label="Algorithm" value={hmacAlg} onChange={e=>setHmacAlg(e.target.value as string)}>
                    <MenuItem value="sha1">HMAC-SHA1</MenuItem>
                    <MenuItem value="sha256">HMAC-SHA256</MenuItem>
                    <MenuItem value="sha512">HMAC-SHA512</MenuItem>
                  </Select>
                </FormControl>
                <TextField sx={{ mt:1 }} label="Key(Base64)" value={hmacKey} onChange={e=>setHmacKey(e.target.value)} fullWidth />
                <TextField sx={{ mt:1 }} label="Input" value={hmacInput} onChange={e=>setHmacInput(e.target.value)} fullWidth multiline rows={4} />
                <Button sx={{ mt: 1 }} variant="contained" onClick={doHmac}>Compute HMAC</Button>
                <TextField sx={{ mt:2 }} label="Output(Base64)" value={hmacOut} fullWidth multiline rows={3} />
              </CardContent>
            </Card>
          </Grid>
        )}
        {active === 'pbkdf2' && (
          <Grid item xs={12} md={8}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
              <CardContent>
                <FormControl fullWidth>
                  <InputLabel id="pbkdf2-alg">Algorithm</InputLabel>
                  <Select labelId="pbkdf2-alg" label="Algorithm" value={pbAlg} onChange={e=>setPbAlg(e.target.value as string)}>
                    <MenuItem value="sha1">SHA1</MenuItem>
                    <MenuItem value="sha256">SHA256</MenuItem>
                    <MenuItem value="sha512">SHA512</MenuItem>
                  </Select>
                </FormControl>
                <TextField sx={{ mt:1 }} label="Password" value={pbPassword} onChange={e=>setPbPassword(e.target.value)} fullWidth />
                <TextField sx={{ mt:1 }} label="Salt(Base64, optional)" value={pbSalt} onChange={e=>setPbSalt(e.target.value)} fullWidth />
                <Grid container spacing={2} sx={{ mt:1 }}>
                  <Grid item xs={6}><TextField label="Iterations" type="number" value={pbIter} onChange={e=>setPbIter(Number(e.target.value))} fullWidth /></Grid>
                  <Grid item xs={6}><TextField label="Key Length" type="number" value={pbDkLen} onChange={e=>setPbDkLen(Number(e.target.value))} fullWidth /></Grid>
                </Grid>
                <Button sx={{ mt: 1 }} variant="contained" onClick={doPBKDF2}>Derive Key</Button>
                <TextField sx={{ mt:2 }} label="Salt(Base64)" value={pbOutSalt} fullWidth />
                <TextField sx={{ mt:1 }} label="Key(Base64)" value={pbOutKey} fullWidth />
              </CardContent>
            </Card>
          </Grid>
        )}
        {active === 'bcrypt' && (
          <Grid item xs={12} md={8}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
              <CardContent>
                <TextField label="Password" value={bcPassword} onChange={e=>setBcPassword(e.target.value)} fullWidth />
                <TextField sx={{ mt:1 }} label="Cost" type="number" value={bcCost} onChange={e=>setBcCost(Number(e.target.value))} fullWidth />
                <Button sx={{ mt:1 }} variant="contained" onClick={doBcryptHash}>Hash</Button>
                <TextField sx={{ mt:2 }} label="Hash" value={bcHash} onChange={e=>setBcHash(e.target.value)} fullWidth multiline rows={3} />
                <Button sx={{ mt:1 }} variant="outlined" onClick={doBcryptVerify}>Verify</Button>
                {bcVerifyOk !== null && <Alert sx={{ mt:1 }} severity={bcVerifyOk ? 'success' : 'error'}>{bcVerifyOk ? 'Match' : 'Not match'}</Alert>}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  )
}
