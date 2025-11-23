package service

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "time"
    "engtools/backend/internal/config"
)

type GeoService struct {
    token string
    client *http.Client
}

func NewGeoService(cfg *config.Config) *GeoService {
    return &GeoService{token: cfg.IPInfoToken, client: &http.Client{Timeout: 1500 * time.Millisecond}}
}

type IPInfoResp struct {
    IP       string `json:"ip"`
    Hostname string `json:"hostname"`
    City     string `json:"city"`
    Region   string `json:"region"`
    Country  string `json:"country"`
    Loc      string `json:"loc"`
    Org      string `json:"org"`
    Postal   string `json:"postal"`
    Timezone string `json:"timezone"`
    Anycast  bool   `json:"anycast"`
}

type GeoResult struct {
    IP        string  `json:"ip"`
    Hostname  string  `json:"hostname"`
    City      string  `json:"city"`
    Region    string  `json:"region"`
    Country   string  `json:"country"`
    CountryCode string `json:"country_code"`
    Latitude  float64 `json:"latitude"`
    Longitude float64 `json:"longitude"`
    Org       string  `json:"org"`
    ASN       string  `json:"asn"`
    Postal    string  `json:"postal"`
    Timezone  string  `json:"timezone"`
    Anycast   bool    `json:"anycast"`
    Source    string  `json:"source"`
}

func (s *GeoService) Lookup(ctx context.Context, ip string) (*GeoResult, error) {
    url := fmt.Sprintf("https://ipinfo.io/%s", ip)
    if s.token != "" { url = url + "?token=" + s.token }
    req, _ := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
    req.Header.Set("Accept", "application/json")
    resp, err := s.client.Do(req)
    if err != nil { return nil, err }
    defer resp.Body.Close()
    if resp.StatusCode >= 300 { return nil, fmt.Errorf("ipinfo status %d", resp.StatusCode) }
    var r IPInfoResp
    if err := json.NewDecoder(resp.Body).Decode(&r); err != nil { return nil, err }
    var lat, lon float64
    if r.Loc != "" {
        // parse "lat,lon"
        var a, b float64
        fmt.Sscanf(r.Loc, "%f,%f", &a, &b)
        lat, lon = a, b
    }
    asn := ""
    // org like "AS15169 Google LLC"
    if len(r.Org) > 2 && r.Org[:2] == "AS" {
        // read up to first space
        for i := 2; i < len(r.Org); i++ {
            if r.Org[i] == ' ' { asn = r.Org[:i]; break }
        }
    }
    return &GeoResult{
        IP: r.IP,
        Hostname: r.Hostname,
        City: r.City,
        Region: r.Region,
        Country: countryName(r.Country),
        CountryCode: r.Country,
        Latitude: lat,
        Longitude: lon,
        Org: r.Org,
        ASN: asn,
        Postal: r.Postal,
        Timezone: r.Timezone,
        Anycast: r.Anycast,
        Source: "ipinfo",
    }, nil
}

func countryName(code string) string {
    // minimal mapping fallback: return code for now; client can interpret code
    return code
}