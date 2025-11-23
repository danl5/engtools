package service

import (
    "engtools/backend/internal/config"
    "engtools/backend/internal/repository/model"
    "github.com/golang-jwt/jwt/v5"
    "golang.org/x/crypto/bcrypt"
    "gorm.io/gorm"
    "time"
)

type AuthService struct {
    cfg *config.Config
    db  *gorm.DB
}

func NewAuthService(cfg *config.Config, db *gorm.DB) *AuthService {
    return &AuthService{cfg: cfg, db: db}
}

func (s *AuthService) Login(username, password string) (string, bool) {
    var u model.User
    if err := s.db.Where("username = ?", username).First(&u).Error; err != nil {
        return "", false
    }
    if bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password)) != nil {
        return "", false
    }
    claims := jwt.MapClaims{
        "sub": u.Username,
        "exp": time.Now().Add(24 * time.Hour).Unix(),
        "iat": time.Now().Unix(),
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    t, _ := token.SignedString([]byte(s.cfg.JWTSecret))
    return t, true
}