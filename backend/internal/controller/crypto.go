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