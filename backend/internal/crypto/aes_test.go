package crypto

import "testing"

func TestAESRoundTrip(t *testing.T) {
    key := make([]byte, 32)
    for i := range key { key[i] = byte(i) }
    nonce, ct, err := AesEncrypt(key, []byte("hello"))
    if err != nil { t.Fatalf("encrypt err: %v", err) }
    pt, err := AesDecrypt(key, nonce, ct)
    if err != nil { t.Fatalf("decrypt err: %v", err) }
    if string(pt) != "hello" { t.Fatal("mismatch") }
}