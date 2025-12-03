import { useEffect, useRef } from 'react'

export default function CMerge({ left, right, collapse }: { left: string; right: string; collapse?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let view: any = null
    let disposed = false
    ;(async () => {
      const [{ EditorState }, { MergeView }, { EditorView }] = await Promise.all([
        import('@codemirror/state'),
        import('@codemirror/merge'),
        import('@codemirror/view')
      ])
      if (disposed || !containerRef.current) return
      const vividTheme = EditorView.theme({
        '.cm-insertedLine': {
          backgroundColor: 'rgba(34,197,94,0.65)',
          boxShadow: 'inset 8px 0 0 #22c55e',
          borderTop: '1px solid #22c55e55',
          borderBottom: '1px solid #22c55e55'
        },
        '.cm-deletedLine, .cm-deletedChunk': {
          backgroundColor: 'rgba(239,68,68,0.65)',
          boxShadow: 'inset 8px 0 0 #ef4444',
          borderTop: '1px solid #ef444455',
          borderBottom: '1px solid #ef444455'
        },
        '.cm-inlineChangedLine, .cm-changedLine': {
          backgroundColor: 'rgba(250,204,21,0.65)',
          boxShadow: 'inset 8px 0 0 #f59e0b',
          borderTop: '1px solid #f59e0b55',
          borderBottom: '1px solid #f59e0b55'
        },
        '.cm-changedText': {
          backgroundColor: 'rgba(245,158,11,0.25)',
          backgroundImage: 'linear-gradient(#f59e0bCC, #f59e0bCC)',
          backgroundSize: '100% 2px',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom'
        },
        '.cm-deletedText': {
          backgroundColor: 'rgba(239,68,68,0.25)',
          backgroundImage: 'linear-gradient(#ef4444CC, #ef4444CC)',
          backgroundSize: '100% 2px',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom'
        },
        '.cm-insertedText': {
          backgroundColor: 'rgba(34,197,94,0.20)'
        },
        '.cm-changedLineGutter': { backgroundColor: '#facc15' },
        '.cm-deletedLineGutter': { backgroundColor: '#ef4444' },
        '.cm-insertedLineGutter': { backgroundColor: '#22c55e' },
        '&.cm-merge-b .cm-changedLineGutter': { backgroundColor: '#facc15' },
        '&.cm-merge-a .cm-changedLineGutter': { backgroundColor: '#facc15' }
      })
      const a = EditorState.create({ doc: left, extensions: [vividTheme] })
      const b = EditorState.create({ doc: right, extensions: [vividTheme] })
      view = new MergeView({
        a,
        b,
        parent: containerRef.current,
        orientation: 'a-b',
        highlightChanges: true,
        gutter: true,
        collapseUnchanged: collapse ? { margin: 2, minSize: 4 } : undefined
      })
    })()
    return () => { disposed = true; if (view && view.destroy) view.destroy() }
  }, [left, right, collapse])
  return <div ref={containerRef} style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.18)', overflow: 'hidden', background: 'rgba(0,0,0,0.25)' }} />
}