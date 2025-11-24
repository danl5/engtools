package crypto

import (
    "crypto/rand"
    "errors"
    "golang.org/x/crypto/chacha20poly1305"
)

func ChaChaEncrypt(key []byte, nonce []byte, plaintext []byte) (outNonce []byte, cipher []byte, err error) {
    aead, err := chacha20poly1305.New(key)
    if err != nil { return nil, nil, err }
    if nonce == nil || len(nonce) == 0 { nonce = make([]byte, chacha20poly1305.NonceSize); if _, err = rand.Read(nonce); err != nil { return nil, nil, err } }
    if len(nonce) != chacha20poly1305.NonceSize { return nil, nil, errors.New("invalid nonce length") }
    // additional data nil
    cipher = aead.Seal(nil, nonce, plaintext, nil)
    return nonce, cipher, nil
}

func ChaChaDecrypt(key []byte, nonce []byte, cipher []byte) ([]byte, error) {
    aead, err := chacha20poly1305.New(key)
    if err != nil { return nil, err }
    if len(nonce) != chacha20poly1305.NonceSize { return nil, errors.New("invalid nonce length") }
    return aead.Open(nil, nonce, cipher, nil)
}