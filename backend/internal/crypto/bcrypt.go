package crypto

import "golang.org/x/crypto/bcrypt"

func BcryptHash(password []byte, cost int) (string, error) {
    if cost <= 0 { cost = bcrypt.DefaultCost }
    h, err := bcrypt.GenerateFromPassword(password, cost)
    if err != nil { return "", err }
    return string(h), nil
}

func BcryptVerify(password []byte, hash string) bool {
    return bcrypt.CompareHashAndPassword([]byte(hash), password) == nil
}