package controller

import (
    "encoding/base64"
    "engtools/backend/internal/crypto"
    "engtools/backend/internal/plugins"
    "github.com/gin-gonic/gin"
)

type AesReq struct {
    Key       string `json:"key" binding:"required"`
    Plaintext string `json:"plaintext"`
    Nonce     string `json:"nonce"`
    Cipher    string `json:"cipher"`
}

func AesEncrypt() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req AesReq
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{"error": "invalid input"})
            return
        }
        key, err := base64.StdEncoding.DecodeString(req.Key)
        if err != nil {
            c.JSON(400, gin.H{"error": "invalid key"})
            return
        }
        nonce, cipher, err := crypto.AesEncrypt(key, []byte(req.Plaintext))
        if err != nil {
            c.JSON(400, gin.H{"error": err.Error()})
            return
        }
        c.JSON(200, gin.H{"nonce": base64.StdEncoding.EncodeToString(nonce), "cipher": base64.StdEncoding.EncodeToString(cipher)})
    }
}

func AesDecrypt() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req AesReq
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{"error": "invalid input"})
            return
        }
        key, err := base64.StdEncoding.DecodeString(req.Key)
        if err != nil {
            c.JSON(400, gin.H{"error": "invalid key"})
            return
        }
        nonce, err := base64.StdEncoding.DecodeString(req.Nonce)
        if err != nil {
            c.JSON(400, gin.H{"error": "invalid nonce"})
            return
        }
        cipher, err := base64.StdEncoding.DecodeString(req.Cipher)
        if err != nil {
            c.JSON(400, gin.H{"error": "invalid cipher"})
            return
        }
        pt, err := crypto.AesDecrypt(key, nonce, cipher)
        if err != nil {
            c.JSON(400, gin.H{"error": err.Error()})
            return
        }
        c.JSON(200, gin.H{"plaintext": string(pt)})
    }
}

type RSAReqGenerate struct {
    Bits int `json:"bits" binding:"required,min=1024"`
}

func RsaGenerate() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req RSAReqGenerate
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{"error": "invalid input"})
            return
        }
        priv, pub, err := crypto.RsaGenerate(req.Bits)
        if err != nil {
            c.JSON(400, gin.H{"error": err.Error()})
            return
        }
        c.JSON(200, gin.H{"private": base64.StdEncoding.EncodeToString(priv), "public": base64.StdEncoding.EncodeToString(pub)})
    }
}

type RSAReqCrypt struct {
    Key   string `json:"key" binding:"required"`
    Data  string `json:"data" binding:"required"`
}

func RsaEncrypt() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req RSAReqCrypt
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{"error": "invalid input"})
            return
        }
        keyBytes, err := base64.StdEncoding.DecodeString(req.Key)
        if err != nil {
            c.JSON(400, gin.H{"error": "invalid key"})
            return
        }
        pub, err := crypto.ParseRSAPublicKey(keyBytes)
        if err != nil {
            c.JSON(400, gin.H{"error": "key parse failed"})
            return
        }
        ct, err := crypto.RsaEncrypt(pub, []byte(req.Data))
        if err != nil {
            c.JSON(400, gin.H{"error": err.Error()})
            return
        }
        c.JSON(200, gin.H{"cipher": base64.StdEncoding.EncodeToString(ct)})
    }
}

func RsaDecrypt() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req RSAReqCrypt
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{"error": "invalid input"})
            return
        }
        keyBytes, err := base64.StdEncoding.DecodeString(req.Key)
        if err != nil {
            c.JSON(400, gin.H{"error": "invalid key"})
            return
        }
        priv, err := crypto.ParseRSAPrivateKey(keyBytes)
        if err != nil {
            c.JSON(400, gin.H{"error": "key parse failed"})
            return
        }
        dataBytes, err := base64.StdEncoding.DecodeString(req.Data)
        if err != nil {
            c.JSON(400, gin.H{"error": "invalid cipher"})
            return
        }
        pt, err := crypto.RsaDecrypt(priv, dataBytes)
        if err != nil {
            c.JSON(400, gin.H{"error": err.Error()})
            return
        }
        c.JSON(200, gin.H{"plaintext": string(pt)})
    }
}

type SHAReq struct {
    Alg  string `json:"alg" binding:"required"`
    Data string `json:"data" binding:"required"`
}

func ShaHash() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req SHAReq
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{"error": "invalid input"})
            return
        }
        p := plugins.GetHash(req.Alg)
        var h []byte
        if p != nil {
            h = p.Hash([]byte(req.Data))
        } else {
            h = crypto.SHAHash("sha256", []byte(req.Data))
        }
        c.JSON(200, gin.H{"hex": base64.StdEncoding.EncodeToString(h)})
    }
}

type HMACReq struct {
    Alg  string `json:"alg" binding:"required"`
    Key  string `json:"key" binding:"required"`
    Data string `json:"data" binding:"required"`
}

func HmacCalc() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req HMACReq
        if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error":"invalid input"}); return }
        key, err := base64.StdEncoding.DecodeString(req.Key)
        if err != nil { c.JSON(400, gin.H{"error":"invalid key"}); return }
        mac := crypto.HMAC(req.Alg, key, []byte(req.Data))
        c.JSON(200, gin.H{"hex": base64.StdEncoding.EncodeToString(mac)})
    }
}

