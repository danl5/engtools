import { Box, Container, ToggleButton, ToggleButtonGroup, Typography, Grid, Paper, Button, Avatar } from '@mui/material'
import { useState } from 'react'

export default function Preview() {
  const [variant, setVariant] = useState<'play' | 'glass' | 'split'>('play')
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <ToggleButtonGroup value={variant} exclusive onChange={(_, v) => v && setVariant(v)}>
          <ToggleButton value="play">趣味交互</ToggleButton>
          <ToggleButton value="glass">玻璃拟态</ToggleButton>
          <ToggleButton value="split">杂志分栏</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {variant==='play' && <PlayVariant/>}
      {variant==='glass' && <GlassVariant/>}
      {variant==='split' && <SplitVariant/>}
    </Box>
  )
}

function PlayVariant() {
  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 4, p: 6, background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 40%, #7c3aed 100%)' }}>
      <FloatingDecor />
      <Container>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>让工具更好玩</Typography>
        <Typography sx={{ opacity: 0.9, mb: 4 }}>轻互动、微动效与多彩渐变，让常用工具更具探索感。</Typography>
        <Grid container spacing={3}>
          {["加密助手","格式转换","文本处理"].map((t,i)=> (
            <Grid key={t} item xs={12} md={4}>
              <Paper sx={{ p:3, borderRadius:3, bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <Avatar sx={{ bgcolor: ['#06b6d4','#22d3ee','#a78bfa'][i%3], mb:2 }}>{t.slice(0,1)}</Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{t}</Typography>
                <Typography sx={{ opacity: 0.8, mb:2 }}>快速直达关键功能，支持拖拽、粘贴与快捷键。</Typography>
                <Button variant="contained">立即体验</Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}

function FloatingDecor() {
  return (
    <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <Box sx={{ position: 'absolute', top: 40, left: 60, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,.6), transparent 60%)', animation: 'float 6s ease-in-out infinite', '@keyframes float': { '0%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' }, '100%': { transform: 'translateY(0)' } } }} />
      <Box sx={{ position: 'absolute', bottom: 40, right: 80, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,.6), transparent 60%)', animation: 'float 7s ease-in-out infinite' }} />
    </Box>
  )
}

function GlassVariant() {
  return (
    <Box sx={{ p: 6, borderRadius: 4, background: 'url(https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1600&auto=format&fit=crop) center/cover' }}>
      <Container>
        <Paper sx={{ p:5, borderRadius:4, bgcolor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(12px)', mb:4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb:1 }}>清透层次，信息有序</Typography>
          <Typography sx={{ opacity: 0.9 }}>以玻璃拟态与自适应卡片组织工具，突出主次与结构。</Typography>
        </Paper>
        <Grid container spacing={3}>
          {[1,2,3,4].map((i)=> (
            <Grid key={i} item xs={12} md={3}>
              <Paper sx={{ p:3, borderRadius:3, bgcolor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb:1 }}>面板 {i}</Typography>
                <Typography sx={{ opacity: 0.85, mb:2 }}>状态、统计与快捷入口集成在同一卡片中。</Typography>
                <Button size="small" variant="outlined">查看</Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}

function SplitVariant() {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '280px 1fr' }, gap: 3, p: 3 }}>
      <Paper sx={{ p:3, borderRadius:3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb:2 }}>导航</Typography>
        {['常用','开发','安全','文档'].map((t)=> (
          <Button key={t} fullWidth sx={{ justifyContent: 'flex-start', mb:1 }} variant="text">{t}</Button>
        ))}
      </Paper>
      <Paper sx={{ p:4, borderRadius:3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb:2 }}>内容主区</Typography>
        <Typography sx={{ opacity: 0.85, mb:3 }}>以分栏为骨架，左侧稳定导航，右侧卡片化功能区，适合高密度工具集合。</Typography>
        <Grid container spacing={2}>
          {[1,2,3,4,5,6].map((i)=> (
            <Grid key={i} item xs={12} md={4}>
              <Paper sx={{ p:2, borderRadius:2 }}>
                <Typography sx={{ fontWeight: 700 }}>功能卡 {i}</Typography>
                <Typography sx={{ opacity: 0.8 }}>描述与入口，支持快速操作。</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  )
}