package controller

import (
    "bufio"
    "context"
    "encoding/base64"
    "fmt"
    "github.com/gin-gonic/gin"
    "engtools/backend/internal/service"
    "net"
    "net/url"
    "regexp"
    "strings"
    "time"
)

type StringBytesRequest struct {
    Value string `json:"value" binding:"required"`
}

func BytesToString() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req StringBytesRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{"error": "invalid input"})
            return
        }
        c.JSON(200, gin.H{"string": string([]byte(req.Value))})
    }
}

func StringToBytes() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req StringBytesRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{"error": "invalid input"})
            return
        }
        c.JSON(200, gin.H{"bytes": []byte(req.Value)})
    }
}

type Base64Request struct {
    Value string `json:"value" binding:"required"`
}

func Base64Encode() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req Base64Request
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{"error": "invalid input"})
            return
        }
        c.JSON(200, gin.H{"base64": base64.StdEncoding.EncodeToString([]byte(req.Value))})
    }
}

func Base64Decode() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req Base64Request
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{"error": "invalid input"})
            return
        }
        b, err := base64.StdEncoding.DecodeString(req.Value)
        if err != nil {
            c.JSON(400, gin.H{"error": "invalid base64"})
            return
        }
        c.JSON(200, gin.H{"text": string(b)})
    }
}

func IPGeo(geo *service.GeoService) gin.HandlerFunc {
    return func(c *gin.Context) {
        ip := c.Query("ip")
        if ip == "" { ip = c.ClientIP() }
        ctx, cancel := context.WithTimeout(c.Request.Context(), 1500_000_000)
        defer cancel()
        res, err := geo.Lookup(ctx, ip)
        if err != nil { c.JSON(502, gin.H{"error": err.Error()}); return }
        c.JSON(200, res)
    }
}

// DNSResolve resolves common DNS record types and returns a normalized answer list
// GET /api/v1/tools/dns/resolve?name=example.com&type=A
func DNSResolve() gin.HandlerFunc {
    return func(c *gin.Context) {
        name := sanitizeHost(c.Query("name"))
        typ := strings.ToUpper(strings.TrimSpace(c.Query("type")))
        if name == "" { c.JSON(400, gin.H{"error": "name required"}); return }
        if typ == "" { typ = "A" }
        resolver := &net.Resolver{}
        ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
        defer cancel()
        answers := make([]gin.H, 0)
        switch typ {
        case "A", "AAAA":
            ips, err := resolver.LookupIP(ctx, typ, name)
            if err != nil { c.JSON(200, gin.H{"answers": answers}); return }
            for _, ip := range ips { answers = append(answers, gin.H{"name": name, "type": typ, "ttl": 0, "data": ip.String()}) }
        case "CNAME":
            cname, err := resolver.LookupCNAME(ctx, name)
            if err == nil { answers = append(answers, gin.H{"name": name, "type": "CNAME", "ttl": 0, "data": cname}) }
        case "MX":
            mxs, err := resolver.LookupMX(ctx, name)
            if err == nil { for _, mx := range mxs { answers = append(answers, gin.H{"name": name, "type": "MX", "ttl": 0, "data": fmt.Sprintf("%d %s", mx.Pref, mx.Host)}) } }
        case "TXT":
            txts, err := resolver.LookupTXT(ctx, name)
            if err == nil { for _, t := range txts { answers = append(answers, gin.H{"name": name, "type": "TXT", "ttl": 0, "data": t}) } }
        case "NS":
            nss, err := resolver.LookupNS(ctx, name)
            if err == nil { for _, ns := range nss { answers = append(answers, gin.H{"name": name, "type": "NS", "ttl": 0, "data": ns.Host}) } }
        default:
            c.JSON(400, gin.H{"error": "unsupported type"}); return
        }
        c.JSON(200, gin.H{"answers": answers})
    }
}

// DomainWhois performs WHOIS over port 43 with basic referral handling
// GET /api/v1/tools/domain/whois?name=example.com
func DomainWhois() gin.HandlerFunc {
    return func(c *gin.Context) {
        name := sanitizeHost(c.Query("name"))
        if name == "" { c.JSON(400, gin.H{"error": "name required"}); return }
        server := whoisServerFor(name)
        ctx, cancel := context.WithTimeout(c.Request.Context(), 8*time.Second)
        defer cancel()
        text, err := whoisQuery(ctx, server, name)
        if err != nil { c.JSON(502, gin.H{"error": err.Error()}); return }
        // try registrar referral if present
        ref := parseReferralServer(text)
        if ref != "" {
            if t2, err2 := whoisQuery(ctx, ref, name); err2 == nil {
                text = text + "\n\n--- Referral ---\n" + t2
            }
        }
        cleaned := cleanWhoisText(text)
        info := parseWhoisInfo(cleaned)
        info.Name = name
        info.Server = server
        c.JSON(200, info)
    }
}

