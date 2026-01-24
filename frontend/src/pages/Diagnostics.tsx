import { Container, Typography, Grid, Card, CardContent, FormControl, InputLabel, Select, MenuItem, TextField, Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper, Box, Alert, ToggleButtonGroup, ToggleButton } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { useState } from 'react'
import { RootState, setError, openSnackbar } from '../store'
import BigText from '../components/BigText'
import { trackEvent } from '../analytics'

export default function Diagnostics() {
  const dispatch = useDispatch()
  const error = useSelector((s: RootState) => s.ui.error)
  const [category, setCategory] = useState<'network'|'storage'|'compute'|'container'|'k8s'|'lb'|'security'>('network')
  const [scenario, setScenario] = useState<'dns_resolve_issue'|'site_slow'|'tls_error'|'http3_unreachable'|'proxy_issue'|'mtu_blackhole'|'disk_io_issue'|'fs_errors'|'raid_lvm'|'remote_storage'|'mount_capacity'|'cpu_load'|'memory_oom'|'syscall_latency'|'irq_softirq'|'scheduler_time'|'runtime_issue'|'image_pull_slow'|'cgroups_namespace'|'cni_network_issue'|'node_notready'|'pod_crashloop'|'service_dns_issue'|'kubeproxy_mode'|'cert_expiry'|'nginx_gateway'|'envoy_gateway'|'haproxy_gateway'|'selinux_apparmor'|'firewall_rules'|'traffic_control'>('dns_resolve_issue')
  const [os, setOs] = useState<'macos'|'linux'>('linux')
  const [host, setHost] = useState('')
  const [resolver, setResolver] = useState('')
  const [port, setPort] = useState('443')
  const [path, setPath] = useState('/')
  const [originIp, setOriginIp] = useState('')
  const [samples, setSamples] = useState(10)
  const [timeout, setTimeoutVal] = useState(10)
  const [cmds, setCmds] = useState<Array<{cmd:string, desc:string}>>([])
  const [dfPing, setDfPing] = useState(false)
  const [svcRows, setSvcRows] = useState<Array<{name:string, clusterIP:string, port:string, nodePort?:string, chain:string, endpoints:string[]}>>([])
  const [epRows, setEpRows] = useState<Array<{svcChain:string, sepChain:string, to:string}>>([])
  const [device, setDevice] = useState('/dev/sda')
  const [pid, setPid] = useState('')
  const [iface, setIface] = useState('')
  const [image, setImage] = useState('')
  const [parserType, setParserType] = useState<'iptables'|'ipset'|'ipvs'>('iptables')
  const [parserInput, setParserInput] = useState('')
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([])
  const [parsedRows, setParsedRows] = useState<any[]>([])
  const sanitize = (t: string) => t.replace(/\x1B\[[0-9;]*[A-Za-z]/g, '').replace(/\r/g, '')
  const [parserView, setParserView] = useState<'raw'|'parsed'>('raw')
  
  const scenarioOptions: Record<string, Array<{value:string,label:string}>> = {
    network: [
      { value: 'dns_resolve_issue', label: 'DNS resolve issue' },
      { value: 'site_slow', label: 'Site slow/timeout' },
      { value: 'tls_error', label: 'TLS handshake/cert error' },
      { value: 'http3_unreachable', label: 'HTTP/3 unreachable' },
      { value: 'proxy_issue', label: 'Proxy impact' },
      { value: 'mtu_blackhole', label: 'MTU/DF blackhole' }
    ],
    storage: [
      { value: 'disk_io_issue', label: 'Disk IO issue' },
      { value: 'fs_errors', label: 'Filesystem errors' },
      { value: 'raid_lvm', label: 'RAID/LVM/ZFS' },
      { value: 'remote_storage', label: 'NFS/iSCSI' },
      { value: 'mount_capacity', label: 'Mount/Capacity anomaly' }
    ],
    compute: [
      { value: 'cpu_load', label: 'CPU high load' },
      { value: 'memory_oom', label: 'Memory/OOM' },
      { value: 'syscall_latency', label: 'Syscall latency' },
      { value: 'irq_softirq', label: 'IRQ/softirq/network queues' },
      { value: 'scheduler_time', label: 'Scheduler/time drift' }
    ],
    container: [
      { value: 'runtime_issue', label: 'Docker/containerd runtime issue' },
      { value: 'image_pull_slow', label: 'Image pull slow' },
      { value: 'cgroups_namespace', label: 'Cgroups/Namespace isolation' },
      { value: 'cni_network_issue', label: 'CNI network issue' }
    ],
    k8s: [
      { value: 'node_notready', label: 'Node NotReady' },
      { value: 'pod_crashloop', label: 'Pod CrashLoopBackOff' },
      { value: 'service_dns_issue', label: 'Service/DNS issue' },
      { value: 'kubeproxy_mode', label: 'kube-proxy mode/iptables' },
      { value: 'cert_expiry', label: 'Certificates expiry' }
    ],
    lb: [
      { value: 'nginx_gateway', label: 'Nginx gateway' },
      { value: 'envoy_gateway', label: 'Envoy gateway' },
      { value: 'haproxy_gateway', label: 'HAProxy gateway' }
    ],
    security: [
      { value: 'selinux_apparmor', label: 'SELinux/AppArmor' },
      { value: 'firewall_rules', label: 'Firewall rules' },
      { value: 'traffic_control', label: 'Traffic control (tc)' }
    ]
  }
  const gen = () => {
    const rows: Array<{cmd:string, desc:string}> = []
    const add = (cmd:string, desc:string) => rows.push({ cmd, desc })
    const h = host
    const r = resolver || '223.5.5.5'
    const p = port || '443'
    const pa = path || '/'
    const ip = originIp
    const c = samples
    const t = timeout
    if (category==='network') {
      if (!h) { dispatch(setError('Please enter host/domain')); return }
      if (scenario==='dns_resolve_issue') {
        add(`dig ${h} A +trace`, 'Authority chain trace')
        if (r) add(`dig ${h} A @${r} +nocache`, 'Query recursive resolver (no cache)')
        if (os==='macos') add(`scutil --dns`, 'Show system DNS config'); else add(`resolvectl status`, 'Show system DNS config')
        add(`dig ${h} A +dnssec`, 'DNSSEC validation check')
      } else if (scenario==='site_slow') {
        add(`mtr -T -c ${c} ${h}`, 'TCP MTR sampling')
        add(`curl -I -m ${t} https://${h}${pa} -w '%{time_total}\n' -v`, 'HTTP headers and total time')
      } else if (scenario==='tls_error') {
        add(`openssl s_client -connect ${h}:${p} -servername ${h} -showcerts`, 'TLS handshake and cert chain')
        if (ip) add(`curl --resolve '${h}:${p}:${ip}' https://${h}${pa} -v`, 'Force SNI+IP for origin check')
      } else if (scenario==='http3_unreachable') {
        add(`curl -I --http3 -m ${t} https://${h}${pa} -v`, 'Attempt HTTP/3')
        add(`mtr -U -c ${c} ${h}`, 'UDP MTR sampling')
      } else if (scenario==='proxy_issue') {
        add(`env | grep -E '(http|https)_proxy'`, 'Inspect env proxy settings')
        add(`curl --noproxy '*' https://${h}${pa} -v`, 'Bypass proxy')
      } else if (scenario==='mtu_blackhole') {
        add(`ping ${h} -D -s 1400`, 'DF ping test for MTU blackhole')
        add(`ping ${h} -D -s 1472`, 'DF ping test near Ethernet MTU')
      }
      if (dfPing && h) add(`ping ${h} -D -s 1400`, 'DF ping test for MTU')
    } else if (category==='storage') {
      if (scenario==='disk_io_issue') {
        add(`smartctl -a ${device}`, 'Disk SMART health')
        add(`iostat -x 1 5`, 'Extended IO stats')
        add(`sar -d 1 5`, 'Disk stats over time')
      } else if (scenario==='fs_errors') {
        add(`dmesg -T | grep -i -E 'EXT4|XFS'`, 'Filesystem error logs')
        add(`findmnt -A`, 'Mount points')
        add(`df -h`, 'Capacity overview')
      } else if (scenario==='raid_lvm') {
        add(`mdadm --detail /dev/md0`, 'RAID status')
        add(`pvdisplay && vgdisplay && lvdisplay`, 'LVM overview')
        add(`zpool status`, 'ZFS pool status (if applicable)')
      } else if (scenario==='remote_storage') {
        add(`nfsstat -m`, 'NFS mounts stats')
        add(`rpcinfo -p`, 'RPC services')
        add(`iscsiadm -m session`, 'iSCSI sessions')
      } else if (scenario==='mount_capacity') {
        add(`df -h`, 'Capacity overview')
        add(`du -x -h --max-depth=1 /`, 'Top-level space usage')
      }
    } else if (category==='compute') {
      if (scenario==='cpu_load') {
        add(`mpstat -P ALL 1 3`, 'Per-CPU stats')
        add(`pidstat -u -p ALL 1 3`, 'Per-process CPU usage')
        add(`vmstat 1 5`, 'System counters')
      } else if (scenario==='memory_oom') {
        add(`dmesg -T | grep -i -E 'Out of memory|oom-killer'`, 'OOM logs')
        add(`free -m`, 'Memory usage')
        add(`smem -t`, 'Memory by process')
      } else if (scenario==='syscall_latency') {
        if (pid) add(`strace -p ${pid} -tt -T`, 'Trace slow syscalls')
        add(`perf record -g -a sleep 10 && perf report`, 'CPU profile')
      } else if (scenario==='irq_softirq') {
        add(`cat /proc/interrupts`, 'Hardware interrupts')
        if (iface) add(`ethtool -S ${iface}`, 'NIC queue stats')
        add(`cat /proc/softirqs`, 'SoftIRQ counters')
      } else if (scenario==='scheduler_time') {
        add(`chronyc sources -v`, 'Time sync sources')
        add(`timedatectl`, 'Time configuration')
      }
    } else if (category==='container') {
      if (scenario==='runtime_issue') {
        add(`journalctl -u containerd -n 200 --no-pager`, 'containerd logs')
        add(`crictl ps -a`, 'CRI containers')
        add(`ctr -n k8s.io containers ls`, 'Containerd containers')
      } else if (scenario==='image_pull_slow') {
        if (image) add(`crictl pull ${image}`, 'Pull image via CRI')
        add(`ctr -n k8s.io images ls`, 'Images in containerd')
      } else if (scenario==='cgroups_namespace') {
        if (pid) add(`nsenter --target ${pid} -m -u -n -i -p -t`, 'Enter namespaces')
        add(`systemd-cgtop`, 'Cgroups top')
      } else if (scenario==='cni_network_issue') {
        add(`ip link && ip addr && ip route`, 'Network interfaces and routes')
        add(`iptables -t nat -S`, 'NAT rules (kube-proxy)')
      }
    } else if (category==='k8s') {
      if (scenario==='node_notready') {
        add(`kubectl get nodes -o wide`, 'Nodes overview')
        add(`kubectl describe node <node>`, 'Node detail')
        add(`journalctl -u kubelet -n 200 --no-pager`, 'Kubelet logs')
      } else if (scenario==='pod_crashloop') {
        add(`kubectl get pods -A`, 'Pods overview')
        add(`kubectl describe pod <pod> -n <ns>`, 'Pod events')
        add(`kubectl logs <pod> -n <ns> --previous`, 'Container previous logs')
      } else if (scenario==='service_dns_issue') {
        add(`kubectl get svc,ep -A`, 'Service/Endpoints')
        add(`kubectl exec -n <ns> -it <pod> -- nslookup <svc>`, 'In-cluster DNS resolution')
        add(`kubectl -n kube-system logs deploy/coredns`, 'CoreDNS logs')
      } else if (scenario==='kubeproxy_mode') {
        add(`kubectl -n kube-system get ds kube-proxy -o yaml | grep -i "mode:"`, 'Detect kube-proxy mode')
        add(`iptables-save -t nat`, 'kube-proxy iptables (nat)')
        add(`ipset list KUBE-CLUSTER-IP`, 'ipset cluster IP set')
        add(`ipset list KUBE-LOAD-BALANCER`, 'ipset load balancer set')
        add(`ipset list KUBE-LOOP-BACK`, 'ipset loop back set')
        add(`ipvsadm -Ln`, 'IPVS services and destinations')
        add(`kubectl -n kube-system get ds kube-proxy -o yaml`, 'kube-proxy config')
      } else if (scenario==='cert_expiry') {
        add(`kubeadm certs check-expiration`, 'Certificates expiry')
      }
    } else if (category==='lb') {
      if (scenario==='nginx_gateway') {
        add(`nginx -t -V`, 'Config test and build flags')
        add(`curl -I -v https://${h}${pa}`, 'Gateway response headers')
      } else if (scenario==='envoy_gateway') {
        add(`curl -sS http://127.0.0.1:15000/clusters`, 'Envoy clusters')
        add(`curl -sS http://127.0.0.1:15000/listeners`, 'Envoy listeners')
      } else if (scenario==='haproxy_gateway') {
        add(`echo 'show info' | socat stdio /run/haproxy/admin.sock`, 'HAProxy stats')
      }
    } else if (category==='security') {
      if (scenario==='selinux_apparmor') {
        add(`getenforce`, 'SELinux mode')
        add(`ausearch -m avc -ts recent`, 'SELinux AVC logs')
      } else if (scenario==='firewall_rules') {
        add(`iptables-save`, 'iptables rules')
        add(`nft list ruleset`, 'nftables ruleset')
      } else if (scenario==='traffic_control') {
        if (iface) add(`tc qdisc show dev ${iface}`, 'qdisc on iface')
        add(`tc class show dev ${iface}`, 'classes on iface')
        add(`tc filter show dev ${iface}`, 'filters on iface')
      }
    }
    setCmds(rows)
    dispatch(setError(''))
    dispatch(openSnackbar({ message: 'Commands generated', severity: 'success' }))
    trackEvent('diagnostics_generate', { category, scenario, os })
  }
  const parseOutput = () => {
    try {
      if (parserType === 'iptables') {
        const text = sanitize(parserInput)
        const lines = text.split(/\n/)
        const svcMap: Record<string, { name:string; clusterIP:string; port:string; chain:string; nodePort?:string; endpoints:string[] }> = {}
        const sepTo: Record<string, string> = {}
        const svcFromNodePort: Record<string, string> = {}
        const svcFromServices: Array<{chain:string; name:string; clusterIP:string; port:string}> = []
        const svcToSep: Array<{svc:string; sep:string}> = []
        const nodePortRe = new RegExp('^-A\\s+KUBE-NODEPORTS.*?--dport\\s+(\\d+).*?(?:--comment\\s+"([^"]+)")?.*?-j\\s+(KUBE-SVC-[A-Z0-9]+)','i')
        const svcLineRe = new RegExp('^-A\\s+KUBE-SERVICES.*?-d\\s+(\\d+\\.\\d+\\.\\d+\\.\\d+)\\/32.*?--dport\\s+(\\d+).*?(?:--comment\\s+"([^"]+)")?.*?-j\\s+(KUBE-SVC-[A-Z0-9]+)','i')
        const svcSepRe = new RegExp('^-A\\s+(KUBE-SVC-[A-Z0-9]+).*?-j\\s+(KUBE-SEP-[A-Z0-9]+)','i')
        const sepDnatRe = new RegExp('^-A\\s+(KUBE-SEP-[A-Z0-9]+).*?-j\\s+DNAT\\s+--to-destination\\s+([0-9.]+):(\\d+)','i')
        for (const ln of lines) {
          let m
          if ((m = nodePortRe.exec(ln))) {
            const port = m[1], comment = m[2], chain = m[3]
            svcFromNodePort[chain] = port
          } else if ((m = svcLineRe.exec(ln))) {
            const cip = m[1], dport = m[2], comment = m[3], chain = m[4]
            const name = comment ? (comment.split(' ')[0] || comment) : chain
            svcFromServices.push({ chain, name, clusterIP: cip, port: dport })
          } else if ((m = svcSepRe.exec(ln))) {
            const svc = m[1], sep = m[2]
            svcToSep.push({ svc, sep })
          } else if ((m = sepDnatRe.exec(ln))) {
            const sep = m[1], ip = m[2], port = m[3]
            sepTo[sep] = `${ip}:${port}`
          }
        }
        for (const s of svcFromServices) {
          if (!svcMap[s.chain]) svcMap[s.chain] = { name: s.name, clusterIP: s.clusterIP, port: s.port, chain: s.chain, endpoints: [] }
          const np = svcFromNodePort[s.chain]
          if (np) svcMap[s.chain].nodePort = np
        }
        for (const rel of svcToSep) {
          const to = sepTo[rel.sep]
          if (to && svcMap[rel.svc]) svcMap[rel.svc].endpoints.push(rel.sep)
        }
        const svcRowsOut: Array<{name:string, clusterIP:string, port:string, nodePort?:string, chain:string, endpoints:string[]}> = Object.values(svcMap)
        const epRowsOut: Array<{svcChain:string, sepChain:string, to:string}> = []
        for (const rel of svcToSep) {
          const to = sepTo[rel.sep]
          if (to) epRowsOut.push({ svcChain: rel.svc, sepChain: rel.sep, to })
        }
        setSvcRows(svcRowsOut)
        setEpRows(epRowsOut)
        setParsedHeaders([])
        setParsedRows([])
      } else if (parserType === 'ipset') {
        const text = sanitize(parserInput)
        const lines = text.split(/\n/)
        let currentSet = ''
        const rows: any[] = []
        for (const ln of lines) {
          const mName = ln.match(/^Name:\s*(.+)$/i)
          if (mName) { currentSet = mName[1].trim(); continue }
          const mMember = ln.match(/^\s*([0-9a-f:.]+)(?:,\s*(tcp|udp):?(\d+))?/i)
          if (mMember && currentSet) {
            const ip = mMember[1]
            const proto = mMember[2] || ''
            const port = mMember[3] || ''
            rows.push({ set: currentSet, ip, proto, port })
          }
        }
        setParsedHeaders(['set','ip','proto','port'])
        setParsedRows(rows)
      } else if (parserType === 'ipvs') {
        const text = sanitize(parserInput)
        const lines = text.split(/\n/)
        const services: Array<{proto:string, vip:string, port:string, sched:string}> = []
        const dests: Array<{vip:string, vport:string, rip:string, rport:string, fwd:string}> = []
        let cur: {vip:string, vport:string} | null = null
        for (const ln of lines) {
          const ms = ln.match(/^(TCP|UDP)\s+([0-9a-f:.]+):(\d+)\s+(\S+)/i)
          if (ms) { services.push({ proto: ms[1], vip: ms[2], port: ms[3], sched: ms[4] }); cur = { vip: ms[2], vport: ms[3] }; continue }
          const md = ln.match(/^\s*->\s*([0-9a-f:.]+):(\d+)\s+(\S+)/i)
          if (md && cur) { dests.push({ vip: cur.vip, vport: cur.vport, rip: md[1], rport: md[2], fwd: md[3] }) }
        }
        const svcRowsOut = services.map(s => ({ proto: s.proto, vip: s.vip, port: s.port, sched: s.sched }))
        const epRowsOut = dests.map(d => ({ vip: `${d.vip}:${d.vport}`, dest: `${d.rip}:${d.rport}`, fwd: d.fwd }))
        setParsedHeaders(['vip','dest','fwd'])
        setParsedRows(epRowsOut)
        setSvcRows(svcRows.map(x=>x))
        setEpRows(epRows.map(x=>x))
      }
      dispatch(setError(''))
      dispatch(openSnackbar({ message: 'Parsed output', severity: 'success' }))
      trackEvent('diagnostics_parse', { parser: parserType })
    } catch {
      setParsedHeaders(['raw']); setParsedRows([{ raw: sanitize(parserInput).slice(0, 2000) }]); dispatch(setError('Parse failed'))
    }
  }
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Diagnostics CLI Generator</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={12}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)' }}>
            <CardContent sx={{ p:3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel id="cat">Category</InputLabel>
                    <Select labelId="cat" label="Category" value={category} onChange={e=>{ const v = e.target.value as any; setCategory(v); setScenario(scenarioOptions[v][0].value as any) }}>
                      <MenuItem value="network">Network</MenuItem>
                      <MenuItem value="storage">Storage</MenuItem>
                      <MenuItem value="compute">Compute</MenuItem>
                      <MenuItem value="container">Container</MenuItem>
                      <MenuItem value="k8s">Kubernetes</MenuItem>
                      <MenuItem value="lb">LB/Gateway</MenuItem>
                      <MenuItem value="security">Security</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel id="scn">Scenario</InputLabel>
                    <Select labelId="scn" label="Scenario" value={scenario} onChange={e=>setScenario(e.target.value as any)}>
                      {scenarioOptions[category].map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel id="os">OS</InputLabel>
                    <Select labelId="os" label="OS" value={os} onChange={e=>setOs(e.target.value as any)}>
                      <MenuItem value="macos">macOS</MenuItem>
                      <MenuItem value="linux">Linux</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {(category==='network' || category==='lb') && (
                  <Grid item xs={12} md={6}><TextField label="Host/Domain" value={host} onChange={e=>setHost(e.target.value)} fullWidth /></Grid>
                )}
                {(category==='network' && scenario==='dns_resolve_issue') && (
                  <Grid item xs={12} md={4}><TextField label="Resolver (optional)" value={resolver} onChange={e=>setResolver(e.target.value)} fullWidth /></Grid>
                )}
                {(category==='network' && (scenario==='tls_error' || scenario==='site_slow' || scenario==='http3_unreachable')) && (
                  <Grid item xs={12} md={2}><TextField label="Port" value={port} onChange={e=>setPort(e.target.value)} fullWidth /></Grid>
                )}
                {(category==='network' && scenario!=='dns_resolve_issue') && (
                  <Grid item xs={12} md={4}><TextField label="Path" value={path} onChange={e=>setPath(e.target.value)} fullWidth /></Grid>
                )}
                {(category==='network' && scenario==='tls_error') && (
                  <Grid item xs={12} md={4}><TextField label="Origin IP (optional)" value={originIp} onChange={e=>setOriginIp(e.target.value)} fullWidth /></Grid>
                )}
                <Grid item xs={12} md={2}><TextField type="number" label="Samples" value={samples} onChange={e=>setSamples(Number(e.target.value))} fullWidth /></Grid>
                <Grid item xs={12} md={2}><TextField type="number" label="Timeout(s)" value={timeout} onChange={e=>setTimeoutVal(Number(e.target.value))} fullWidth /></Grid>
                {category==='storage' && scenario==='disk_io_issue' && (
                  <Grid item xs={12} md={4}><TextField label="Device" value={device} onChange={e=>setDevice(e.target.value)} fullWidth /></Grid>
                )}
                {category==='compute' && (scenario==='syscall_latency' || scenario==='cgroups_namespace') && (
                  <Grid item xs={12} md={3}><TextField label="PID (optional)" value={pid} onChange={e=>setPid(e.target.value)} fullWidth /></Grid>
                )}
                {(category==='compute' || category==='security') && (
                  <Grid item xs={12} md={3}><TextField label="Interface (optional)" value={iface} onChange={e=>setIface(e.target.value)} fullWidth /></Grid>
                )}
                {category==='container' && scenario==='image_pull_slow' && (
                  <Grid item xs={12} md={4}><TextField label="Image (optional)" value={image} onChange={e=>setImage(e.target.value)} fullWidth /></Grid>
                )}
                <Grid item xs={12} md={3}><Button variant="contained" onClick={gen}>Generate</Button></Grid>
              </Grid>
              <Box sx={{ mt:2 }}>
                {cmds.length>0 && (
                  <TableContainer component={Paper} sx={{ background:'rgba(255,255,255,0.06)' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Command</TableCell>
                          <TableCell>Purpose</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cmds.map((row, idx)=> (
                          <TableRow key={idx}>
                            <TableCell sx={{ fontFamily:'monospace' }}>{row.cmd}</TableCell>
                            <TableCell>{row.desc}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {(category==='k8s' && scenario==='kubeproxy_mode') && (
          <Grid item xs={12} md={12}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.06)' }}>
              <CardContent sx={{ p:3 }}>
                <Typography variant="h6">kube-proxy: iptables (nat) Parser</Typography>
                <Typography variant="body2" sx={{ opacity:.8, mb:1 }}>Paste output of <code>iptables-save -t nat</code> to build service/endpoint relations. Use commands above to collect data.</Typography>
                <Grid container spacing={2} sx={{ mb:1 }}>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel id="parser">Parser</InputLabel>
                      <Select labelId="parser" label="Parser" value={parserType} onChange={e=>setParserType(e.target.value as any)}>
                        <MenuItem value="iptables">iptables (nat)</MenuItem>
                        <MenuItem value="ipset">ipset</MenuItem>
                        <MenuItem value="ipvs">ipvsadm</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <BigText label="iptables-save -t nat output" value={parserInput} onChange={val=>{ setParserInput(val) }} onExecute={parseOutput} />
                <Box sx={{ mt:1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item>
                      <Button variant="contained" onClick={parseOutput}>Parse</Button>
                    </Grid>
                    <Grid item>
                      <ToggleButtonGroup size="small" value={parserView} exclusive onChange={(_,v)=>{ if (v) setParserView(v) }}>
                        <ToggleButton value="raw">Raw</ToggleButton>
                        <ToggleButton value="parsed">Parsed</ToggleButton>
                      </ToggleButtonGroup>
                    </Grid>
                  </Grid>
                </Box>
                {parserView==='parsed' && parsedRows.length>0 && (
                  <TableContainer component={Paper} sx={{ mt:2, background:'rgba(255,255,255,0.06)' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {parsedHeaders.map((h, idx)=>(<TableCell key={idx}>{h}</TableCell>))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {parsedRows.map((row, idx)=>(
                          <TableRow key={idx}>
                            {parsedHeaders.map((h, jdx)=>(<TableCell key={jdx} sx={{ fontFamily:'monospace' }}>{row[h]}</TableCell>))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                {parserView==='parsed' && (svcRows.length>0 || epRows.length>0) && (
                  <Box>
                    <TableContainer component={Paper} sx={{ mt:2, background:'rgba(255,255,255,0.06)' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Namespace/Service</TableCell>
                            <TableCell>ClusterIP</TableCell>
                            <TableCell>Port</TableCell>
                            <TableCell>NodePort</TableCell>
                            <TableCell>Chain</TableCell>
                            <TableCell>Endpoints</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {svcRows.map((s, idx)=> (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontFamily:'monospace' }}>{s.name}</TableCell>
                              <TableCell sx={{ fontFamily:'monospace' }}>{s.clusterIP || '-'}</TableCell>
                              <TableCell sx={{ fontFamily:'monospace' }}>{s.port || '-'}</TableCell>
                              <TableCell sx={{ fontFamily:'monospace' }}>{s.nodePort || '-'}</TableCell>
                              <TableCell sx={{ fontFamily:'monospace' }}>{s.chain}</TableCell>
                              <TableCell sx={{ fontFamily:'monospace' }}>{s.endpoints.length}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <TableContainer component={Paper} sx={{ mt:2, background:'rgba(255,255,255,0.06)' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Service Chain</TableCell>
                            <TableCell>Endpoint Chain</TableCell>
                            <TableCell>DNAT → IP:Port</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {epRows.map((e, idx)=> (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontFamily:'monospace' }}>{e.svcChain}</TableCell>
                              <TableCell sx={{ fontFamily:'monospace' }}>{e.sepChain}</TableCell>
                              <TableCell sx={{ fontFamily:'monospace' }}>{e.to || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
                {parserView==='raw' && (
                  <Box sx={{ mt:2, p:2, borderRadius:1, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.04)', fontFamily:'monospace', whiteSpace:'pre-wrap' }}>
                    {sanitize(parserInput)}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
        
      </Grid>
    </Container>
  )
}
