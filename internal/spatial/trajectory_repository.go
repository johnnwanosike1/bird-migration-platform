package spatial

import (
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
)

type TrajectoryPoint struct {
	TagLocalIdentifier        uint64    `gorm:"column:tag_local_identifier"`
	IndividualLocalIdentifier string    `gorm:"column:individual_local_identifier"`
	Timestamp                 time.Time `gorm:"column:timestamp"`
	Longitude                 float64   `gorm:"column:longitude"`
	Latitude                  float64   `gorm:"column:latitude"`
	GroundSpeed               *float64  `gorm:"column:ground_speed"`
	Heading                   *float64  `gorm:"column:heading"`
	HeightAboveEllipsoid      *float64  `gorm:"column:height_above_ellipsoid"`
}

type TrajectorySegment struct {
	TagLocalIdentifier        uint64       `json:"tag_local_identifier"`
	IndividualLocalIdentifier string       `json:"individual_local_identifier"`
	Path                      [][2]float64 `json:"path"` // [[lon,lat], ...]
	Timestamps                []string     `json:"timestamps"`
	Speeds                    []*float64   `json:"speeds"`
	TotalPoints               int          `json:"total_points"`
}

type TrajectoryRepository struct {
	db *gorm.DB
}

func NewTrajectoryRepository(db *gorm.DB) *TrajectoryRepository {
	return &TrajectoryRepository{db: db}
}

const maxPointsPerBird = 2000

func (r *TrajectoryRepository) GetTrajectories(f FilterData) ([]TrajectorySegment, error) {

	conditions := []string{
		`"location-lat" IS NOT NULL`,
		`"location-long" IS NOT NULL`,
		`"sensor-type" = 'gps'`,
	}
	args := []interface{}{}

	if f.Tag != nil {
		conditions = append(conditions, `"tag-local-identifier" = ?`)
		args = append(args, *f.Tag)
	}
	if f.Start != nil && !f.Start.Time.IsZero() {
		conditions = append(conditions, `"timestamp" >= ?`)
		args = append(args, f.Start.Time)
	}
	if f.End != nil && !f.End.Time.IsZero() {
		end := f.End.Time.Add(24*time.Hour - time.Second)
		conditions = append(conditions, `"timestamp" <= ?`)
		args = append(args, end)
	}

	whereClause := strings.Join(conditions, " AND ")

	// maxPointsPerBird is the NTILE bucket count, consumed once.
	args = append(args, maxPointsPerBird)

	sql := fmt.Sprintf(`
		WITH base AS (
			SELECT
				"tag-local-identifier"          AS tag_local_identifier,
				"individual-local-identifier"   AS individual_local_identifier,
				"timestamp"                      AS ts,
				"location-long"                  AS longitude,
				"location-lat"                   AS latitude,
				"ground-speed"                   AS ground_speed,
				"heading"                        AS heading,
				"height-above-ellipsoid"         AS height_above_ellipsoid
			FROM bird_migration_history
			WHERE %s
		),
		bucketed AS (
			SELECT
				base.*,
				NTILE(?) OVER (
					PARTITION BY tag_local_identifier
					ORDER BY ts
				) AS bucket,
				ROW_NUMBER() OVER (
					PARTITION BY tag_local_identifier
					ORDER BY ts
				) AS rn
			FROM base
		),
		deduped AS (
			SELECT *,
				ROW_NUMBER() OVER (
					PARTITION BY tag_local_identifier, bucket
					ORDER BY rn
				) AS rn_in_bucket
			FROM bucketed
		)
		SELECT
			tag_local_identifier,
			individual_local_identifier,
			ts          AS timestamp,
			longitude,
			latitude,
			ground_speed,
			heading,
			height_above_ellipsoid
		FROM deduped
		WHERE rn_in_bucket = 1
		ORDER BY tag_local_identifier, ts ASC
	`, whereClause)

	var points []TrajectoryPoint
	if err := r.db.Raw(sql, args...).Scan(&points).Error; err != nil {
		return nil, fmt.Errorf("trajectory query: %w", err)
	}

	return groupIntoSegments(points), nil
}

func groupIntoSegments(points []TrajectoryPoint) []TrajectorySegment {

	counts := make(map[uint64]int)
	for _, p := range points {
		counts[p.TagLocalIdentifier]++
	}

	orderUnit := make([]uint64, 0, len(counts))
	index := make(map[uint64]int, len(counts))
	segments := make([]TrajectorySegment, 0, len(counts))

	for _, p := range points {
		idx, exists := index[p.TagLocalIdentifier]
		if !exists {
			idx = len(segments)
			index[p.TagLocalIdentifier] = idx
			orderUnit = append(orderUnit, p.TagLocalIdentifier)
			n := counts[p.TagLocalIdentifier]
			segments = append(segments, TrajectorySegment{
				TagLocalIdentifier:        p.TagLocalIdentifier,
				IndividualLocalIdentifier: p.IndividualLocalIdentifier,
				Path:                      make([][2]float64, 0, n),
				Timestamps:                make([]string, 0, n),
				Speeds:                    make([]*float64, 0, n),
			})
		}

		segments[idx].Path = append(segments[idx].Path, [2]float64{p.Longitude, p.Latitude})
		segments[idx].Timestamps = append(segments[idx].Timestamps, p.Timestamp.UTC().Format(time.RFC3339))
		segments[idx].Speeds = append(segments[idx].Speeds, p.GroundSpeed)
		segments[idx].TotalPoints++
	}

	// Return in bird-insertion order (stable regardless of map iteration
	// order above, since orderUnit was built from the original points slice).
	result := make([]TrajectorySegment, len(orderUnit))
	for i, tag := range orderUnit {
		result[i] = segments[index[tag]]
	}

	return result
}
