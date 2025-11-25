package controller

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/tls"
	"crypto/x509"
	pkixpkg "crypto/x509/pkix"
	"encoding/base64"
	"encoding/pem"
	"net"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type CertParseReq struct {
	PEM string `json:"pem"`
	DER string `json:"der_base64"`
}

type CertInfo struct {
	Subject           string    `json:"subject"`
	Issuer            string    `json:"issuer"`
	Serial            string    `json:"serial"`
	NotBefore         time.Time `json:"not_before"`
	NotAfter          time.Time `json:"not_after"`
	DNS               []string  `json:"dns"`
	IP                []string  `json:"ip"`
	IsCA              bool      `json:"is_ca"`
	SigAlg            string    `json:"sig_alg"`
	KeyAlg            string    `json:"key_alg"`
	KeyBits           int       `json:"key_bits"`
	FingerprintSHA256 string    `json:"fingerprint_sha256"`
	SPKI_SHA256       string    `json:"spki_sha256"`
	KeyUsage          []string  `json:"key_usage"`
	ExtKeyUsage       []string  `json:"ext_key_usage"`
	OCSP              []string  `json:"ocsp"`
	IssuerURLs        []string  `json:"issuer_urls"`
	CRL               []string  `json:"crl"`
}

func CertParse() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CertParseReq
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "invalid input"})
			return
		}
		var certs []*x509.Certificate
		if req.PEM != "" {
			data := []byte(req.PEM)
			for {
				var block *pem.Block
				block, data = pem.Decode(data)
				if block == nil {
					break
				}
				if block.Type == "CERTIFICATE" {
					crt, err := x509.ParseCertificate(block.Bytes)
					if err == nil {
						certs = append(certs, crt)
					}
				}
			}
		} else if req.DER != "" {
			b, err := base64.StdEncoding.DecodeString(req.DER)
			if err != nil {
				c.JSON(400, gin.H{"error": "invalid der"})
				return
			}
			crt, err := x509.ParseCertificate(b)
			if err != nil {
				c.JSON(400, gin.H{"error": "parse failed"})
				return
			}
			certs = append(certs, crt)
		} else {
			c.JSON(400, gin.H{"error": "no input"})
			return
		}
		if len(certs) == 0 {
			c.JSON(400, gin.H{"error": "no certificates"})
			return
		}
		out := make([]CertInfo, 0, len(certs))
		for _, crt := range certs {
			fp := sha256.Sum256(crt.Raw)
			spki := sha256.Sum256(crt.RawSubjectPublicKeyInfo)
			info := CertInfo{
				Subject: crt.Subject.String(), Issuer: crt.Issuer.String(), Serial: crt.SerialNumber.String(),
				NotBefore: crt.NotBefore, NotAfter: crt.NotAfter, IsCA: crt.IsCA, SigAlg: crt.SignatureAlgorithm.String(),
				FingerprintSHA256: base64.StdEncoding.EncodeToString(fp[:]), SPKI_SHA256: base64.StdEncoding.EncodeToString(spki[:]),
			}
			for _, d := range crt.DNSNames {
				info.DNS = append(info.DNS, d)
			}
			for _, ip := range crt.IPAddresses {
				info.IP = append(info.IP, ip.String())
			}
			switch crt.PublicKeyAlgorithm {
			case x509.RSA:
				info.KeyAlg = "RSA"
				if pk, ok := crt.PublicKey.(*rsa.PublicKey); ok {
					info.KeyBits = pk.Size() * 8
				}
			case x509.ECDSA:
				info.KeyAlg = "EC"
			case x509.Ed25519:
				info.KeyAlg = "Ed25519"
			default:
				info.KeyAlg = crt.PublicKeyAlgorithm.String()
			}
			// KeyUsage mapping
			ku := crt.KeyUsage
			var kus []string
			if ku&x509.KeyUsageDigitalSignature != 0 {
				kus = append(kus, "DigitalSignature")
			}
			if ku&x509.KeyUsageContentCommitment != 0 {
				kus = append(kus, "ContentCommitment")
			}
			if ku&x509.KeyUsageKeyEncipherment != 0 {
				kus = append(kus, "KeyEncipherment")
			}
			if ku&x509.KeyUsageDataEncipherment != 0 {
				kus = append(kus, "DataEncipherment")
			}
			if ku&x509.KeyUsageKeyAgreement != 0 {
				kus = append(kus, "KeyAgreement")
			}
			if ku&x509.KeyUsageCertSign != 0 {
				kus = append(kus, "CertSign")
			}
			if ku&x509.KeyUsageCRLSign != 0 {
				kus = append(kus, "CRLSign")
			}
			if ku&x509.KeyUsageEncipherOnly != 0 {
				kus = append(kus, "EncipherOnly")
			}
			if ku&x509.KeyUsageDecipherOnly != 0 {
				kus = append(kus, "DecipherOnly")
			}
			info.KeyUsage = kus
			// ExtKeyUsage mapping
			var ekus []string
			for _, e := range crt.ExtKeyUsage {
				switch e {
				case x509.ExtKeyUsageAny:
					ekus = append(ekus, "Any")
				case x509.ExtKeyUsageServerAuth:
					ekus = append(ekus, "ServerAuth")
				case x509.ExtKeyUsageClientAuth:
					ekus = append(ekus, "ClientAuth")
				case x509.ExtKeyUsageCodeSigning:
					ekus = append(ekus, "CodeSigning")
				case x509.ExtKeyUsageEmailProtection:
					ekus = append(ekus, "EmailProtection")
				case x509.ExtKeyUsageIPSECTunnel:
					ekus = append(ekus, "IPSECTunnel")
				case x509.ExtKeyUsageIPSECUser:
					ekus = append(ekus, "IPSECUser")
				case x509.ExtKeyUsageTimeStamping:
					ekus = append(ekus, "TimeStamping")
				case x509.ExtKeyUsageOCSPSigning:
					ekus = append(ekus, "OCSPSigning")
				default:
					ekus = append(ekus, "Unknown")
				}
			}
			info.ExtKeyUsage = ekus
			info.OCSP = crt.OCSPServer
			info.IssuerURLs = crt.IssuingCertificateURL
			info.CRL = crt.CRLDistributionPoints
			out = append(out, info)
		}
		c.JSON(200, gin.H{"certs": out})
	}
}

