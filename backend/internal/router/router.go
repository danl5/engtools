package router

import (
    "engtools/backend/internal/config"
    "engtools/backend/internal/controller"
    "engtools/backend/internal/service"
    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
    "github.com/prometheus/client_golang/prometheus/promhttp"
    "go.uber.org/zap"
    "gorm.io/gorm"
    "net/http"
)

func New(cfg *config.Config, log *zap.Logger, db *gorm.DB) *gin.Engine {
    r := gin.Default()
    r.Use(cors.New(cors.Config{
        AllowOrigins:     []string{cfg.AllowOrigin},
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Authorization", "Content-Type"},
        AllowCredentials: true,
    }))
    r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })
    r.GET("/metrics", gin.WrapH(promhttp.Handler()))
    r.GET("/swagger", controller.SwaggerUI())
    r.GET("/openapi.json", func(c *gin.Context) {
        c.FileFromFS("openapi/openapi.json", http.Dir("backend"))
    })

    authSvc := service.NewAuthService(cfg, db)
    geoSvc := service.NewGeoService(cfg)
    v1 := r.Group("/api/v1")
    v1.POST("/auth/login", controller.LoginHandler(authSvc))

    v1.POST("/tools/bytes-to-string", controller.BytesToString())
    v1.POST("/tools/string-to-bytes", controller.StringToBytes())
    v1.POST("/tools/base64/encode", controller.Base64Encode())
    v1.POST("/tools/base64/decode", controller.Base64Decode())
    v1.GET("/tools/ip/geo", controller.IPGeo(geoSvc))

    v1.POST("/crypto/aes/encrypt", controller.AesEncrypt())
    v1.POST("/crypto/aes/decrypt", controller.AesDecrypt())
    v1.POST("/crypto/aes/cbc/encrypt", controller.AesCbcEncrypt())
    v1.POST("/crypto/aes/cbc/decrypt", controller.AesCbcDecrypt())
    v1.POST("/crypto/rsa/generate", controller.RsaGenerate())
    v1.POST("/crypto/rsa/encrypt", controller.RsaEncrypt())
    v1.POST("/crypto/rsa/decrypt", controller.RsaDecrypt())
    v1.POST("/crypto/sha/hash", controller.ShaHash())
    v1.POST("/crypto/hmac/calc", controller.HmacCalc())
    v1.POST("/crypto/chacha/encrypt", controller.ChaChaEncrypt())
    v1.POST("/crypto/chacha/decrypt", controller.ChaChaDecrypt())
    v1.POST("/crypto/pbkdf2/derive", controller.PBKDF2Derive())
    v1.POST("/crypto/bcrypt/hash", controller.BcryptHash())
    v1.POST("/crypto/bcrypt/verify", controller.BcryptVerify())
    return r
}

func jwtMiddleware(cfg *config.Config) gin.HandlerFunc {
    return func(c *gin.Context) {
        hdr := c.GetHeader("Authorization")
        if hdr == "" {
            c.AbortWithStatusJSON(401, gin.H{"error": "missing auth"})
            return
        }
        token, err := jwt.Parse(hdr, func(token *jwt.Token) (interface{}, error) {
            return []byte(cfg.JWTSecret), nil
        })
        if err != nil || !token.Valid {
            c.AbortWithStatusJSON(401, gin.H{"error": "invalid token"})
            return
        }
        c.Next()
    }
}