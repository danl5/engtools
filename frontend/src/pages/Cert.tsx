import { Container, Typography, Grid, Card, CardContent, TextField, Button, Alert, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'
import { useState } from 'react'
import BigText from '../components/BigText'
import api from '../api'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { setError, setLoading, openSnackbar } from '../store'

export default function Cert() {
  const dispatch = useDispatch()
  const error = useSelector((s: RootState) => s.ui.error)
  const [active, setActive] = useState<'parse'|'verify'|'inspect'|'csr'|'convert'>('parse')
  const [pem, setPem] = useState('')
  const [parseOut, setParseOut] = useState<any>(null)
  const [host, setHost] = useState('')
  const [port, setPort] = useState(443)
  const [inspectOut, setInspectOut] = useState<any>(null)
  const [chainPem, setChainPem] = useState('')
  const [rootsPem, setRootsPem] = useState('')
  const [serverName, setServerName] = useState('')
  const [verifyOut, setVerifyOut] = useState<any>(null)
  const [csrSubject, setCsrSubject] = useState({ cn:'', o:'', ou:'', l:'', st:'', c:'' })
  const [csrSAN, setCsrSAN] = useState('')
  const [keyType, setKeyType] = useState<'rsa'|'ec'>('rsa')
  const [bits, setBits] = useState(2048)
  const [curve, setCurve] = useState('P256')
  const [csrOut, setCsrOut] = useState({ csr:'', private_key:'' })
  const parse = async () => {
    if (!pem) { dispatch(setError('Please paste certificate PEM')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/cert/parse', { pem })
      setParseOut(data); dispatch(setError(''))
      dispatch(openSnackbar({ message: 'Parsed certificate', severity: 'success' }))
    } catch (e) { dispatch(setError('Parse failed')) } finally { dispatch(setLoading(false)) }
  }
  const inspect = async () => {
    if (!host) { dispatch(setError('Please enter host')); return }
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/tls/inspect', { host, port })
      if (data.error) { setInspectOut(null); dispatch(setError(data.error)); }
      else { setInspectOut(data); dispatch(setError('')); dispatch(openSnackbar({ message: 'Fetched remote chain', severity: 'success' })) }
    } catch (err:any) { dispatch(setError('Inspect failed')) } finally { dispatch(setLoading(false)) }
  }
  const verify = async () => {
    if (!chainPem) { dispatch(setError('Please paste chain PEM (leaf first)')); return }
    dispatch(setLoading(true))
    try {
      const chain = splitPem(chainPem)
      const roots = rootsPem ? splitPem(rootsPem) : []
      const { data } = await api.post('/v1/cert/verify', { chain_pem: chain, roots_pem: roots, server_name: serverName })
      setVerifyOut(data); dispatch(setError(''))
      dispatch(openSnackbar({ message: 'Verification done', severity: 'success' }))
    } catch { dispatch(setError('Verify failed')) } finally { dispatch(setLoading(false)) }
  }
  const csrGenerate = async () => {
    const san = csrSAN.split(/[,\s]+/).filter(Boolean)
    dispatch(setLoading(true))
    try {
      const { data } = await api.post('/v1/cert/csr/generate', { cn: csrSubject.cn, o: csrSubject.o, ou: csrSubject.ou, l: csrSubject.l, st: csrSubject.st, c: csrSubject.c, san_dns: san, key_type: keyType, bits, curve })
      setCsrOut(data); dispatch(setError(''))
      dispatch(openSnackbar({ message: 'CSR generated', severity: 'success' }))
    } catch { dispatch(setError('CSR generate failed')) } finally { dispatch(setLoading(false)) }
  }
  const toDer = async () => {
    if (!pem) { dispatch(setError('Please paste certificate PEM')); return }
    dispatch(setLoading(true))
    try { const { data } = await api.post('/v1/cert/convert/to_der', { pem }); setConvertOut({ der_base64: data.der_base64 }); dispatch(setError('')) } catch { dispatch(setError('Convert failed')) } finally { dispatch(setLoading(false)) }
  }
  const [derIn, setDerIn] = useState('')
  const [convertOut, setConvertOut] = useState<any>(null)
  const toPem = async () => {
    if (!derIn) { dispatch(setError('Please paste DER(Base64)')); return }
    dispatch(setLoading(true))
    try { const { data } = await api.post('/v1/cert/convert/to_pem', { der_base64: derIn.trim() }); setConvertOut({ pem: data.pem }); dispatch(setError('')) } catch { dispatch(setError('Convert failed')) } finally { dispatch(setLoading(false)) }
  }
  const splitPem = (s: string) => { const blocks: string[] = []; const re = /-----BEGIN[^-]+-----[\s\S]*?-----END[^-]+-----/g; let m; while ((m = re.exec(s))){ blocks.push(m[0]) } return blocks }
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Certificate Tools</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="cert-tool">Select Tool</InputLabel>
            <Select labelId="cert-tool" label="Select Tool" value={active} onChange={e=>setActive(e.target.value as any)}>
              <MenuItem value="parse">Parse Certificate</MenuItem>
              <MenuItem value="verify">Verify Chain</MenuItem>
              <MenuItem value="inspect">Inspect Remote</MenuItem>
              <MenuItem value="csr">Generate CSR</MenuItem>
              <MenuItem value="convert">Convert (PEM↔DER)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {active==='parse' && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)' }}><CardContent sx={{ p:3 }}>
              <Typography variant="h6">Parse Certificate</Typography>
              <BigText label="Certificate PEM" value={pem} onChange={setPem} onExecute={parse} />
              <Button sx={{ mt:1, mr:1 }} variant="contained" onClick={parse}>Parse</Button>
              <Button sx={{ mt:1 }} variant="outlined" onClick={toDer}>PEM → DER(Base64)</Button>
              {parseOut && parseOut.certs && (
                <TableContainer component={Paper} sx={{ mt:2, background:'rgba(255,255,255,0.06)' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Subject</TableCell>
                        <TableCell>Issuer</TableCell>
                        <TableCell>Valid From</TableCell>
                        <TableCell>Valid To</TableCell>
                        <TableCell>Key</TableCell>
                        <TableCell>CA</TableCell>
                        <TableCell>Key Usage</TableCell>
                        <TableCell>Ext Key Usage</TableCell>
                        <TableCell>Fingerprint(SHA256)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {parseOut.certs.map((ci:any, idx:number)=> (
                        <TableRow key={idx}>
                          <TableCell>{ci.subject}</TableCell>
                          <TableCell>{ci.issuer}</TableCell>
                          <TableCell>{new Date(ci.not_before).toLocaleString()}</TableCell>
                          <TableCell>{new Date(ci.not_after).toLocaleString()}</TableCell>
                          <TableCell>{ci.key_alg} {ci.key_bits || ''}</TableCell>
                          <TableCell>{ci.is_ca ? 'Yes' : 'No'}</TableCell>
                          <TableCell>{Array.isArray(ci.key_usage) && ci.key_usage.length ? ci.key_usage.join(', ') : '-'}</TableCell>
                          <TableCell>{Array.isArray(ci.ext_key_usage) && ci.ext_key_usage.length ? ci.ext_key_usage.join(', ') : '-'}</TableCell>
                          <TableCell sx={{ fontFamily:'monospace' }}>{ci.fingerprint_sha256}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent></Card>
          </Grid>
        )}
        {active==='verify' && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)' }}><CardContent sx={{ p:3 }}>
              <Typography variant="h6">Verify Chain</Typography>
              <BigText label="Chain PEM (leaf first, multiple PEM)" value={chainPem} onChange={setChainPem} />
              <BigText label="Roots PEM (optional)" value={rootsPem} onChange={setRootsPem} />
              <TextField sx={{ mt:1 }} label="Server Name (optional)" value={serverName} onChange={e=>setServerName(e.target.value)} fullWidth />
              <Button sx={{ mt:1 }} variant="contained" onClick={verify}>Verify</Button>
              {verifyOut && <Alert sx={{ mt:2 }} severity={verifyOut.ok ? 'success' : 'error'}>{verifyOut.ok ? `Valid chains: ${verifyOut.chains}` : verifyOut.error}</Alert>}
            </CardContent></Card>
          </Grid>
        )}
        {active==='inspect' && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)' }}><CardContent sx={{ p:3 }}>
              <Typography variant="h6">Inspect Remote</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}><TextField label="Host" value={host} onChange={e=>setHost(e.target.value)} fullWidth /></Grid>
                <Grid item xs={12} md={6}><TextField label="Port" type="number" value={port} onChange={e=>setPort(Number(e.target.value))} fullWidth /></Grid>
              </Grid>
              <Button sx={{ mt:1 }} variant="contained" onClick={inspect}>Fetch</Button>
              {inspectOut && inspectOut.certs && (
                <>
                  <Alert sx={{ mt:2 }} severity="info">TLS Version: {inspectOut.tls_version} | Cipher Suite: {inspectOut.cipher_suite}</Alert>
                  <TableContainer component={Paper} sx={{ mt:2, background:'rgba(255,255,255,0.06)' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>Subject</TableCell>
                          <TableCell>Issuer</TableCell>
                          <TableCell>Valid From</TableCell>
                          <TableCell>Valid To</TableCell>
                          <TableCell>Fingerprint(SHA256)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {inspectOut.certs.map((ci:any, idx:number)=> (
                          <TableRow key={idx}>
                            <TableCell>{idx===0 ? 'Leaf' : idx}</TableCell>
                            <TableCell>{ci.subject}</TableCell>
                            <TableCell>{ci.issuer}</TableCell>
                            <TableCell>{new Date(ci.not_before).toLocaleString()}</TableCell>
                            <TableCell>{new Date(ci.not_after).toLocaleString()}</TableCell>
                            <TableCell sx={{ fontFamily:'monospace' }}>{ci.fingerprint_sha256}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
              {inspectOut && !inspectOut.certs && (<Alert sx={{ mt:2 }} severity="error">Fetch failed</Alert>)}
            </CardContent></Card>
          </Grid>
        )}
        {active==='csr' && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)' }}><CardContent sx={{ p:3 }}>
              <Typography variant="h6">Generate CSR (Dev)</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}><TextField label="CN" value={csrSubject.cn} onChange={e=>setCsrSubject({...csrSubject, cn:e.target.value})} fullWidth /></Grid>
                <Grid item xs={12} md={6}><TextField label="O" value={csrSubject.o} onChange={e=>setCsrSubject({...csrSubject, o:e.target.value})} fullWidth /></Grid>
                <Grid item xs={12} md={6}><TextField label="OU" value={csrSubject.ou} onChange={e=>setCsrSubject({...csrSubject, ou:e.target.value})} fullWidth /></Grid>
                <Grid item xs={12} md={6}><TextField label="L" value={csrSubject.l} onChange={e=>setCsrSubject({...csrSubject, l:e.target.value})} fullWidth /></Grid>
                <Grid item xs={12} md={6}><TextField label="ST" value={csrSubject.st} onChange={e=>setCsrSubject({...csrSubject, st:e.target.value})} fullWidth /></Grid>
                <Grid item xs={12} md={6}><TextField label="C" value={csrSubject.c} onChange={e=>setCsrSubject({...csrSubject, c:e.target.value})} fullWidth /></Grid>
              </Grid>
              <TextField sx={{ mt:1 }} label="SAN DNS (comma/space separated)" value={csrSAN} onChange={e=>setCsrSAN(e.target.value)} fullWidth />
              <Grid container spacing={2} sx={{ mt:1 }}>
                <Grid item xs={12} md={4}><TextField label="Key Type (rsa/ec)" value={keyType} onChange={e=>setKeyType(e.target.value as any)} fullWidth /></Grid>
                <Grid item xs={12} md={4}><TextField label="RSA Bits" type="number" value={bits} onChange={e=>setBits(Number(e.target.value))} fullWidth /></Grid>
                <Grid item xs={12} md={4}><TextField label="EC Curve" value={curve} onChange={e=>setCurve(e.target.value)} fullWidth /></Grid>
              </Grid>
              <Button sx={{ mt:1 }} variant="contained" onClick={csrGenerate}>Generate CSR</Button>
              {csrOut.csr && (
                <Grid container spacing={2} sx={{ mt:2 }}>
                  <Grid item xs={12} md={6}><BigText label="CSR" value={csrOut.csr} readOnly downloadName={'request.csr'} /></Grid>
                  <Grid item xs={12} md={6}><BigText label="Private Key (PKCS#8)" value={csrOut.private_key} readOnly downloadName={'private.key'} /></Grid>
                </Grid>
              )}
            </CardContent></Card>
          </Grid>
        )}
        {active==='convert' && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)' }}><CardContent sx={{ p:3 }}>
              <Typography variant="h6">Convert (PEM↔DER)</Typography>
              <BigText label="Certificate PEM" value={pem} onChange={setPem} />
              <Button sx={{ mt:1, mr:1 }} variant="contained" onClick={toDer}>PEM → DER(Base64)</Button>
              <BigText label="DER(Base64)" value={derIn} onChange={setDerIn} />
              <Button sx={{ mt:1 }} variant="outlined" onClick={toPem}>DER(Base64) → PEM</Button>
              {convertOut && convertOut.der_base64 && <BigText label="DER(Base64) Output" value={convertOut.der_base64} readOnly downloadName={'certificate.der.b64'} />}
              {convertOut && convertOut.pem && <BigText label="PEM Output" value={convertOut.pem} readOnly downloadName={'certificate.pem'} />}
            </CardContent></Card>
          </Grid>
        )}
      </Grid>
    </Container>
  )
}