package config

import (
    "os"
)

type Config struct {
    ServerAddr string
    JWTSecret  string
    DBPath     string
    AllowOrigin string
}

func Load() *Config {
    addr := os.Getenv("SERVER_ADDR")
    if addr == "" {
        addr = ":8080"
    }
    secret := os.Getenv("JWT_SECRET")
    if secret == "" {
        secret = "change-this-secret"
    }
    db := os.Getenv("DB_PATH")
    if db == "" {
        db = "backend/data.db"
    }
    origin := os.Getenv("ALLOW_ORIGIN")
    if origin == "" {
        origin = "*"
    }
    return &Config{ServerAddr: addr, JWTSecret: secret, DBPath: db, AllowOrigin: origin}
}