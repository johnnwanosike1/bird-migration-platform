package migration

import "time"

type GPSEvent struct {
	EventID                      int64      `gorm:"column:event_id;primaryKey"`
	Visible                      bool       `gorm:"column:visible"`
	Timestamp                    time.Time  `gorm:"column:timestamp"`
	LocationLong                 float64    `gorm:"column:location_long"`
	LocationLat                  float64    `gorm:"column:location_lat"`
	AccelerationRawX             *float64   `gorm:"column:acceleration_raw_x"`
	AccelerationRawY             *float64   `gorm:"column:acceleration_raw_y"`
	AccelerationRawZ             *float64   `gorm:"column:acceleration_raw_z"`
	AlgorithmMarkedOutlier       *bool      `gorm:"column:algorithm_marked_outlier"`
	ExternalTemperature          *float64   `gorm:"column:external_temperature"`
	FltSwitch                    *int       `gorm:"column:flt_switch"`
	GPSSatelliteCount            *int       `gorm:"column:gps_satellite_count"`
	GroundSpeed                  *float64   `gorm:"column:ground_speed"`
	Heading                      *float64   `gorm:"column:heading"`
	HeightAboveEllipsoid         *float64   `gorm:"column:height_above_ellipsoid"`
	ImportMarkedOutlier          bool       `gorm:"column:import_marked_outlier"`
	LocationErrorNumerical       *float64   `gorm:"column:location_error_numerical"`
	TagVoltage                   *float64   `gorm:"column:tag_voltage"`
	TransmissionTimestamp        *time.Time `gorm:"column:transmission_timestamp"`
	SensorType                   string     `gorm:"column:sensor_type"`
	IndividualTaxonCanonicalName string     `gorm:"column:individual_taxon_canonical_name"`
	TagLocalIdentifier           int64      `gorm:"column:tag-local-identifier"`
	IndividualLocalIdentifier    string     `gorm:"column:individual_local_identifier"`
	StudyName                    string     `gorm:"column:study_name"`
}

func (GPSEvent) TableName() string { return "gps_events" }

// StopoverPoint is the output struct used by the map visualisation layer.
// Each row represents one detected stop-over cluster centroid.
type StopoverPoint struct {
	TagLocalIdentifier        int64     `json:"tag_local_identifier"`
	IndividualLocalIdentifier string    `json:"individual_local_identifier"`
	CentroidLat               float64   `json:"centroid_lat"`
	CentroidLon               float64   `json:"centroid_lon"`
	ArrivalTime               time.Time `json:"arrival_time"`
	DepartureTime             time.Time `json:"departure_time"`
	DurationHours             float64   `json:"duration_hours"`
	FixCount                  int       `json:"fix_count"`
	MeanSpeed                 float64   `json:"mean_speed_ms"`
	MaxDisplacementM          float64   `json:"max_displacement_m"`
	MeanHeightM               float64   `json:"mean_height_m"`
}

// RawClusterRow is an intermediate scan target for the clustering SQL query.
type RawClusterRow struct {
	TagLocalIdentifier        int64     `gorm:"column:tag_local_identifier"`
	IndividualLocalIdentifier string    `gorm:"column:individual_local_identifier"`
	CentroidLat               float64   `gorm:"column:centroid_lat"`
	CentroidLon               float64   `gorm:"column:centroid_lon"`
	ArrivalTime               time.Time `gorm:"column:arrival_time"`
	DepartureTime             time.Time `gorm:"column:departure_time"`
	FixCount                  int       `gorm:"column:fix_count"`
	MeanSpeed                 float64   `gorm:"column:mean_speed"`
	MeanHeightM               float64   `gorm:"column:mean_height_m"`
}
