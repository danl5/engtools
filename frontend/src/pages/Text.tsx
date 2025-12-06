import { Container, Typography, Grid, Card, CardContent, Alert, TextField, Button, Switch, FormControlLabel, Box, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { setError, openSnackbar } from '../store'
import BigText from '../components/BigText'
import CMerge from '../components/CMerge'
import { useState } from 'react'
import { trackEvent } from '../analytics'

export default function TextTools() {
  const dispatch = useDispatch()
  const error = useSelector((s: RootState) => s.ui.error)
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [preset, setPreset] = useState<null | 'newline_to_literal'|'literal_to_newline'|'tabs_to_spaces'|'spaces_to_tabs'|'crlf_to_lf'|'lf_to_crlf'|'collapse_whitespace'|'trim_trailing'|'remove_bom_zw'|'smart_quotes'|'html_escape'|'html_unescape'|'escape_json'|'unescape_json'|'escape_regex'|'unescape_regex'|'escape_shell_single'|'escape_shell_double'|'escape_sql'|'unescape_sql'>(null)
  const [pat, setPat] = useState('')
  const [rep, setRep] = useState('')
  const [flags, setFlags] = useState('g')
  const [useRegex, setUseRegex] = useState(true)
  const ending = (() => {
    const crlf = (input.match(/\r\n/g) || []).length
    const loneLf = (input.replace(/\r\n/g, '').match(/\n/g) || []).length
    const loneCr = (input.replace(/\r\n/g, '').match(/\r/g) || []).length
    if (crlf && !loneLf && !loneCr) return 'CRLF'
    if (loneLf && !crlf && !loneCr) return 'LF'
    if (crlf || loneLf || loneCr) return 'Mixed'
    return 'None'
  })()
  const [active, setActive] = useState<'replace'|'diff'>('replace')
  const [diffA, setDiffA] = useState('')
  const [diffB, setDiffB] = useState('')
  const [diffMode, setDiffMode] = useState<'line'|'word'>('line')
  const [diffIgnoreSpace, setDiffIgnoreSpace] = useState(true)
  const [diffIgnoreCase, setDiffIgnoreCase] = useState(false)
  const [diffRows, setDiffRows] = useState<any[]>([])
  const [unified, setUnified] = useState('')
  const [collapse, setCollapse] = useState(false)
  const lcs = (a: string[], b: string[]) => {
    const n = a.length, m = b.length
    const dp: number[][] = Array.from({length: n+1}, ()=>Array(m+1).fill(0))
    for (let i = n-1; i>=0; i--) {
      for (let j = m-1; j>=0; j--) {
        dp[i][j] = a[i] === b[j] ? dp[i+1][j+1] + 1 : Math.max(dp[i+1][j], dp[i][j+1])
      }
    }
    const ops: Array<{type:'eq'|'del'|'ins', val:string}> = []
    let i=0,j=0
    while (i<n && j<m) {
      if (a[i] === b[j]) { ops.push({type:'eq', val:a[i]}); i++; j++; }
      else if (dp[i+1][j] >= dp[i][j+1]) { ops.push({type:'del', val:a[i]}); i++ }
      else { ops.push({type:'ins', val:b[j]}); j++ }
    }
    while (i<n) { ops.push({type:'del', val:a[i++]}) }
    while (j<m) { ops.push({type:'ins', val:b[j++]}) }
    return ops
  }
  const normalizeSeq = (s: string) => {
    let t = s
    if (diffIgnoreCase) t = t.toLowerCase()
    if (diffMode==='line') {
      let lines = t.split('\n')
      if (diffIgnoreSpace) lines = lines.map(x=>x.replace(/\s+/g,' '))
      return {seq: lines, raw: s.split('\n')}
    } else {
      let words = t.split(/(\s+)/)
      if (diffIgnoreSpace) words = words.filter(w=>!/^\s+$/.test(w))
      return {seq: words, raw: diffIgnoreSpace ? s.split(/\s+/) : s.split(/(\s+)/)}
    }
  }
  const compareDiff = () => {
    const A = normalizeSeq(diffA), B = normalizeSeq(diffB)
    const ops = lcs(A.seq, B.seq)
    const rows: any[] = []
    let u: string[] = ['@@']
    for (const op of ops) {
      if (op.type==='eq') rows.push({type:'eq', left: A.raw.shift(), right: B.raw.shift()})
      else if (op.type==='del') { rows.push({type:'del', left: A.raw.shift(), right: ''}); u.push('-'+op.val) }
      else if (op.type==='ins') { rows.push({type:'ins', left: '', right: B.raw.shift()}); u.push('+'+op.val) }
    }
    const merged: any[] = []
    for (let i=0;i<rows.length;i++){
      const r = rows[i]
      if (r.type==='del' && i+1<rows.length && rows[i+1].type==='ins'){
        merged.push({type:'rep', left:r.left, right:rows[i+1].right}); i++
      } else merged.push(r)
    }
    setDiffRows(merged)
    setUnified(u.join('\n'))
    dispatch(openSnackbar({ message: 'Diff computed', severity: 'success' }))
    trackEvent('text_diff_compare', { mode: diffMode, ignoreSpace: diffIgnoreSpace, ignoreCase: diffIgnoreCase })
  }
  const apply = () => {
    try {
      let s = input
      const norm = (t: string) => t.replace(/^[\uFEFF]/, '').replace(/[\u200B-\u200D\uFEFF\u2060]/g, '')
      if (preset) {
        if (preset === 'newline_to_literal') s = s.replace(/\n/g, '\\n')
        else if (preset === 'literal_to_newline') s = s.replace(/\\n/g, '\n')
        else if (preset === 'tabs_to_spaces') s = s.replace(/\t/g, '    ')
        else if (preset === 'spaces_to_tabs') s = s.replace(/ {4}/g, '\t')
        else if (preset === 'crlf_to_lf') s = s.replace(/\r\n/g, '\n')
        else if (preset === 'lf_to_crlf') s = s.replace(/\n/g, '\r\n')
        else if (preset === 'collapse_whitespace') s = s.replace(/[ \t]+/g, ' ')
        else if (preset === 'trim_trailing') s = s.replace(/[ \t]+$/gm, '')
        else if (preset === 'remove_bom_zw') s = norm(s)
        else if (preset === 'smart_quotes') s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
        else if (preset === 'html_escape') s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#39;')
        else if (preset === 'html_unescape') s = s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
        else if (preset === 'escape_json') s = s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t').replace(/\x08/g, '\\b').replace(/\f/g, '\\f')
        else if (preset === 'unescape_json') s = s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\b/g, '\b').replace(/\\f/g, '\f').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
        else if (preset === 'escape_regex') s = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        else if (preset === 'unescape_regex') s = s.replace(/\\([.*+?^${}()|[\]\\])/g, '$1')
        else if (preset === 'escape_shell_single') s = "'" + s.replace(/'/g, "'\"'\"'") + "'"
        else if (preset === 'escape_shell_double') s = '"' + s.replace(/([$`"\\])/g, '\\$1') + '"'
        else if (preset === 'escape_sql') s = s.replace(/'/g, "''")
        else if (preset === 'unescape_sql') s = s.replace(/''/g, "'")
      } else {
        if (!pat) { dispatch(setError('Please enter pattern')); return }
        if (useRegex) {
          const f = Array.from(new Set((flags || '').split('').filter(x => 'gimsuy'.includes(x)))).join('')
          const rx = new RegExp(pat, f)
          s = s.replace(rx, rep)
        } else {
          const esc = pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const rx = new RegExp(esc, 'g')
          s = s.replace(rx, rep)
        }
      }
    setOutput(s)
    dispatch(setError(''))
    dispatch(openSnackbar({ message: 'Applied', severity: 'success' }))
    trackEvent('text_replace_apply', { preset: preset || 'custom', regex: useRegex })
  } catch { dispatch(setError('Apply failed')) }
  }
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Text Tools</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="text-tool">Select Tool</InputLabel>
        <Select labelId="text-tool" label="Select Tool" value={active} onChange={e=>setActive(e.target.value as any)}>
          <MenuItem value="replace">Replace</MenuItem>
          <MenuItem value="diff">Diff</MenuItem>
        </Select>
      </FormControl>
      <Grid container spacing={4}>
        {active==='replace' && (
        <Grid item xs={12} md={10}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)' }}><CardContent sx={{ p:3 }}>
            <Typography variant="h6">Replace Text</Typography>
            <Typography variant="body2" sx={{ mt:0.5, opacity:.8 }}>Newlines: {ending}</Typography>
            <Box sx={{ mt:1, display:'flex', flexWrap:'wrap', gap:1 }}>
              <Button size="small" variant={preset==='newline_to_literal'?'contained':'outlined'} onClick={()=>setPreset(preset==='newline_to_literal'?null:'newline_to_literal')}>Newlines → \n</Button>
              <Button size="small" variant={preset==='literal_to_newline'?'contained':'outlined'} onClick={()=>setPreset(preset==='literal_to_newline'?null:'literal_to_newline')}>\n → Newlines</Button>
              <Button size="small" variant={preset==='tabs_to_spaces'?'contained':'outlined'} onClick={()=>setPreset(preset==='tabs_to_spaces'?null:'tabs_to_spaces')}>Tabs → spaces</Button>
              <Button size="small" variant={preset==='spaces_to_tabs'?'contained':'outlined'} onClick={()=>setPreset(preset==='spaces_to_tabs'?null:'spaces_to_tabs')}>spaces → Tabs</Button>
              <Button size="small" variant={preset==='crlf_to_lf'?'contained':'outlined'} disabled={ending!=='CRLF' && ending!=='Mixed'} onClick={()=>setPreset(preset==='crlf_to_lf'?null:'crlf_to_lf')}>CRLF → LF</Button>
              <Button size="small" variant={preset==='lf_to_crlf'?'contained':'outlined'} disabled={ending==='None'} onClick={()=>setPreset(preset==='lf_to_crlf'?null:'lf_to_crlf')}>LF → CRLF</Button>
              <Button size="small" variant={preset==='collapse_whitespace'?'contained':'outlined'} onClick={()=>setPreset(preset==='collapse_whitespace'?null:'collapse_whitespace')}>Collapse whitespace</Button>
              <Button size="small" variant={preset==='trim_trailing'?'contained':'outlined'} onClick={()=>setPreset(preset==='trim_trailing'?null:'trim_trailing')}>Trim trailing</Button>
              <Button size="small" variant={preset==='remove_bom_zw'?'contained':'outlined'} onClick={()=>setPreset(preset==='remove_bom_zw'?null:'remove_bom_zw')}>Remove BOM/ZW</Button>
              <Button size="small" variant={preset==='smart_quotes'?'contained':'outlined'} onClick={()=>setPreset(preset==='smart_quotes'?null:'smart_quotes')}>Smart quotes → ASCII</Button>
              <Button size="small" variant={preset==='html_escape'?'contained':'outlined'} onClick={()=>setPreset(preset==='html_escape'?null:'html_escape')}>HTML escape</Button>
              <Button size="small" variant={preset==='html_unescape'?'contained':'outlined'} onClick={()=>setPreset(preset==='html_unescape'?null:'html_unescape')}>HTML unescape</Button>
              <Button size="small" variant={preset==='escape_json'?'contained':'outlined'} onClick={()=>setPreset(preset==='escape_json'?null:'escape_json')}>JSON escape</Button>
              <Button size="small" variant={preset==='unescape_json'?'contained':'outlined'} onClick={()=>setPreset(preset==='unescape_json'?null:'unescape_json')}>JSON unescape</Button>
              <Button size="small" variant={preset==='escape_regex'?'contained':'outlined'} onClick={()=>setPreset(preset==='escape_regex'?null:'escape_regex')}>Regex escape</Button>
              <Button size="small" variant={preset==='unescape_regex'?'contained':'outlined'} onClick={()=>setPreset(preset==='unescape_regex'?null:'unescape_regex')}>Regex unescape</Button>
              <Button size="small" variant={preset==='escape_shell_single'?'contained':'outlined'} onClick={()=>setPreset(preset==='escape_shell_single'?null:'escape_shell_single')}>Shell single-quote</Button>
              <Button size="small" variant={preset==='escape_shell_double'?'contained':'outlined'} onClick={()=>setPreset(preset==='escape_shell_double'?null:'escape_shell_double')}>Shell double-quote</Button>
              <Button size="small" variant={preset==='escape_sql'?'contained':'outlined'} onClick={()=>setPreset(preset==='escape_sql'?null:'escape_sql')}>SQL escape</Button>
              <Button size="small" variant={preset==='unescape_sql'?'contained':'outlined'} onClick={()=>setPreset(preset==='unescape_sql'?null:'unescape_sql')}>SQL unescape</Button>
              <Button size="small" variant={preset===null?'contained':'outlined'} onClick={()=>setPreset(null)}>Custom</Button>
            </Box>
            <BigText label="Input" value={input} onChange={setInput} onExecute={apply} />
            {preset===null && (
              <Grid container spacing={2} sx={{ mt:1 }}>
                <Grid item xs={12} md={5}><TextField label="Pattern" value={pat} onChange={e=>setPat(e.target.value)} fullWidth /></Grid>
                <Grid item xs={12} md={5}><TextField label="Replacement" value={rep} onChange={e=>setRep(e.target.value)} fullWidth /></Grid>
                <Grid item xs={12} md={2}><TextField label="Flags" value={flags} onChange={e=>setFlags(e.target.value)} fullWidth /></Grid>
                <Grid item xs={12}><FormControlLabel control={<Switch checked={useRegex} onChange={e=>setUseRegex(e.target.checked)} />} label="Use Regex" /></Grid>
              </Grid>
            )}
            <Button sx={{ mt:1 }} variant="contained" onClick={apply}>Apply</Button>
            <BigText label="Output" value={output} readOnly downloadName={'output.txt'} />
          </CardContent></Card>
        </Grid>
        )}
        {active==='diff' && (
        <Grid item xs={12} md={12}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)' }}><CardContent sx={{ p:3 }}>
            <Typography variant="h6">Diff Text</Typography>
            <Grid container spacing={2} sx={{ mt:1 }}>
              <Grid item xs={12} md={6}><BigText label="Text A" value={diffA} onChange={setDiffA} /></Grid>
              <Grid item xs={12} md={6}><BigText label="Text B" value={diffB} onChange={setDiffB} /></Grid>
            </Grid>
            <Box sx={{ mt:1, display:'flex', gap:2 }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <Box sx={{ width:16, height:16, bgcolor:'rgba(34,197,94,0.7)', borderRadius: '3px' }} />
                <Typography variant="body2">Added</Typography>
              </Box>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <Box sx={{ width:16, height:16, bgcolor:'rgba(239,68,68,0.7)', borderRadius: '3px' }} />
                <Typography variant="body2">Removed</Typography>
              </Box>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <Box sx={{ width:16, height:16, bgcolor:'rgba(250,204,21,0.7)', borderRadius: '3px' }} />
                <Typography variant="body2">Changed</Typography>
              </Box>
            </Box>
            <Grid container spacing={2} sx={{ mt:1 }}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="diff-mode">Mode</InputLabel>
                  <Select labelId="diff-mode" label="Mode" value={diffMode} onChange={e=>setDiffMode(e.target.value as any)}>
                    <MenuItem value="line">Line</MenuItem>
                    <MenuItem value="word">Word</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={diffIgnoreSpace} onChange={e=>setDiffIgnoreSpace(e.target.checked)} />} label="Ignore whitespace" /></Grid>
              <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={diffIgnoreCase} onChange={e=>setDiffIgnoreCase(e.target.checked)} />} label="Ignore case" /></Grid>
              <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={collapse} onChange={e=>setCollapse(e.target.checked)} />} label="only show diff" /></Grid>
              <Grid item xs={12} md={3}><Button variant="contained" onClick={compareDiff}>Compare</Button></Grid>
            </Grid>
            <Box sx={{ mt:2 }}>
              <CMerge left={diffA} right={diffB} collapse={collapse} />
            </Box>
          </CardContent></Card>
        </Grid>
        )}
      </Grid>
    </Container>
  )
}
