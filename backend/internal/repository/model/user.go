package model

import (
    "golang.org/x/crypto/bcrypt"
    "gorm.io/gorm"
)

type User struct {
    ID       uint   `gorm:"primaryKey"`
    Username string `gorm:"uniqueIndex;size:64"`
    Password string `gorm:"size:255"`
}

func EnsureDefaultAdmin(db *gorm.DB) {
    var count int64
    db.Model(&User{}).Where("username = ?", "admin").Count(&count)
    if count == 0 {
        hash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
        db.Create(&User{Username: "admin", Password: string(hash)})
    }
}