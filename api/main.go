package main

import (
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"mound/api/internal/handler"
	"mound/api/internal/middleware"
	"mound/api/internal/model"
)

func main() {
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		dsn = "mound.db"
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	model.InitDB(dsn)

	r := gin.Default()

	// ── Public routes ────────────────────────────────────
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", handler.Register)
		auth.POST("/login", handler.Login)
		auth.POST("/logout", middleware.Auth(), handler.Logout)
		auth.GET("/me", middleware.Auth(), handler.Me)
		auth.PUT("/settings", middleware.Auth(), handler.UpdateSettings)
	}

	// ── Protected routes ─────────────────────────────────
	api := r.Group("/api", middleware.Auth())
	{
		cats := api.Group("/categories")
		{
			cats.GET("", handler.ListCategories)
			cats.POST("", handler.CreateCategory)
			cats.PUT("/:id", handler.UpdateCategory)
			cats.DELETE("/:id", handler.DeleteCategory)
		}

		exps := api.Group("/expenses")
		{
			exps.GET("", handler.ListExpenses)
			exps.GET("/export", handler.ExportExpensesCSV)
			exps.POST("", handler.CreateExpense)
			exps.PUT("/:id", handler.UpdateExpense)
			exps.DELETE("/:id", handler.DeleteExpense)
		}
	}

	// ── Frontend static files ─────────────────────────────
	distFS, err := fs.Sub(staticFiles, "web/dist")
	if err != nil {
		log.Fatal(err)
	}
	fileServer := http.FileServer(http.FS(distFS))

	r.NoRoute(func(c *gin.Context) {
		path := strings.TrimPrefix(c.Request.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}
		f, err := distFS.Open(path)
		if err == nil {
			f.Close()
			fileServer.ServeHTTP(c.Writer, c.Request)
			return
		}
		data, err := fs.ReadFile(distFS, "index.html")
		if err != nil {
			c.Status(http.StatusInternalServerError)
			return
		}
		c.Data(http.StatusOK, "text/html; charset=utf-8", data)
	})

	log.Printf("MoneyMound API listening on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