type AesCbcReq struct {
    Key       string `json:"key" binding:"required"`
    Plaintext string `json:"plaintext"`
    IV        string `json:"iv"`
    Cipher    string `json:"cipher"`
}

func AesCbcEncrypt() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req AesCbcReq
        if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error":"invalid input"}); return }
        key, err := base64.StdEncoding.DecodeString(req.Key)
        if err != nil { c.JSON(400, gin.H{"error":"invalid key"}); return }
        var iv []byte
        if req.IV != "" { iv, err = base64.StdEncoding.DecodeString(req.IV); if err != nil { c.JSON(400, gin.H{"error":"invalid iv"}); return } }
        ivOut, ct, err := crypto.AesCbcEncrypt(key, iv, []byte(req.Plaintext))
        if err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
        c.JSON(200, gin.H{"iv": base64.StdEncoding.EncodeToString(ivOut), "cipher": base64.StdEncoding.EncodeToString(ct)})
    }
}

func AesCbcDecrypt() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req AesCbcReq
        if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error":"invalid input"}); return }
        key, err := base64.StdEncoding.DecodeString(req.Key)
        if err != nil { c.JSON(400, gin.H{"error":"invalid key"}); return }
        iv, err := base64.StdEncoding.DecodeString(req.IV)
        if err != nil { c.JSON(400, gin.H{"error":"invalid iv"}); return }
        ct, err := base64.StdEncoding.DecodeString(req.Cipher)
        if err != nil { c.JSON(400, gin.H{"error":"invalid cipher"}); return }
        pt, err := crypto.AesCbcDecrypt(key, iv, ct)
        if err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
        c.JSON(200, gin.H{"plaintext": string(pt)})
    }
}

type ChaChaReq struct {
    Key       string `json:"key" binding:"required"`
    Plaintext string `json:"plaintext"`
    Nonce     string `json:"nonce"`
    Cipher    string `json:"cipher"`
}

func ChaChaEncrypt() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req ChaChaReq
        if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error":"invalid input"}); return }
        key, err := base64.StdEncoding.DecodeString(req.Key)
        if err != nil { c.JSON(400, gin.H{"error":"invalid key"}); return }
        var nonce []byte
        if req.Nonce != "" { nonce, err = base64.StdEncoding.DecodeString(req.Nonce); if err != nil { c.JSON(400, gin.H{"error":"invalid nonce"}); return } }
        nonceOut, ct, err := crypto.ChaChaEncrypt(key, nonce, []byte(req.Plaintext))
        if err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
        c.JSON(200, gin.H{"nonce": base64.StdEncoding.EncodeToString(nonceOut), "cipher": base64.StdEncoding.EncodeToString(ct)})
    }
}

func ChaChaDecrypt() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req ChaChaReq
        if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error":"invalid input"}); return }
        key, err := base64.StdEncoding.DecodeString(req.Key)
        if err != nil { c.JSON(400, gin.H{"error":"invalid key"}); return }
        nonce, err := base64.StdEncoding.DecodeString(req.Nonce)
        if err != nil { c.JSON(400, gin.H{"error":"invalid nonce"}); return }
        ct, err := base64.StdEncoding.DecodeString(req.Cipher)
        if err != nil { c.JSON(400, gin.H{"error":"invalid cipher"}); return }
        pt, err := crypto.ChaChaDecrypt(key, nonce, ct)
        if err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
        c.JSON(200, gin.H{"plaintext": string(pt)})
    }
}

type PBKDF2Req struct {
    Password  string `json:"password" binding:"required"`
    Salt      string `json:"salt"`
    Iter      int    `json:"iter" binding:"required"`
    DKLen     int    `json:"dkLen" binding:"required"`
    Alg       string `json:"alg"`
}

func PBKDF2Derive() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req PBKDF2Req
        if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error":"invalid input"}); return }
        var salt []byte
        var err error
        if req.Salt != "" { salt, err = base64.StdEncoding.DecodeString(req.Salt); if err != nil { c.JSON(400, gin.H{"error":"invalid salt"}); return } }
        outSalt, key, err := crypto.PBKDF2([]byte(req.Password), salt, req.Iter, req.DKLen, req.Alg)
        if err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
        c.JSON(200, gin.H{"salt": base64.StdEncoding.EncodeToString(outSalt), "key": base64.StdEncoding.EncodeToString(key)})
    }
}

type BcryptReq struct {
    Password string `json:"password" binding:"required"`
    Cost     int    `json:"cost"`
    Hash     string `json:"hash"`
}

func BcryptHash() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req BcryptReq
        if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error":"invalid input"}); return }
        h, err := crypto.BcryptHash([]byte(req.Password), req.Cost)
        if err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
        c.JSON(200, gin.H{"hash": h})
    }
}

func BcryptVerify() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req BcryptReq
        if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error":"invalid input"}); return }
        ok := crypto.BcryptVerify([]byte(req.Password), req.Hash)
        c.JSON(200, gin.H{"ok": ok})
    }
}