package migration

import (
	"time"

	"gorm.io/gorm"
)

type UploadList struct {
	ID        uint           `gorm:"column:id" json:"id"`
	Filename  string         `gorm:"filename"`
	Status    string         `gorm:"default:'pending'"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