func sanitizeHost(s string) string {
    h := strings.TrimSpace(s)
    if h == "" { return "" }
    if strings.HasPrefix(h, "http://") || strings.HasPrefix(h, "https://") {
        if u, err := url.Parse(h); err == nil { h = u.Host } else { h = strings.TrimPrefix(strings.TrimPrefix(h, "http://"), "https://") }
    }
    if strings.Contains(h, "/") { h = strings.Split(h, "/")[0] }
    if strings.Contains(h, ":") { h = strings.Split(h, ":")[0] }
    return h
}

func whoisServerFor(name string) string {
    parts := strings.Split(name, ".")
    if len(parts) < 2 { return "whois.iana.org" }
    tld := strings.ToLower(parts[len(parts)-1])
    switch tld {
    case "com", "net":
        return "whois.verisign-grs.com"
    case "org":
        return "whois.pir.org"
    case "io":
        return "whois.nic.io"
    default:
        // discover via IANA
        if s, err := whoisQuery(context.Background(), "whois.iana.org", tld); err == nil {
            if sv := parseWhoisServer(s); sv != "" { return sv }
        }
        return "whois.iana.org"
    }
}

func parseWhoisServer(resp string) string {
    for _, line := range strings.Split(resp, "\n") {
        if strings.HasPrefix(strings.ToLower(strings.TrimSpace(line)), "whois:") {
            return strings.TrimSpace(strings.TrimPrefix(line, "whois:"))
        }
    }
    return ""
}
func parseReferralServer(resp string) string {
    for _, line := range strings.Split(resp, "\n") {
        ls := strings.ToLower(strings.TrimSpace(line))
        if strings.HasPrefix(ls, "registrar whois server:") {
            return strings.TrimSpace(strings.TrimPrefix(line, "Registrar WHOIS Server:"))
        }
        if strings.HasPrefix(ls, "whois server:") {
            return strings.TrimSpace(strings.TrimPrefix(line, "Whois Server:"))
        }
    }
    return ""
}

func whoisQuery(ctx context.Context, server, query string) (string, error) {
    d := &net.Dialer{Timeout: 5 * time.Second}
    conn, err := d.DialContext(ctx, "tcp", net.JoinHostPort(server, "43"))
    if err != nil { return "", err }
    defer conn.Close()
    // some servers require special query format, default is just the name
    if _, err = conn.Write([]byte(query + "\r\n")); err != nil { return "", err }
    rd := bufio.NewReader(conn)
    var b strings.Builder
    for {
        line, err := rd.ReadString('\n')
        if line != "" { b.WriteString(line) }
        if err != nil { break }
    }
    return b.String(), nil
}

type WhoisInfo struct {
    Server      string   `json:"server"`
    Name        string   `json:"name"`
    Registrar   string   `json:"registrar"`
    RegistrarURL string  `json:"registrar_url"`
    Updated     string   `json:"updated"`
    Created     string   `json:"created"`
    Expires     string   `json:"expires"`
    Status      []string `json:"status"`
    NameServers []string `json:"name_servers"`
}

func cleanWhoisText(s string) string {
    lines := strings.Split(s, "\n")
    out := make([]string, 0, len(lines))
    skipPrefixes := []string{"%", "#", ">>>", "NOTICE", "TERMS OF USE", "The Registry", "For more information"}
    for _, ln := range lines {
        t := strings.TrimSpace(ln)
        if t == "" { continue }
        low := strings.ToLower(t)
        skip := false
        for _, p := range skipPrefixes {
            if strings.HasPrefix(t, p) { skip = true; break }
        }
        if strings.HasPrefix(low, "query rate") || strings.HasPrefix(low, "whois server version") {
            skip = true
        }
        if !skip { out = append(out, ln) }
    }
    return strings.Join(out, "\n")
}

func parseWhoisInfo(s string) WhoisInfo {
    info := WhoisInfo{}
    lines := strings.Split(s, "\n")
    reKV := regexp.MustCompile(`^\s*([A-Za-z0-9 ._-]+):\s*(.+)$`)
    for _, ln := range lines {
        m := reKV.FindStringSubmatch(ln)
        if m == nil { continue }
        key := strings.ToLower(strings.TrimSpace(m[1]))
        val := strings.TrimSpace(m[2])
        switch key {
        case "domain name", "domain":
            info.Name = val
        case "registrar", "sponsoring registrar":
            info.Registrar = val
        case "registrar url":
            info.RegistrarURL = val
        case "updated date", "last updated", "last update":
            info.Updated = val
        case "creation date", "created":
            info.Created = val
        case "registry expiry date", "expiration date", "expires", "expiry date":
            info.Expires = val
        case "domain status", "status":
            info.Status = append(info.Status, val)
        case "name server", "nserver":
            info.NameServers = append(info.NameServers, strings.Fields(val)[0])
        }
    }
    // dedupe name servers
    if len(info.NameServers) > 1 {
        seen := map[string]struct{}{}
        ns := make([]string, 0, len(info.NameServers))
        for _, n := range info.NameServers { if _, ok := seen[n]; !ok { seen[n] = struct{}{}; ns = append(ns, n) } }
        info.NameServers = ns
    }
    return info
}