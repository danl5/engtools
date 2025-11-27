import { Box, Typography, IconButton, Stack, Tooltip } from '@mui/material'
import { ExpandMore, ChevronRight, ContentCopy } from '@mui/icons-material'
import { useState } from 'react'

function Node({ k, v, path, depth }: { k: string | null; v: any; path: string; depth: number }) {
  const [open, setOpen] = useState(true)
  const [hover, setHover] = useState(false)
  const type = v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v
  const color = type === 'string' ? '#93c5fd' : type === 'number' ? '#fca5a5' : type === 'boolean' ? '#fdba74' : type === 'null' ? '#a3a3a3' : type === 'array' ? '#22d3ee' : '#a78bfa'
  const summary = type === 'array' ? `Array(${(v as any[]).length})` : type === 'object' ? 'Object' : ''
  const copy = async () => { try { await navigator.clipboard.writeText(path) } catch {} }
  const isComplex = type === 'object' || type === 'array'
  return (
    <Box sx={{ pl: depth * 1.0, pr: 1 }} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ py: 0.25 }}>
        {isComplex ? (
          <IconButton size="small" onClick={() => setOpen(o => !o)} sx={{ mr: 0.5 }}>{open ? <ExpandMore/> : <ChevronRight/>}</IconButton>
        ) : <Box sx={{ width: 32 }} />}
        {k !== null && <Typography sx={{ color: '#cbd5e1', mr: 0.75, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{k}:</Typography>}
        {isComplex ? (
          <Typography sx={{ color, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{summary}</Typography>
        ) : (
          <Typography sx={{ color, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{type === 'string' ? `"${v}"` : String(v)}</Typography>
        )}
        <Tooltip title="Copy path"><IconButton size="small" onClick={copy} sx={{ opacity: hover ? 1 : 0, transition: 'opacity .15s' }}><ContentCopy/></IconButton></Tooltip>
      </Stack>
      {open && isComplex && (
        <Box sx={{ borderLeft: '1px dashed rgba(255,255,255,0.12)', pl: 1.5 }}>
          {type === 'array' ? (
            (v as any[]).map((item: any, idx: number) => (
              <Node key={idx} k={String(idx)} v={item} path={`${path}[${idx}]`} depth={depth + 1} />
            ))
          ) : (
            Object.keys(v as any).sort((a,b)=>a.localeCompare(b)).map((key: string) => (
              <Node key={key} k={key} v={(v as any)[key]} path={`${path}.${key}`} depth={depth + 1} />
            ))
          )}
        </Box>
      )}
    </Box>
  )
}

export default function JsonViewer({ value }: { value: any }) {
  return (
    <Box sx={{ fontSize: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', p: 2, overflow: 'hidden' }}>
      <Node k={null} v={value} path={'$'} depth={0} />
    </Box>
  )
}