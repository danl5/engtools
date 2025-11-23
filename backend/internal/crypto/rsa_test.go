package crypto

import "testing"

func TestRSARoundTrip(t *testing.T) {
    privPEM, pubPEM, err := RsaGenerate(2048)
    if err != nil { t.Fatalf("gen err: %v", err) }
    priv, err := ParseRSAPrivateKey(privPEM)
    if err != nil { t.Fatalf("parse priv: %v", err) }
    pub, err := ParseRSAPublicKey(pubPEM)
    if err != nil { t.Fatalf("parse pub: %v", err) }
    ct, err := RsaEncrypt(pub, []byte("hello"))
    if err != nil { t.Fatalf("enc err: %v", err) }
    pt, err := RsaDecrypt(priv, ct)
    if err != nil { t.Fatalf("dec err: %v", err) }
    if string(pt) != "hello" { t.Fatal("mismatch") }
}