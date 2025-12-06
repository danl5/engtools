import { Container, Typography, Grid, Card, CardContent, Button, Alert, TextField, FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material'
import BigText from '../components/BigText'
import JsonViewer from '../components/JsonViewer'
// @ts-ignore
import * as yaml from 'js-yaml'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { setError, openSnackbar } from '../store'
import { useState, useRef } from 'react'
import { trackEvent } from '../analytics'

export default function Json() {
  const dispatch = useDispatch()
  const error = useSelector((s: RootState) => s.ui.error)
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [inputB, setInputB] = useState('')
  const [indent, setIndent] = useState(2)
  const [path, setPath] = useState('')
  const [tree, setTree] = useState<any | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const normalize = (s: string) => s.replace(/^\uFEFF/, '').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").trim()
  const stripJsonComments = (s: string) => {
    let out = ''
    let i = 0
    let inStr = false
    let esc = false
    let inLine = false
    let inBlock = false
    while (i < s.length) {
      const ch = s[i]
      const next = i + 1 < s.length ? s[i + 1] : ''
      if (inLine) { if (ch === '\n') { inLine = false; out += ch } i++; continue }
      if (inBlock) { if (ch === '*' && next === '/') { inBlock = false; i += 2; continue } i++; continue }
      if (!inStr && ch === '/' && next === '/') { inLine = true; i += 2; continue }
      if (!inStr && ch === '/' && next === '*') { inBlock = true; i += 2; continue }
      out += ch
      if (inStr) { esc = ch === '\\' ? !esc : false; if (!esc && ch === '"') inStr = false }
      else { if (ch === '"') { inStr = true; esc = false } }
      i++
    }
    return out
  }
  const removeTrailingCommas = (s: string) => s.replace(/,(?=\s*[}\]])/g, '')
  const parseSafe = (s: string) => {
    const a = normalize(s)
    try { return JSON.parse(a) } catch {}
    const b = stripJsonComments(a)
    try { return JSON.parse(b) } catch {}
    const c = removeTrailingCommas(b)
    return JSON.parse(c)
  }
  const sortKeys = (v: any): any => {
    if (Array.isArray(v)) return v.map(sortKeys)
    if (v && typeof v === 'object') {
      const keys = Object.keys(v).sort((x, y) => x.localeCompare(y))
      const o: any = {}
      for (const k of keys) o[k] = sortKeys(v[k])
      return o
    }
    return v
  }
  const getByPath = (v: any, p: string) => {
    if (!p) return v
    const parts = p.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)
    let cur = v
    for (const seg of parts) { if (cur == null) return undefined; cur = cur[seg as any] }
    return cur
  }
  const findErrorPos = (s: string) => {
    let i = 0
    const len = s.length
    const stack: Array<'object' | 'array'> = []
    let state: 'value' | 'key_or_end' | 'colon' | 'value_or_end' | 'after_value' = 'value'
    const skipWS = () => { while (i < len && /\s/.test(s[i])) i++ }
    const readString = () => {
      i++
      let esc = false
      while (i < len) {
        const ch = s[i]
        if (esc) { esc = false; i++; continue }
        if (ch === '\\') { esc = true; i++; continue }
        if (ch === '"') { i++; return true }
        if (ch === '\n' || ch === '\r') return false
        i++
      }
      return false
    }
    const readNumber = () => {
      const start = i
      if (s[i] === '-') i++
      if (i >= len) return false
      if (s[i] === '0') { i++ } else if (/[1-9]/.test(s[i])) { while (i < len && /[0-9]/.test(s[i])) i++ } else return false
      if (s[i] === '.') { i++; if (i >= len || !/[0-9]/.test(s[i])) return false; while (i < len && /[0-9]/.test(s[i])) i++ }
      if (s[i] === 'e' || s[i] === 'E') { i++; if (s[i] === '+' || s[i] === '-') i++; if (i >= len || !/[0-9]/.test(s[i])) return false; while (i < len && /[0-9]/.test(s[i])) i++ }
      return i > start
    }
    const readLiteral = () => {
      if (s.startsWith('true', i)) { i += 4; return true }
      if (s.startsWith('false', i)) { i += 5; return true }
      if (s.startsWith('null', i)) { i += 4; return true }
      return false
    }
    while (true) {
      skipWS()
      if (state === 'value') {
        if (i >= len) return -1
        const ch = s[i]
        if (ch === '"') { if (!readString()) return i; state = 'after_value'; continue }
        if (ch === '{') { stack.push('object'); i++; state = 'key_or_end'; continue }
        if (ch === '[') { stack.push('array'); i++; state = 'value_or_end'; continue }
        if (ch === '-' || /[0-9]/.test(ch)) { if (!readNumber()) return i; state = 'after_value'; continue }
        if (readLiteral()) { state = 'after_value'; continue }
        return i
      } else if (state === 'key_or_end') {
        skipWS()
        if (i >= len) return -1
        const ch = s[i]
        if (ch === '}') { stack.pop(); i++; state = 'after_value'; continue }
        if (ch === '"') { if (!readString()) return i; state = 'colon'; continue }
        return i
      } else if (state === 'colon') {
        skipWS(); if (i >= len) return -1; if (s[i] !== ':') return i; i++; state = 'value'; continue
      } else if (state === 'value_or_end') {
        skipWS(); if (i >= len) return -1; if (s[i] === ']') { stack.pop(); i++; state = 'after_value'; continue } state = 'value'; continue
      } else if (state === 'after_value') {
        skipWS()
        if (stack.length === 0) { return i < len ? i : -1 }
        const top = stack[stack.length - 1]
        if (top === 'array') { if (s[i] === ',') { i++; state = 'value'; continue } if (s[i] === ']') { stack.pop(); i++; state = 'after_value'; continue } return i }
        if (top === 'object') { if (s[i] === ',') { i++; state = 'key_or_end'; continue } if (s[i] === '}') { stack.pop(); i++; state = 'after_value'; continue } return i }
      }
    }
  }
  const doPretty = () => {
    try { const obj = parseSafe(input); setOutput(JSON.stringify(obj, null, indent)); setTree(null); dispatch(setError('')); dispatch(openSnackbar({ message: 'Pretty done', severity: 'success' })); trackEvent('json_pretty', { indent }) } catch (e: any) { dispatch(setError('Invalid JSON')) }
  }
  const doMinify = () => {
    try { const obj = parseSafe(input); setOutput(JSON.stringify(obj)); setTree(null); dispatch(setError('')); dispatch(openSnackbar({ message: 'Minify done', severity: 'success' })); trackEvent('json_minify') } catch { dispatch(setError('Invalid JSON')) }
  }
  const doValidate = () => {
    const s = normalize(input)
    try { JSON.parse(s); setTree(null); dispatch(setError('')); dispatch(openSnackbar({ message: 'Valid JSON', severity: 'success' })); trackEvent('json_validate') }
    catch (e: any) {
      const msg = String(e?.message || '')
      let pos = -1
      const m = msg.match(/position\s*(\d+)/i)
      if (m) pos = Number(m[1])
      if (pos < 0) pos = findErrorPos(s)
      if (pos >= 0) {
        let line = 1, col = 1
        for (let i = 0; i < pos && i < s.length; i++) { if (s[i] === '\n') { line++; col = 1 } else { col++ } }
        inputRef.current && inputRef.current.setSelectionRange(pos, pos)
        inputRef.current && inputRef.current.focus()
        dispatch(setError(`Invalid JSON at line ${line}, column ${col}`))
      } else {
        dispatch(setError('Invalid JSON'))
      }
    }
  }
  const doSort = () => {
    try { const obj = parseSafe(input); const s = sortKeys(obj); setOutput(JSON.stringify(s, null, indent)); setTree(null); dispatch(setError('')); dispatch(openSnackbar({ message: 'Sort keys done', severity: 'success' })); trackEvent('json_sort_keys') } catch { dispatch(setError('Invalid JSON')) }
  }
  const doExtract = () => {
    try { const obj = parseSafe(input); const v = getByPath(obj, path); setOutput(JSON.stringify(v, null, indent)); setTree(null); dispatch(setError('')); dispatch(openSnackbar({ message: 'Extracted', severity: 'success' })); trackEvent('json_extract', { path }) } catch { dispatch(setError('Invalid JSON or path')) }
  }
  const toYaml = () => {
    try { const obj = parseSafe(input); setOutput(yaml.dump(obj)); setTree(null); dispatch(setError('')); dispatch(openSnackbar({ message: 'JSON → YAML done', severity: 'success' })); trackEvent('json_to_yaml') } catch { dispatch(setError('Invalid JSON')) }
  }
  const fromYaml = () => {
    try { const obj = yaml.load(normalize(input)) as any; setOutput(JSON.stringify(obj, null, indent)); setTree(null); dispatch(setError('')); dispatch(openSnackbar({ message: 'YAML → JSON done', severity: 'success' })); trackEvent('json_from_yaml') } catch (e: any) { dispatch(setError('YAML parse failed')) }
  }
  const compare = () => {
    try {
      const a = parseSafe(input)
      const b = parseSafe(inputB)
      const diffs: string[] = []
      const walk = (pa: any, pb: any, base: string) => {
        if (Array.isArray(pa) && Array.isArray(pb)) {
          if (pa.length !== pb.length) diffs.push(`${base}: length ${pa.length} vs ${pb.length}`)
          const n = Math.min(pa.length, pb.length)
          for (let i = 0; i < n; i++) walk(pa[i], pb[i], `${base}[${i}]`)
          return
        }
        if (pa && typeof pa === 'object' && pb && typeof pb === 'object') {
          const keys = Array.from(new Set([...Object.keys(pa), ...Object.keys(pb)])).sort((x, y) => x.localeCompare(y))
          for (const k of keys) {
            const va = pa[k]
            const vb = pb[k]
            if (!(k in pa)) diffs.push(`${base}.${k}: missing in A`)
            else if (!(k in pb)) diffs.push(`${base}.${k}: missing in B`)
            else if (typeof va !== typeof vb) diffs.push(`${base}.${k}: type ${typeof va} vs ${typeof vb}`)
            else if (va !== vb && (typeof va !== 'object')) diffs.push(`${base}.${k}: value differs`)
            else walk(va, vb, `${base}.${k}`)
          }
          return
        }
        if (pa !== pb) diffs.push(`${base}: value differs`)
      }
      walk(a, b, '$')
      setOutput(diffs.length ? diffs.join('\n') : 'Equal')
      setTree(null)
      dispatch(setError(''))
      dispatch(openSnackbar({ message: 'Compare done', severity: 'success' }))
      trackEvent('json_compare')
    } catch { dispatch(setError('Invalid JSON inputs')) }
  }
  const showTree = () => {
    try { const obj = parseSafe(input); setTree(obj); dispatch(setError('')); dispatch(openSnackbar({ message: 'Tree view updated', severity: 'success' })); trackEvent('json_show_tree') } catch { dispatch(setError('Invalid JSON')) }
  }
  const hideTree = () => { setTree(null) }
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>JSON Tools</Typography>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel id="indent">Indent</InputLabel>
            <Select labelId="indent" label="Indent" value={indent} onChange={e=>setIndent(Number(e.target.value))}>
              <MenuItem value={2}>2</MenuItem>
              <MenuItem value={4}>4</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)' }}><CardContent sx={{ p:3 }}>
            <BigText label="JSON/YAML Input" value={input} onChange={setInput} externalRef={inputRef} showLineNumbers />
            {error && (<Alert severity="error" sx={{ mt:1 }}>{error}</Alert>)}
            <Grid container spacing={1} sx={{ mt:1 }}>
              <Grid item><Button variant="contained" onClick={doPretty}>Pretty</Button></Grid>
              <Grid item><Button variant="outlined" onClick={doMinify}>Minify</Button></Grid>
              <Grid item><Button variant="outlined" onClick={doValidate}>Validate</Button></Grid>
              <Grid item><Button variant="outlined" onClick={doSort}>Sort Keys</Button></Grid>
              <Grid item><Button variant="outlined" onClick={toYaml}>JSON → YAML</Button></Grid>
              <Grid item><Button variant="outlined" onClick={fromYaml}>YAML → JSON</Button></Grid>
              <Grid item><Button variant="outlined" onClick={showTree}>Show Tree</Button></Grid>
              {tree && <Grid item><Button variant="outlined" onClick={hideTree}>Hide Tree</Button></Grid>}
            </Grid>
            <TextField sx={{ mt:2 }} label="Path (dot, e.g. a.b[0].c)" value={path} onChange={e=>setPath(e.target.value)} fullWidth />
            <Button sx={{ mt:1 }} variant="contained" onClick={doExtract}>Extract</Button>
            {!tree && (
              <BigText label="Output" value={output} readOnly downloadName={'output.json'} />
            )}
            {tree && (
              <Box sx={{ mt:2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Tree View</Typography>
                <JsonViewer value={tree} />
              </Box>
            )}
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)' }}><CardContent sx={{ p:3 }}>
            <BigText label="JSON B (for Compare)" value={inputB} onChange={setInputB} />
            <Button sx={{ mt:1 }} variant="contained" onClick={compare}>Compare A vs B</Button>
          </CardContent></Card>
        </Grid>
      </Grid>
    </Container>
  )
}
