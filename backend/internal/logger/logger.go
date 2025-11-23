package logger

import (
    "engtools/backend/internal/config"
    "go.uber.org/zap"
)

func New(cfg *config.Config) *zap.Logger {
    l, _ := zap.NewProduction()
    return l
}