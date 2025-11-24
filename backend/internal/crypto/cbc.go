package crypto

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "errors"
)

func pkcs7Pad(b []byte, blockSize int) []byte {
    pad := blockSize - (len(b) % blockSize)
    out := make([]byte, len(b)+pad)
    copy(out, b)
    for i := len(b); i < len(out); i++ { out[i] = byte(pad) }
    return out
}
func pkcs7Unpad(b []byte) ([]byte, error) {
    if len(b) == 0 { return nil, errors.New("invalid padding") }
    pad := int(b[len(b)-1])
    if pad <= 0 || pad > len(b) { return nil, errors.New("invalid padding") }
    for i := len(b)-pad; i < len(b); i++ { if b[i] != byte(pad) { return nil, errors.New("invalid padding") } }
    return b[:len(b)-pad], nil
}

// AesCbcEncrypt encrypts with AES-CBC, auto-generates IV when iv==nil
func AesCbcEncrypt(key []byte, iv []byte, plaintext []byte) (outIV []byte, cipherText []byte, err error) {
    block, err := aes.NewCipher(key)
    if err != nil { return nil, nil, err }
    if iv == nil || len(iv) == 0 { iv = make([]byte, block.BlockSize()); if _, err = rand.Read(iv); err != nil { return nil, nil, err } }
    if len(iv) != block.BlockSize() { return nil, nil, errors.New("invalid iv length") }
    p := pkcs7Pad(plaintext, block.BlockSize())
    cipherText = make([]byte, len(p))
    mode := cipher.NewCBCEncrypter(block, iv)
    mode.CryptBlocks(cipherText, p)
    return iv, cipherText, nil
}

func AesCbcDecrypt(key []byte, iv []byte, cipherText []byte) ([]byte, error) {
    block, err := aes.NewCipher(key)
    if err != nil { return nil, err }
    if len(iv) != block.BlockSize() { return nil, errors.New("invalid iv length") }
    if len(cipherText)%block.BlockSize() != 0 { return nil, errors.New("invalid cipher length") }
    p := make([]byte, len(cipherText))
    mode := cipher.NewCBCDecrypter(block, iv)
    mode.CryptBlocks(p, cipherText)
    return pkcs7Unpad(p)
}