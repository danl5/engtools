package crypto

import "testing"

func TestSHA(t *testing.T) {
    if len(SHAHash("sha1", []byte("a"))) == 0 { t.Fatal("sha1") }
    if len(SHAHash("sha256", []byte("a"))) == 0 { t.Fatal("sha256") }
    if len(SHAHash("sha512", []byte("a"))) == 0 { t.Fatal("sha512") }
}