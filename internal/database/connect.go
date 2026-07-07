package database

import (
	"bird-migration-platform/internal/migration"
	"bird-migration-platform/internal/types"
	"fmt"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func NewConnect(c *types.Database) *types.Database {
	return &types.Database{
		Dbname:      c.Dbname,
		Dbuser:      c.Dbuser,
		Dbpassword:  c.Dbpassword,
		Dbport:      c.Dbport,
		DbHost:      c.DbHost,
		DbEnableSSL: c.DbEnableSSL,
	}
}

func InitFunc() (*gorm.DB, error) {

	config := &types.Database{
		Dbname:      os.Getenv("DBNAME"),
		Dbuser:      os.Getenv("DBUSER"),
		DbHost:      os.Getenv("DBHOST"),
		Dbpassword:  os.Getenv("DBPASSWORD"),
		Dbport:      os.Getenv("DBPORT"),
		DbEnableSSL: os.Getenv("DBENABLESSL"),
	}

	c := NewConnect(config)

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		c.DbHost,
		c.Dbuser,
		c.Dbpassword,
		c.Dbname,
		c.Dbport,
		c.DbEnableSSL,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{PrepareStmt: false})

	sqlDB, _ := db.DB()
	sqlDB.SetMaxOpenConns(50)
	sqlDB.SetMaxIdleConns(25)
	sqlDB.SetConnMaxLifetime(5 * time.Minute)

	if os.Getenv("RUN_MIGRATIONS") == "true" {
		db.AutoMigrate(&migration.User{}, &migration.BirdMigrationHistory{}, &migration.UploadList{}, &migration.RawClusterRow{}, &migration.GPSEvent{}, &migration.StopoverPoint{})
	}

	return db, err
}
