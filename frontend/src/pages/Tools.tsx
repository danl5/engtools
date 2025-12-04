import { Container, Typography, Grid, TextField, Button, Alert, Card, CardContent, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper, Box } from '@mui/material'
import { Link as LinkIcon, Code as CodeIcon, AccessTime, FindInPage } from '@mui/icons-material'
import BigText from '../components/BigText'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import api from '../api'
import { setLoading, setError, openSnackbar } from '../store'
import { RootState } from '../store'

export default function Tools() {
  const dispatch = useDispatch()
  const error = useSelector((s: RootState) => s.ui.error)
  const loading = useSelector((s: RootState) => s.ui.loading)
  const [text, setText] = useState('')
  const [base64, setBase64] = useState('')
  const [urlText, setUrlText] = useState('')
  const [urlEncoded, setUrlEncoded] = useState('')
  const [uniText, setUniText] = useState('')
  const [uniEscaped, setUniEscaped] = useState('')
  const [jsonInput, setJsonInput] = useState('')
  const [jsonOutput, setJsonOutput] = useState('')
  const [tsInput, setTsInput] = useState('')
  const [isoInput, setIsoInput] = useState('')
  const [timeZone, setTimeZone] = useState('UTC')
  const [activeTool, setActiveTool] = useState<'base64' | 'url' | 'unicode' | 'time' | 'regex'>('base64')
  const [rePattern, setRePattern] = useState('')
  const [reFlags, setReFlags] = useState('g')
  const [reInput, setReInput] = useState('')
  const [reReplace, setReReplace] = useState('')
  const [reOutput, setReOutput] = useState('')
  const [reMatches, setReMatches] = useState<any[]>([])
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
      const b64 = base64.replace(/\s+/g, '')
      const { data } = await api.post('/v1/tools/base64/decode', { value: b64 })
      setText(data.text)
      dispatch(setError(''))
      dispatch(openSnackbar({ message: 'Decoded successfully', severity: 'success' }))
    } catch { dispatch(setError('Decoding failed')) } finally { dispatch(setLoading(false)) }
  }
  const urlDoEncode = () => {
    if (!urlText) { dispatch(setError('Please enter URL/text')); return }
    try { setUrlEncoded(encodeURIComponent(urlText)); dispatch(setError('')); dispatch(openSnackbar({ message: 'URL encoded', severity: 'success' })) } catch { dispatch(setError('URL encode failed')) }
  }
  const urlDoDecode = () => {
    if (!urlEncoded) { dispatch(setError('Please enter encoded text')); return }
    try { setUrlText(decodeURIComponent(urlEncoded)); dispatch(setError('')); dispatch(openSnackbar({ message: 'URL decoded', severity: 'success' })) } catch { dispatch(setError('URL decode failed')) }
  }
  const unicodeEscape = () => {
    if (!uniText) { dispatch(setError('Please enter text')); return }
    const out: string[] = []
    for (const ch of uniText) {
      const cp = ch.codePointAt(0) as number
      if (cp <= 0xFFFF) {
        out.push('\\u' + cp.toString(16).toUpperCase().padStart(4, '0'))
      } else {
        const H = ((cp - 0x10000) >> 10) + 0xD800
        const L = ((cp - 0x10000) & 0x3FF) + 0xDC00
        out.push('\\u' + H.toString(16).toUpperCase().padStart(4, '0'))
        out.push('\\u' + L.toString(16).toUpperCase().padStart(4, '0'))
      }
    }
    setUniEscaped(out.join(''))
    dispatch(setError(''))
    dispatch(openSnackbar({ message: 'Escaped', severity: 'success' }))
  }
  const unicodeUnescape = () => {
    if (!uniEscaped) { dispatch(setError('Please enter escaped text')); return }
    try {
      const s = uniEscaped.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
      setUniText(s)
      dispatch(setError(''))
      dispatch(openSnackbar({ message: 'Unescaped', severity: 'success' }))
    } catch { dispatch(setError('Unescape failed')) }
  }
  const regexTest = () => {
    if (!rePattern) { dispatch(setError('Please enter pattern')); return }
    try {
      const flags = Array.from(new Set((reFlags || '').split('').filter(f => 'gimsuy'.includes(f)))).join('')
      const rx = new RegExp(rePattern, flags)
      const matches: any[] = []
      if (flags.includes('g')) {
        let m
        while ((m = rx.exec(reInput)) !== null) {
          matches.push({ index: m.index, match: m[0], groups: m.groups || {}, captures: m.slice(1) })
          if (m[0] === '') { rx.lastIndex++ }
        }
      } else {
        const m = rx.exec(reInput)
        if (m) matches.push({ index: m.index, match: m[0], groups: m.groups || {}, captures: m.slice(1) })
      }
      setReMatches(matches)
      setReOutput(reReplace ? reInput.replace(rx, reReplace) : '')
      dispatch(setError(''))
      dispatch(openSnackbar({ message: 'Regex tested', severity: 'success' }))
    } catch { dispatch(setError('Invalid pattern/flags')) }
  }
  const jsonPretty = () => {
    try { const obj = JSON.parse(jsonInput); setJsonOutput(JSON.stringify(obj, null, 2)); dispatch(setError('')); dispatch(openSnackbar({ message: 'Pretty printed', severity: 'success' })) } catch { dispatch(setError('Invalid JSON')) }
  }
  const jsonMinify = () => {
    try { const obj = JSON.parse(jsonInput); setJsonOutput(JSON.stringify(obj)); dispatch(setError('')); dispatch(openSnackbar({ message: 'Minified', severity: 'success' })) } catch { dispatch(setError('Invalid JSON')) }
  }
  const jsonValidate = () => {
    try { JSON.parse(jsonInput); dispatch(setError('')); dispatch(openSnackbar({ message: 'Valid JSON', severity: 'success' })) } catch { dispatch(setError('Invalid JSON')) }
  }
  const tsToIso = () => {
    if (!tsInput) { dispatch(setError('Please enter timestamp')); return }
    const n = Number(tsInput)
    if (Number.isNaN(n)) { dispatch(setError('Invalid timestamp')); return }
    const ms = tsInput.length > 10 ? n : n * 1000
    const d = new Date(ms)
    setIsoInput(d.toISOString())
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setJsonOutput(fmt.format(d))
    dispatch(setError(''))
    dispatch(openSnackbar({ message: 'Converted to ISO/time', severity: 'success' }))
  }
  const isoToTs = () => {
    if (!isoInput) { dispatch(setError('Please enter ISO time')); return }
    const d = new Date(isoInput)
    if (Number.isNaN(d.getTime())) { dispatch(setError('Invalid ISO time')); return }
    const seconds = Math.floor(d.getTime() / 1000)
    setTsInput(String(seconds))
    dispatch(setError(''))
    dispatch(openSnackbar({ message: 'Converted to timestamp', severity: 'success' }))
  }
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Tools: Encoding and Conversion</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="tool-selector">Select Tool</InputLabel>
        <Select labelId="tool-selector" label="Select Tool" value={activeTool} onChange={e=>setActiveTool(e.target.value as any)}>
          <MenuItem value="base64">Base64</MenuItem>
          <MenuItem value="url">URL Encode/Decode</MenuItem>
          <MenuItem value="unicode">Unicode Escape/Unescape</MenuItem>
          <MenuItem value="regex">Regex Tester</MenuItem>
          <MenuItem value="time">Unix Time ↔ ISO</MenuItem>
        
        </Select>
      </FormControl>
      <Grid container spacing={4}>
        {activeTool === 'base64' && (
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ p: 3 }}>
              <BigText label="Text" value={text} onChange={v=>{ setText(v); dispatch(setError('')) }} onExecute={encode} />
              <Button sx={{ mt: 1 }} variant="contained" disabled={loading} onClick={encode}>Encode to Base64</Button>
            </CardContent>
          </Card>
        </Grid>
        )}
        {activeTool === 'regex' && (
        <Grid item xs={12} md={12}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ p:3 }}>
              <Typography variant="h6"><FindInPage sx={{ mr:1, verticalAlign:'middle' }} />Regex Tester</Typography>
              <Grid container spacing={2} sx={{ mt:1 }}>
                <Grid item xs={12} md={6}><TextField label="Pattern" value={rePattern} onChange={e=>setRePattern(e.target.value)} fullWidth /></Grid>
                <Grid item xs={12} md={6}><TextField label="Flags (g i m s u y)" value={reFlags} onChange={e=>setReFlags(e.target.value)} fullWidth /></Grid>
              </Grid>
              <BigText label="Input" value={reInput} onChange={v=>{ setReInput(v); dispatch(setError('')) }} onExecute={regexTest} />
              <Grid container spacing={2} sx={{ mt:1 }}>
                <Grid item><Button variant="contained" disabled={loading} onClick={regexTest}>Test</Button></Grid>
                <Grid item xs={12} md={6}><TextField label="Replacement" value={reReplace} onChange={e=>setReReplace(e.target.value)} fullWidth /></Grid>
              </Grid>
              {reOutput && <BigText label="Replaced Output" value={reOutput} readOnly downloadName={'replaced.txt'} />}
              {reMatches && reMatches.length>0 && (
                <TableContainer component={Paper} sx={{ mt:2, background:'rgba(255,255,255,0.06)' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Index</TableCell>
                        <TableCell>Match</TableCell>
                        <TableCell>Captures</TableCell>
                        <TableCell>Groups</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reMatches.map((m:any, idx:number)=> (
                        <TableRow key={idx}>
                          <TableCell>{idx}</TableCell>
                          <TableCell>{m.index}</TableCell>
                          <TableCell sx={{ fontFamily:'monospace' }}>{m.match}</TableCell>
                          <TableCell sx={{ fontFamily:'monospace' }}>{Array.isArray(m.captures)&&m.captures.length? m.captures.join(' | ') : '-'}</TableCell>
                          <TableCell sx={{ fontFamily:'monospace' }}>{m.groups && Object.keys(m.groups).length ? Object.entries(m.groups).map(([k,v])=>`${k}=${v}`).join(', ') : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <TableContainer component={Paper} sx={{ mt:2, background:'rgba(255,255,255,0.06)' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Topic</TableCell>
                      <TableCell>Summary</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Flags</TableCell>
                      <TableCell sx={{ fontFamily:'monospace' }}>{"g: global | i: ignore case | m: multiline (^/$) | s: dotAll | u: Unicode | y: sticky"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Classes</TableCell>
                      <TableCell sx={{ fontFamily:'monospace' }}>{"\\d \\w \\s \\D \\W \\S . [a-z] [^...] \\b \\B"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Quantifiers</TableCell>
                      <TableCell sx={{ fontFamily:'monospace' }}>{"* + ? {n} {n,} {n,m}  (lazy: .*?)"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Anchors</TableCell>
                      <TableCell sx={{ fontFamily:'monospace' }}>{"^ start | $ end | \\b word-boundary | \\B non-boundary"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Groups</TableCell>
                      <TableCell sx={{ fontFamily:'monospace' }}>{"(...) capture | (?:...) non-capture | backref \\1 \\2 | named (?<name>...) | replacement $<name>"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Lookaround</TableCell>
                      <TableCell sx={{ fontFamily:'monospace' }}>{"(?=...) | (?!...) | (?<=...) | (?<!...)"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Unicode</TableCell>
                      <TableCell sx={{ fontFamily:'monospace' }}>{"flag u for \\p{Letter}, \\p{Script=Han}; escapes: \\xNN, \\uNNNN"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Replacement</TableCell>
                      <TableCell sx={{ fontFamily:'monospace' }}>{"String.replace: $1 $2 ... and $<name> | function replacer supported"}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        )}
        {activeTool === 'base64' && (
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ p: 3 }}>
              <BigText label="Base64" value={base64} onChange={v=>{ setBase64(v); dispatch(setError('')) }} onExecute={decode} />
              <Button sx={{ mt: 1 }} variant="outlined" disabled={loading} onClick={decode}>Decode to Text</Button>
            </CardContent>
          </Card>
        </Grid>
        )}
        {activeTool === 'url' && (
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6"><LinkIcon sx={{ mr:1, verticalAlign: 'middle' }} />URL Encode/Decode</Typography>
              <TextField sx={{ mt:1 }} label="Text/URL" value={urlText} onChange={e=>setUrlText(e.target.value)} fullWidth multiline rows={3} />
              <Button sx={{ mt:1, mr:1 }} variant="contained" onClick={urlDoEncode}>Encode</Button>
              <TextField sx={{ mt:2 }} label="Encoded" value={urlEncoded} onChange={e=>setUrlEncoded(e.target.value)} fullWidth multiline rows={3} />
              <Button sx={{ mt:1 }} variant="outlined" onClick={urlDoDecode}>Decode</Button>
            </CardContent>
          </Card>
        </Grid>
        )}
        {activeTool === 'unicode' && (
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6"><CodeIcon sx={{ mr:1, verticalAlign: 'middle' }} />Unicode Escape/Unescape</Typography>
              <TextField sx={{ mt:1 }} label="Text" value={uniText} onChange={e=>setUniText(e.target.value)} fullWidth multiline rows={3} />
              <Button sx={{ mt:1, mr:1 }} variant="contained" onClick={unicodeEscape}>Escape</Button>
              <TextField sx={{ mt:2 }} label="Escaped" value={uniEscaped} onChange={e=>setUniEscaped(e.target.value)} fullWidth multiline rows={3} />
              <Button sx={{ mt:1 }} variant="outlined" onClick={unicodeUnescape}>Unescape</Button>
            </CardContent>
          </Card>
        </Grid>
        )}
        {activeTool === 'time' && (
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent>
              <Typography variant="h6"><AccessTime sx={{ mr:1, verticalAlign: 'middle' }} />Unix Time ↔ ISO</Typography>
              <FormControl fullWidth sx={{ mt:1 }}>
                <InputLabel id="tz">Time Zone</InputLabel>
                <Select labelId="tz" label="Time Zone" value={timeZone} onChange={e=>setTimeZone(e.target.value)}>
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="Asia/Shanghai">Asia/Shanghai</MenuItem>
                  <MenuItem value="America/Los_Angeles">America/Los_Angeles</MenuItem>
                  <MenuItem value="Europe/London">Europe/London</MenuItem>
                </Select>
              </FormControl>
              <TextField sx={{ mt:1 }} label="Timestamp (sec or ms)" value={tsInput} onChange={e=>setTsInput(e.target.value)} fullWidth />
              <Button sx={{ mt:1, mr:1 }} variant="contained" onClick={tsToIso}>To ISO/Human</Button>
              <TextField sx={{ mt:2 }} label="ISO" value={isoInput} onChange={e=>setIsoInput(e.target.value)} fullWidth />
              <Button sx={{ mt:1 }} variant="outlined" onClick={isoToTs}>To Timestamp</Button>
            </CardContent>
          </Card>
        </Grid>
        )}
        
      </Grid>
    </Container>
  )
}