type CertVerifyReq struct {
	ChainPEM   []string `json:"chain_pem"`
	RootsPEM   []string `json:"roots_pem"`
	ServerName string   `json:"server_name"`
}

func CertVerify() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CertVerifyReq
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "invalid input"})
			return
		}
		if len(req.ChainPEM) == 0 {
			c.JSON(400, gin.H{"error": "empty chain"})
			return
		}
		parseOne := func(p string) (*x509.Certificate, error) {
			data := []byte(p)
			for {
				var block *pem.Block
				block, data = pem.Decode(data)
				if block == nil {
					break
				}
				if block.Type == "CERTIFICATE" {
					return x509.ParseCertificate(block.Bytes)
				}
			}
			return nil, x509.IncorrectPasswordError
		}
		leaf, err := parseOne(req.ChainPEM[0])
		if err != nil {
			c.JSON(400, gin.H{"error": "leaf parse failed"})
			return
		}
		inter := x509.NewCertPool()
		for _, p := range req.ChainPEM[1:] {
			inter.AppendCertsFromPEM([]byte(p))
		}
		var roots *x509.CertPool
		if len(req.RootsPEM) > 0 {
			roots = x509.NewCertPool()
			for _, p := range req.RootsPEM {
				roots.AppendCertsFromPEM([]byte(p))
			}
		} else {
			rp, _ := x509.SystemCertPool()
			roots = rp
		}
		opts := x509.VerifyOptions{Intermediates: inter, Roots: roots}
		if req.ServerName != "" {
			opts.DNSName = req.ServerName
		}
		chains, err := leaf.Verify(opts)
		if err != nil {
			c.JSON(200, gin.H{"ok": false, "error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"ok": true, "chains": len(chains)})
	}
}

type TLSInspectReq struct {
	Host string `json:"host"`
	Port int    `json:"port"`
}

func TLSInspect() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req TLSInspectReq
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "invalid input"})
			return
		}
		if req.Host == "" {
			c.JSON(400, gin.H{"error": "host required"})
			return
		}
		if req.Port == 0 {
			req.Port = 443
		}
		d := &net.Dialer{Timeout: 5 * time.Second}
		var conn *tls.Conn
		var err error
		// Resolve IPs and try IPv4 first, then IPv6
		ips, rErr := net.LookupIP(req.Host)
		if rErr != nil {
			c.JSON(400, gin.H{"error": rErr.Error()})
			return
		}
		var errs []string
		for _, ip := range ips {
			network := "tcp"
			if ip.To4() != nil {
				network = "tcp4"
			} else {
				network = "tcp6"
			}
			addr := net.JoinHostPort(ip.String(), strconv.Itoa(req.Port))
			conn, err = tls.DialWithDialer(d, network, addr, &tls.Config{ServerName: req.Host})
			if err == nil {
				break
			}
			errs = append(errs, ip.String()+": "+err.Error())
		}
		if conn == nil {
			c.JSON(400, gin.H{"error": "dial failed: " + strings.Join(errs, "; ")})
			return
		}
		state := conn.ConnectionState()
		conn.Close()
		var infos []CertInfo
		for _, crt := range state.PeerCertificates {
			fp := sha256.Sum256(crt.Raw)
			spki := sha256.Sum256(crt.RawSubjectPublicKeyInfo)
			info := CertInfo{Subject: crt.Subject.String(), Issuer: crt.Issuer.String(), Serial: crt.SerialNumber.String(), NotBefore: crt.NotBefore, NotAfter: crt.NotAfter, IsCA: crt.IsCA, SigAlg: crt.SignatureAlgorithm.String(), FingerprintSHA256: base64.StdEncoding.EncodeToString(fp[:]), SPKI_SHA256: base64.StdEncoding.EncodeToString(spki[:])}
			for _, d := range crt.DNSNames {
				info.DNS = append(info.DNS, d)
			}
			for _, ip := range crt.IPAddresses {
				info.IP = append(info.IP, ip.String())
			}
			infos = append(infos, info)
		}
		if len(infos) == 0 {
			c.JSON(400, gin.H{"error": "no peer certificates"})
			return
		}
		c.JSON(200, gin.H{"tls_version": state.Version, "cipher_suite": state.CipherSuite, "certs": infos})
	}
}

