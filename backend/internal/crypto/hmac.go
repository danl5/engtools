package crypto

import (
    "crypto/hmac"
    "crypto/sha1"
    "crypto/sha256"
    "crypto/sha512"
    "hash"
)

func HMAC(alg string, key []byte, data []byte) []byte {
    var hf func() hash.Hash
    switch alg {
    case "sha1":
        hf = sha1.New
    case "sha512":
        hf = sha512.New
    default:
        hf = sha256.New
    }
    mac := hmac.New(hf, key)
    mac.Write(data)
    return mac.Sum(nil)
}