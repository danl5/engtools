package crypto

import (
    "crypto/rand"
    "crypto/rsa"
    "crypto/sha256"
    "crypto/x509"
    "encoding/pem"
)

func RsaGenerate(bits int) (privPEM []byte, pubPEM []byte, err error) {
    key, err := rsa.GenerateKey(rand.Reader, bits)
    if err != nil {
        return nil, nil, err
    }
    priv := x509.MarshalPKCS1PrivateKey(key)
    privPEM = pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: priv})
    pub := x509.MarshalPKCS1PublicKey(&key.PublicKey)
    pubPEM = pem.EncodeToMemory(&pem.Block{Type: "RSA PUBLIC KEY", Bytes: pub})
    return privPEM, pubPEM, nil
}

func RsaEncrypt(pub *rsa.PublicKey, data []byte) ([]byte, error) {
    return rsa.EncryptOAEP(sha256.New(), rand.Reader, pub, data, nil)
}

func RsaDecrypt(priv *rsa.PrivateKey, data []byte) ([]byte, error) {
    return rsa.DecryptOAEP(sha256.New(), rand.Reader, priv, data, nil)
}

func ParseRSAPrivateKey(pemBytes []byte) (*rsa.PrivateKey, error) {
    block, _ := pem.Decode(pemBytes)
    return x509.ParsePKCS1PrivateKey(block.Bytes)
}

func ParseRSAPublicKey(pemBytes []byte) (*rsa.PublicKey, error) {
    block, _ := pem.Decode(pemBytes)
    return x509.ParsePKCS1PublicKey(block.Bytes)
}