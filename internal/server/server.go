package server

import (
	"bird-migration-platform/internal/database"
	"bird-migration-platform/internal/handlers"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	_ "github.com/joho/godotenv/autoload"
	"gorm.io/gorm"
)

type Server struct {
	port int
	DB   *gorm.DB
	h    *handlers.MigrationHandler
}

func NewServer() *http.Server {
	port, _ := strconv.Atoi(os.Getenv("PORT"))

	db, err := database.InitFunc()

	if err != nil {

	}

	NewServer := &Server{
		port: port,
		DB:   db,
	}

	// Declare Server config
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", NewServer.port),
		Handler:      NewServer.RegisterRoutes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Minute,
		WriteTimeout: 10 * time.Minute,
	}

	return server
}
