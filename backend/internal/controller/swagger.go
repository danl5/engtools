package controller

import (
    "github.com/gin-gonic/gin"
)

func SwaggerUI() gin.HandlerFunc {
    html := `<!DOCTYPE html><html><head><title>Swagger UI</title><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css"></head><body><div id="swagger-ui"></div><script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script><script>window.ui = SwaggerUIBundle({ url: '/openapi.json', dom_id: '#swagger-ui' });</script></body></html>`
    return func(c *gin.Context) { c.Data(200, "text/html; charset=utf-8", []byte(html)) }
}