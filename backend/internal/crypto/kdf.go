package crypto

import (
    "crypto/rand"
    "errors"
    "golang.org/x/crypto/pbkdf2"
    "golang.org/x/crypto/scrypt"
    "crypto/sha1"
    "crypto/sha256"
    "crypto/sha512"
)

func PBKDF2(password []byte, salt []byte, iter int, dkLen int, alg string) (outSalt []byte, key []byte, err error) {
    if salt == nil || len(salt) == 0 { salt = make([]byte, 16); if _, err = rand.Read(salt); err != nil { return nil, nil, err } }
    switch alg {
    case "sha1":
        key = pbkdf2.Key(password, salt, iter, dkLen, sha1.New)
    case "sha512":
        key = pbkdf2.Key(password, salt, iter, dkLen, sha512.New)
    default:
        key = pbkdf2.Key(password, salt, iter, dkLen, sha256.New)
    }
    return salt, key, nil
}

func Scrypt(password []byte, salt []byte, N, r, p, dkLen int) (outSalt []byte, key []byte, err error) {
    if salt == nil || len(salt) == 0 { salt = make([]byte, 16); if _, err = rand.Read(salt); err != nil { return nil, nil, err } }
    if N <= 0 || r <= 0 || p <= 0 { return nil, nil, errors.New("invalid scrypt params") }
    key, err = scrypt.Key(password, salt, N, r, p, dkLen)
    if err != nil { return nil, nil, err }
    return salt, key, nil
}