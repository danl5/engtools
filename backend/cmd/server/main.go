package main

import (
    "engtools/backend/internal/config"
    "engtools/backend/internal/logger"
    "engtools/backend/internal/repository"
    "engtools/backend/internal/router"
)

func main() {
    cfg := config.Load()
    log := logger.New(cfg)
    db := repository.InitDB(cfg, log)
    r := router.New(cfg, log, db)
    _ = r.Run(cfg.ServerAddr)
}