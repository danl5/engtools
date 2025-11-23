package crypto

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "errors"
    "io"
)

func AesEncrypt(key []byte, plaintext []byte) (nonce []byte, ciphertext []byte, err error) {
    if len(key) != 32 {
        return nil, nil, errors.New("key length must be 32 bytes")
    }
    block, err := aes.NewCipher(key)
    if err != nil {
        return nil, nil, err
    }
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return nil, nil, err
    }
    nonce = make([]byte, gcm.NonceSize())
    if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
        return nil, nil, err
    }
    ciphertext = gcm.Seal(nil, nonce, plaintext, nil)
    return nonce, ciphertext, nil
}

func AesDecrypt(key []byte, nonce []byte, ciphertext []byte) ([]byte, error) {
    if len(key) != 32 {
        return nil, errors.New("key length must be 32 bytes")
    }
    block, err := aes.NewCipher(key)
    if err != nil {
        return nil, err
    }
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return nil, err
    }
    return gcm.Open(nil, nonce, ciphertext, nil)
}