package controller

import (
    "encoding/base64"
    "github.com/gin-gonic/gin"
)

type StringBytesRequest struct {
    Value string `json:"value" binding:"required"`
}

func BytesToString() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req StringBytesRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{"error": "invalid input"})
            return
        }
        c.JSON(200, gin.H{"string": string([]byte(req.Value))})
    }
}

func StringToBytes() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req StringBytesRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{"error": "invalid input"})
            return
        }
        c.JSON(200, gin.H{"bytes": []byte(req.Value)})
    }
}

type Base64Request struct {
    Value string `json:"value" binding:"required"`
}

func Base64Encode() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req Base64Request
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{"error": "invalid input"})
            return
        }
        c.JSON(200, gin.H{"base64": base64.StdEncoding.EncodeToString([]byte(req.Value))})
    }
}

func Base64Decode() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req Base64Request
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{"error": "invalid input"})
            return
        }
        b, err := base64.StdEncoding.DecodeString(req.Value)
        if err != nil {
            c.JSON(400, gin.H{"error": "invalid base64"})
            return
        }
        c.JSON(200, gin.H{"text": string(b)})
    }
}