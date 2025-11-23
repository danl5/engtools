import { Container, Typography, Grid, TextField, Button, Alert, Card, CardContent, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { Link as LinkIcon, Code as CodeIcon, DataObject, SyncAlt, AccessTime } from '@mui/icons-material'
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
  const [urlText, setUrlText] = useState('')
  const [urlEncoded, setUrlEncoded] = useState('')
  const [uniText, setUniText] = useState('')
  const [uniEscaped, setUniEscaped] = useState('')
  const [jsonInput, setJsonInput] = useState('')
  const [jsonOutput, setJsonOutput] = useState('')
  const [yamlInput, setYamlInput] = useState('')
  const [yamlOutput, setYamlOutput] = useState('')
  const [tsInput, setTsInput] = useState('')
  const [isoInput, setIsoInput] = useState('')
  const [timeZone, setTimeZone] = useState('UTC')
  const [activeTool, setActiveTool] = useState<'base64' | 'url' | 'unicode' | 'json' | 'yamljson' | 'time'>('base64')
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
  const jsonPretty = () => {
    try { const obj = JSON.parse(jsonInput); setJsonOutput(JSON.stringify(obj, null, 2)); dispatch(setError('')); dispatch(openSnackbar({ message: 'Pretty printed', severity: 'success' })) } catch { dispatch(setError('Invalid JSON')) }
  }
  const jsonMinify = () => {
    try { const obj = JSON.parse(jsonInput); setJsonOutput(JSON.stringify(obj)); dispatch(setError('')); dispatch(openSnackbar({ message: 'Minified', severity: 'success' })) } catch { dispatch(setError('Invalid JSON')) }
  }
  const jsonValidate = () => {
    try { JSON.parse(jsonInput); dispatch(setError('')); dispatch(openSnackbar({ message: 'Valid JSON', severity: 'success' })) } catch { dispatch(setError('Invalid JSON')) }
  }
  const yamlToJson = () => {
    try {
      // js-yaml will be used here
      // @ts-ignore
      const yaml = require('js-yaml')
      const obj = yaml.load(yamlInput)
      setYamlOutput(JSON.stringify(obj, null, 2))
      dispatch(setError(''))
      dispatch(openSnackbar({ message: 'YAML → JSON done', severity: 'success' }))
    } catch { dispatch(setError('YAML parse failed')) }
  }
  const jsonToYaml = () => {
    try {
      // @ts-ignore
      const yaml = require('js-yaml')
      const obj = JSON.parse(yamlInput)
      setYamlOutput(yaml.dump(obj))
      dispatch(setError(''))
      dispatch(openSnackbar({ message: 'JSON → YAML done', severity: 'success' }))
    } catch { dispatch(setError('JSON parse failed')) }
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
          <MenuItem value="json">JSON Format/Minify/Validate</MenuItem>
          <MenuItem value="yamljson">YAML ↔ JSON</MenuItem>
          <MenuItem value="time">Unix Time ↔ ISO</MenuItem>
        </Select>
      </FormControl>
      <Grid container spacing={2}>
        {activeTool === 'base64' && (
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent>
              <TextField label="Text" value={text} onChange={e=>setText(e.target.value)} fullWidth multiline rows={5} required />
              <Button sx={{ mt: 1 }} variant="contained" onClick={encode}>Encode to Base64</Button>
            </CardContent>
          </Card>
        </Grid>
        )}
        {activeTool === 'base64' && (
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent>
              <TextField label="Base64" value={base64} onChange={e=>setBase64(e.target.value)} fullWidth multiline rows={5} required />
              <Button sx={{ mt: 1 }} variant="outlined" onClick={decode}>Decode to Text</Button>
            </CardContent>
          </Card>
        </Grid>
        )}
        {activeTool === 'url' && (
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent>
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
            <CardContent>
              <Typography variant="h6"><CodeIcon sx={{ mr:1, verticalAlign: 'middle' }} />Unicode Escape/Unescape</Typography>
              <TextField sx={{ mt:1 }} label="Text" value={uniText} onChange={e=>setUniText(e.target.value)} fullWidth multiline rows={3} />
              <Button sx={{ mt:1, mr:1 }} variant="contained" onClick={unicodeEscape}>Escape</Button>
              <TextField sx={{ mt:2 }} label="Escaped" value={uniEscaped} onChange={e=>setUniEscaped(e.target.value)} fullWidth multiline rows={3} />
              <Button sx={{ mt:1 }} variant="outlined" onClick={unicodeUnescape}>Unescape</Button>
            </CardContent>
          </Card>
        </Grid>
        )}
        {activeTool === 'json' && (
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent>
              <Typography variant="h6"><DataObject sx={{ mr:1, verticalAlign: 'middle' }} />JSON Format/Minify/Validate</Typography>
              <TextField sx={{ mt:1 }} label="JSON Input" value={jsonInput} onChange={e=>setJsonInput(e.target.value)} fullWidth multiline rows={6} />
              <Button sx={{ mt:1, mr:1 }} variant="contained" onClick={jsonPretty}>Pretty</Button>
              <Button sx={{ mt:1, mr:1 }} variant="outlined" onClick={jsonMinify}>Minify</Button>
              <Button sx={{ mt:1 }} variant="outlined" onClick={jsonValidate}>Validate</Button>
              <TextField sx={{ mt:2 }} label="Output" value={jsonOutput} fullWidth multiline rows={6} />
            </CardContent>
          </Card>
        </Grid>
        )}
        {activeTool === 'yamljson' && (
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent>
              <Typography variant="h6"><SyncAlt sx={{ mr:1, verticalAlign: 'middle' }} />YAML ↔ JSON</Typography>
              <TextField sx={{ mt:1 }} label="Input (YAML or JSON)" value={yamlInput} onChange={e=>setYamlInput(e.target.value)} fullWidth multiline rows={6} />
              <Button sx={{ mt:1, mr:1 }} variant="contained" onClick={yamlToJson}>YAML → JSON</Button>
              <Button sx={{ mt:1 }} variant="outlined" onClick={jsonToYaml}>JSON → YAML</Button>
              <TextField sx={{ mt:2 }} label="Output" value={yamlOutput} fullWidth multiline rows={6} />
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