package migration

import "time"

type BirdMigrationHistory struct {
	EventID   uint64     `gorm:"column:event-id;primaryKey" json:"event_id"`
	Timestamp *time.Time `gorm:"column:timestamp" json:"timestamp"`

	LocationLong *float64 `gorm:"column:location-long" json:"location_long"`
	LocationLat  *float64 `gorm:"column:location-lat" json:"location_lat"`

	GroundSpeed          *float64 `gorm:"column:ground-speed" json:"ground_speed"`
	Heading              *float64 `gorm:"column:heading" json:"heading"`
	HeightAboveEllipsoid *float64 `gorm:"column:height-above-ellipsoid" json:"height_above_ellipsoid"`

	GpsSatelliteCount *int `gorm:"column:gps:satellite-count" json:"gps_satellite_count"`

	SensorType                *string `gorm:"column:sensor-type" json:"sensor_type"`
	TagLocalIdentifier        *uint64 `gorm:"column:tag-local-identifier" json:"tag_local_identifier"`
	IndividualLocalIdentifier *string `gorm:"column:individual-local-identifier" json:"individual_local_identifier"`
}

func (BirdMigrationHistory) TableName() string {
	return "bird_migration_history"
}
