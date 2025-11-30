import { Container, Typography, Grid, TextField, Button, Alert, Card, CardContent, MenuItem, Select, FormControl, InputLabel, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper } from '@mui/material'
import { Public, Place } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { setLoading, setError, openSnackbar } from '../store'
import { useState } from 'react'
import api from '../api'
import BigText from '../components/BigText'

export default function IpDomain() {
  const dispatch = useDispatch()
  const error = useSelector((s: RootState) => s.ui.error)
  const loading = useSelector((s: RootState) => s.ui.loading)
  const [ipInput, setIpInput] = useState('')
  const [ipRes, setIpRes] = useState<any>(null)
  const [active, setActive] = useState<'ipgeo'|'dns'|'whois'>('ipgeo')
  const [dnsName, setDnsName] = useState('')
  const [dnsType, setDnsType] = useState<'A'|'AAAA'|'CNAME'|'MX'|'TXT'|'NS'>('A')
  const [dnsRes, setDnsRes] = useState<any[]>([])
  const [whoisName, setWhoisName] = useState('')
  const [whoisInfo, setWhoisInfo] = useState<any>(null)
  const ipLookup = async () => {
    dispatch(setLoading(true))
    try {
      const cleanIp = (s: string) => { const t = s.trim(); if (!t) return ''; let h = t; if (h.startsWith('http://') || h.startsWith('https://')) h = h.replace(/^https?:\/\//, ''); h = h.split('/')[0]; if (h.startsWith('[') && h.includes(']')) return h.slice(h.indexOf('[')+1, h.indexOf(']')); const idx = h.indexOf(':'); return idx>0 ? h.slice(0, idx) : h }
      const ip = ipInput ? cleanIp(ipInput) : ''
      const { data } = await api.get('/v1/tools/ip/geo', { params: ip ? { ip } : {} })
      setIpRes(data)
      dispatch(setError(''))
      dispatch(openSnackbar({ message: 'IP info fetched', severity: 'success' }))
    } catch { dispatch(setError('IP lookup failed')) } finally { dispatch(setLoading(false)) }
  }
  const dnsLookup = async () => {
    if (!dnsName) { dispatch(setError('Please enter domain/host')); return }
    dispatch(setLoading(true))
    try {
      const clean = (s: string) => { let h = s.trim(); if (!h) return ''; if (h.startsWith('http://') || h.startsWith('https://')) h = h.replace(/^https?:\/\//, ''); h = h.split('/')[0]; return h }
      const { data } = await api.get('/v1/tools/dns/resolve', { params: { name: clean(dnsName), type: dnsType, provider: 'cf' } })
      setDnsRes(Array.isArray(data?.answers) ? data.answers : []);
      dispatch(setError(''))
      dispatch(openSnackbar({ message: 'DNS resolved', severity: 'success' }))
    } catch { dispatch(setError('DNS lookup failed')) } finally { dispatch(setLoading(false)) }
  }
  const whoisLookup = async () => {
    if (!whoisName) { dispatch(setError('Please enter domain')); return }
    dispatch(setLoading(true))
    try {
      const clean = (s: string) => { let h = s.trim(); if (!h) return ''; if (h.startsWith('http://') || h.startsWith('https://')) h = h.replace(/^https?:\/\//, ''); h = h.split('/')[0]; return h }
      const { data } = await api.get('/v1/tools/domain/whois', { params: { name: clean(whoisName) } })
      setWhoisInfo(data)
      dispatch(setError(''))
      dispatch(openSnackbar({ message: 'WHOIS fetched', severity: 'success' }))
    } catch { dispatch(setError('WHOIS lookup failed')) } finally { dispatch(setLoading(false)) }
  }
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>IP & Domain Tools</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="ipdom-tool">Select Tool</InputLabel>
        <Select labelId="ipdom-tool" label="Select Tool" value={active} onChange={e=>setActive(e.target.value as any)}>
          <MenuItem value="ipgeo">IP Geolocation</MenuItem>
          <MenuItem value="dns">DNS Resolve</MenuItem>
          <MenuItem value="whois">WHOIS</MenuItem>
        </Select>
      </FormControl>
      <Grid container spacing={4}>
        {active==='ipgeo' && (
        <Grid item xs={12} md={8}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent>
              <Typography variant="h6"><Public sx={{ mr:1, verticalAlign:'middle' }} />IP Geolocation (ipinfo.io)</Typography>
              <TextField sx={{ mt:1 }} label="IP (leave empty to use client IP)" value={ipInput} onChange={e=>setIpInput(e.target.value)} fullWidth />
              <Button sx={{ mt:1 }} variant="contained" disabled={loading} onClick={ipLookup}>Lookup</Button>
              {ipRes && (
                <>
                  <Grid container spacing={2} sx={{ mt:2 }}>
                    <Grid item xs={12} md={6}>
                      <Typography sx={{ fontWeight: 700 }}><Place sx={{ mr:1, verticalAlign:'middle' }} />Location</Typography>
                      <Typography sx={{ opacity:.9 }}>City: {ipRes.city} | Region: {ipRes.region}</Typography>
                      <Typography sx={{ opacity:.9 }}>Country: {ipRes.country} ({ipRes.country_code})</Typography>
                      <Typography sx={{ opacity:.9 }}>Lat/Lon: {ipRes.latitude}, {ipRes.longitude}</Typography>
                      <Typography sx={{ opacity:.9 }}>Timezone: {ipRes.timezone}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography sx={{ fontWeight: 700 }}>Network</Typography>
                      <Typography sx={{ opacity:.9 }}>IP: {ipRes.ip}</Typography>
                      <Typography sx={{ opacity:.9 }}>Hostname: {ipRes.hostname || '-'}</Typography>
                      <Typography sx={{ opacity:.9 }}>Org: {ipRes.org}</Typography>
                      <Typography sx={{ opacity:.9 }}>ASN: {ipRes.asn || '-'}</Typography>
                      <Typography sx={{ opacity:.9 }}>Postal: {ipRes.postal || '-'}</Typography>
                      <Typography sx={{ opacity:.9 }}>Anycast: {String(ipRes.anycast)}</Typography>
                      {ipRes.latitude && ipRes.longitude && (
                        <Button sx={{ mt:1 }} href={`https://www.google.com/maps?q=${ipRes.latitude},${ipRes.longitude}`} target="_blank">Open in Maps</Button>
                      )}
                    </Grid>
                  </Grid>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        )}
        {active==='dns' && (
        <Grid item xs={12} md={8}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent>
              <Typography variant="h6">DNS Resolve</Typography>
              <Grid container spacing={2} sx={{ mt:1 }}>
                <Grid item xs={12} md={8}><TextField label="Domain/Host" value={dnsName} onChange={e=>setDnsName(e.target.value)} fullWidth /></Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id="dns-type">Type</InputLabel>
                    <Select labelId="dns-type" label="Type" value={dnsType} onChange={e=>setDnsType(e.target.value as any)}>
                      <MenuItem value="A">A</MenuItem>
                      <MenuItem value="AAAA">AAAA</MenuItem>
                      <MenuItem value="CNAME">CNAME</MenuItem>
                      <MenuItem value="MX">MX</MenuItem>
                      <MenuItem value="TXT">TXT</MenuItem>
                      <MenuItem value="NS">NS</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Button sx={{ mt:1 }} variant="contained" disabled={loading} onClick={dnsLookup}>Resolve</Button>
              {dnsRes && dnsRes.length>0 && (
                <TableContainer component={Paper} sx={{ mt:2, background:'rgba(255,255,255,0.06)' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>TTL</TableCell>
                        <TableCell>Data</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dnsRes.map((r:any, idx:number)=> (
                        <TableRow key={idx}>
                          <TableCell>{r.name || dnsName}</TableCell>
                          <TableCell>{r.type || dnsType}</TableCell>
                          <TableCell>{r.ttl ?? '-'}</TableCell>
                          <TableCell>{r.data || r.value || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        )}
        {active==='whois' && (
        <Grid item xs={12} md={8}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent>
              <Typography variant="h6">WHOIS</Typography>
              <TextField sx={{ mt:1 }} label="Domain" value={whoisName} onChange={e=>setWhoisName(e.target.value)} fullWidth />
              <Button sx={{ mt:1 }} variant="contained" disabled={loading} onClick={whoisLookup}>Lookup WHOIS</Button>
              {whoisInfo && (
                <TableContainer component={Paper} sx={{ mt:2, background:'rgba(255,255,255,0.06)' }}>
                  <Table size="small">
                    <TableBody>
                      <TableRow><TableCell>Domain</TableCell><TableCell>{whoisInfo.name || '-'}</TableCell></TableRow>
                      <TableRow><TableCell>Registrar</TableCell><TableCell>{whoisInfo.registrar || '-'}</TableCell></TableRow>
                      <TableRow><TableCell>Registrar URL</TableCell><TableCell>{whoisInfo.registrar_url || '-'}</TableCell></TableRow>
                      <TableRow><TableCell>Created</TableCell><TableCell>{whoisInfo.created || '-'}</TableCell></TableRow>
                      <TableRow><TableCell>Updated</TableCell><TableCell>{whoisInfo.updated || '-'}</TableCell></TableRow>
                      <TableRow><TableCell>Expires</TableCell><TableCell>{whoisInfo.expires || '-'}</TableCell></TableRow>
                      <TableRow><TableCell>Status</TableCell><TableCell>{Array.isArray(whoisInfo.status)&&whoisInfo.status.length? whoisInfo.status.join(', ') : '-'}</TableCell></TableRow>
                      <TableRow><TableCell>Name Servers</TableCell><TableCell>{Array.isArray(whoisInfo.name_servers)&&whoisInfo.name_servers.length? whoisInfo.name_servers.join(', ') : '-'}</TableCell></TableRow>
                      <TableRow><TableCell>WHOIS Server</TableCell><TableCell>{whoisInfo.server || '-'}</TableCell></TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        )}
      </Grid>
    </Container>
  )
}