import { Box, Typography, IconButton, Dialog, DialogContent, Stack, Tooltip } from '@mui/material'
import { ContentCopy, OpenInFull, UploadFile, WrapText, Download } from '@mui/icons-material'
import { useRef, useState } from 'react'

export default function BigText({ label, value, onChange, minRows = 10, maxRows = 30, readOnly = false, onExecute, downloadName, externalRef, showLineNumbers = false }: { label: string; value: string; onChange?: (v: string) => void; minRows?: number; maxRows?: number; readOnly?: boolean; onExecute?: () => void; downloadName?: string; externalRef?: any; showLineNumbers?: boolean }) {
  const [open, setOpen] = useState(false)
  const [wrap, setWrap] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const copy = async () => { try { await navigator.clipboard.writeText(value || '') } catch {} }
  const download = () => {
    const blob = new Blob([value || ''], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = downloadName || 'output.txt'
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(a.href)
    a.remove()
  }
  const upload = () => { if (readOnly) return; fileRef.current?.click() }
  const onFile = async (e: any) => {
    const f = e.target.files?.[0]
    if (!f || !onChange) return
    const txt = await f.text()
    onChange(txt)
    e.target.value = ''
  }
  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle1" sx={{ opacity: .9 }}>{label}</Typography>
        <Box>
          <Tooltip title="Fullscreen"><IconButton size="small" onClick={()=>setOpen(true)}><OpenInFull/></IconButton></Tooltip>
          <Tooltip title="Toggle wrap"><IconButton size="small" onClick={()=>setWrap(w=>!w)}><WrapText/></IconButton></Tooltip>
          <Tooltip title="Copy"><IconButton size="small" onClick={copy}><ContentCopy/></IconButton></Tooltip>
          {!readOnly && <Tooltip title="Upload"><IconButton size="small" onClick={upload}><UploadFile/></IconButton></Tooltip>}
          <Tooltip title="Download"><IconButton size="small" onClick={download}><Download/></IconButton></Tooltip>
          <input ref={fileRef} type="file" accept=".txt,.json,.yaml,.yml" style={{ display: 'none' }} onChange={onFile} />
        </Box>
      </Stack>
      <Box sx={{ position: 'relative' }}>
        {showLineNumbers && (
          <Box ref={gutterRef} sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 44, overflow: 'hidden', borderRight: '1px solid rgba(255,255,255,0.12)', borderTopLeftRadius: 12, borderBottomLeftRadius: 12, background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }}>
            <pre style={{ margin: 0, padding: '16px 8px', color: 'rgba(229,231,235,0.7)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: 14, lineHeight: '20px' }}>{Array.from({ length: Math.max(1, (value.match(/\n/g)?.length || 0) + 1) }, (_, i) => i + 1).join('\n')}</pre>
          </Box>
        )}
        <textarea
          ref={externalRef}
          value={value}
          onChange={e=>onChange && onChange(e.target.value)}
          onKeyDown={e=>{ if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && onExecute) { e.preventDefault(); onExecute() } }}
          onScroll={e=>{ const t = e.target as HTMLTextAreaElement; if (gutterRef.current) gutterRef.current.scrollTop = t.scrollTop }}
          rows={minRows}
          style={{ width: '100%', resize: 'vertical', minHeight: `${minRows*24}px`, maxHeight: `${maxRows*24}px`, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: 14, lineHeight: '20px', background: 'rgba(255,255,255,0.06)', color: 'inherit', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', padding: showLineNumbers ? '16px 16px 16px 52px' : '16px', whiteSpace: wrap ? 'pre-wrap' : 'pre', outline: 'none' }}
          readOnly={readOnly}
        />
      </Box>
      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="lg">
        <DialogContent>
          <textarea
            value={value}
            onChange={e=>onChange && onChange(e.target.value)}
            onKeyDown={e=>{ if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && onExecute) { e.preventDefault(); onExecute() } }}
            rows={24}
            style={{ width: '100%', minHeight: '70vh', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: 14, lineHeight: '20px', background: 'rgba(255,255,255,0.06)', color: 'inherit', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', padding: 16, whiteSpace: wrap ? 'pre-wrap' : 'pre', outline: 'none' }}
            readOnly={readOnly}
          />
        </DialogContent>
      </Dialog>
    </Box>
  )
}