package repository

import (
    "engtools/backend/internal/config"
    "engtools/backend/internal/repository/model"
    "go.uber.org/zap"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
    "os"
    "path/filepath"
)

func InitDB(cfg *config.Config, log *zap.Logger) *gorm.DB {
    _ = os.MkdirAll(filepath.Dir(cfg.DBPath), 0o755)
    db, err := gorm.Open(sqlite.Open(cfg.DBPath), &gorm.Config{})
    if err != nil {
        log.Fatal("db open", zap.Error(err))
    }
    if err := db.AutoMigrate(&model.User{}); err != nil {
        log.Fatal("db migrate", zap.Error(err))
    }
    model.EnsureDefaultAdmin(db)
    return db
}