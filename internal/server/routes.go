package server

import (
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func (s *Server) RegisterRoutes() http.Handler {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // Add your frontend URL
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true, // Enable cookies/auth
	}))

	r.MaxMultipartMemory = 5 << 30

	{
		v1 := r.Group("/api")
		v1.GET("/get-categories", s.h.GetMigrationCategories)
		v1.POST("/upload", s.h.Upload)
		v1.GET("/get-uploadlist", s.h.GetList)
		v1.DELETE("/delete", s.h.DeleteFile)
		v1.POST("/sync-data", s.h.SyncUpload)
		v1.POST("/map-filter", s.h.FilterMap)
	}

	return r
}