type CSRReq struct {
	CN      string   `json:"cn"`
	O       string   `json:"o"`
	OU      string   `json:"ou"`
	L       string   `json:"l"`
	ST      string   `json:"st"`
	C       string   `json:"c"`
	SAN_DNS []string `json:"san_dns"`
	KeyType string   `json:"key_type"` // rsa/ec
	Bits    int      `json:"bits"`
	Curve   string   `json:"curve"`
}

func CSRGenerate() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CSRReq
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "invalid input"})
			return
		}
		var priv interface{}
		var err error
		if req.KeyType == "ec" {
			curve := elliptic.P256()
			if req.Curve == "P384" {
				curve = elliptic.P384()
			}
			if req.Curve == "P521" {
				curve = elliptic.P521()
			}
			priv, err = ecdsa.GenerateKey(curve, rand.Reader)
		} else {
			bits := req.Bits
			if bits == 0 {
				bits = 2048
			}
			priv, err = rsa.GenerateKey(rand.Reader, bits)
		}
		if err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		template := x509.CertificateRequest{
			Subject:  pkixName(req),
			DNSNames: req.SAN_DNS,
		}
		csrDER, err := x509.CreateCertificateRequest(rand.Reader, &template, priv)
		if err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		csrPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE REQUEST", Bytes: csrDER})
		pk, err := x509.MarshalPKCS8PrivateKey(priv)
		if err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		keyPEM := pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: pk})
		c.JSON(200, gin.H{"csr": string(csrPEM), "private_key": string(keyPEM)})
	}
}

func pkixName(req CSRReq) pkixpkg.Name {
	return pkixpkg.Name{CommonName: req.CN, Organization: nonEmpty(req.O), OrganizationalUnit: nonEmpty(req.OU), Locality: nonEmpty(req.L), Province: nonEmpty(req.ST), Country: nonEmpty(req.C)}
}
func nonEmpty(s string) []string {
	if s == "" {
		return nil
	}
	return []string{s}
}

type ConvertReq struct {
	PEM string `json:"pem"`
	DER string `json:"der_base64"`
}

func CertToDER() gin.HandlerFunc {
	return func(c *gin.Context) {
		var r ConvertReq
		if err := c.ShouldBindJSON(&r); err != nil {
			c.JSON(400, gin.H{"error": "invalid"})
			return
		}
		if r.PEM == "" {
			c.JSON(400, gin.H{"error": "pem required"})
			return
		}
		block, _ := pem.Decode([]byte(r.PEM))
		if block == nil {
			c.JSON(400, gin.H{"error": "no pem"})
			return
		}
		c.JSON(200, gin.H{"der_base64": base64.StdEncoding.EncodeToString(block.Bytes)})
	}
}
func CertToPEM() gin.HandlerFunc {
	return func(c *gin.Context) {
		var r ConvertReq
		if err := c.ShouldBindJSON(&r); err != nil {
			c.JSON(400, gin.H{"error": "invalid"})
			return
		}
		if r.DER == "" {
			c.JSON(400, gin.H{"error": "der required"})
			return
		}
		b, err := base64.StdEncoding.DecodeString(r.DER)
		if err != nil {
			c.JSON(400, gin.H{"error": "decode failed"})
			return
		}
		pemBytes := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: b})
		c.JSON(200, gin.H{"pem": string(pemBytes)})
	}
}
