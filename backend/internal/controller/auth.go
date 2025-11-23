package controller

import (
    "engtools/backend/internal/service"
    "github.com/gin-gonic/gin"
)

type LoginRequest struct {
    Username string `json:"username" binding:"required,min=3"`
    Password string `json:"password" binding:"required,min=6"`
}

func LoginHandler(s *service.AuthService) gin.HandlerFunc {
    return func(c *gin.Context) {
        var req LoginRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{"error": "invalid input"})
            return
        }
        token, ok := s.Login(req.Username, req.Password)
        if !ok {
            c.JSON(401, gin.H{"error": "unauthorized"})
            return
        }
        c.JSON(200, gin.H{"token": token})
    }
}