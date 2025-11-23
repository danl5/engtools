package crypto

import (
    "crypto/sha1"
    "crypto/sha256"
    "crypto/sha512"
)

func SHAHash(alg string, data []byte) []byte {
    switch alg {
    case "sha1":
        h := sha1.Sum(data)
        return h[:]
    case "sha512":
        h := sha512.Sum512(data)
        return h[:]
    default:
        h := sha256.Sum256(data)
        return h[:]
    }
}