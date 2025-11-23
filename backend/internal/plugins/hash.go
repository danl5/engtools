package plugins

import (
    "crypto/sha1"
    "crypto/sha256"
    "crypto/sha512"
)

type HashProvider interface {
    Name() string
    Hash(data []byte) []byte
}

var hashProviders = map[string]HashProvider{}

func RegisterHash(p HashProvider) { hashProviders[p.Name()] = p }
func GetHash(name string) HashProvider { return hashProviders[name] }

type sha1Provider struct{}
func (sha1Provider) Name() string { return "sha1" }
func (sha1Provider) Hash(d []byte) []byte { h := sha1.Sum(d); return h[:] }

type sha256Provider struct{}
func (sha256Provider) Name() string { return "sha256" }
func (sha256Provider) Hash(d []byte) []byte { h := sha256.Sum256(d); return h[:] }

type sha512Provider struct{}
func (sha512Provider) Name() string { return "sha512" }
func (sha512Provider) Hash(d []byte) []byte { h := sha512.Sum512(d); return h[:] }

func init() {
    RegisterHash(sha1Provider{})
    RegisterHash(sha256Provider{})
    RegisterHash(sha512Provider{})
}