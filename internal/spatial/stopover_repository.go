package spatial

import (
	"bird-migration-platform/internal/migration"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"gorm.io/gorm"
)

type Date struct {
	time.Time
}

func (d *Date) UnmarshalJSON(b []byte) error {
	s := strings.Trim(string(b), `"`)
	// Try date-only first
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		// Fall back to full RFC3339
		t, err = time.Parse(time.RFC3339, s)
		if err != nil {
			return fmt.Errorf("date must be YYYY-MM-DD or RFC3339, got: %s", s)
		}
	}
	d.Time = t
	return nil
}

type FilterData struct {
	FltSwitch                  int       `json:"flt_switch"`
	Start                      *Date     `json:"start"`
	End                        *Date     `json:"end"`
	Tag                        *uint64   `json:"tag"`
	MaxSpeed                   float64   `json:"max_speed"`
	MinDuration                float64   `json:"min_duration"`
	IndividualLocalIdentifiers []string  `json:"individual_local_identifiers,omitempty"`
	Radius                     int       `json:"radius"`
	Switchfilter               *[]string `json:"switchfilter,omitempty"`
}

type StopoverRepository struct {
	db *gorm.DB
}

func NewStopoverRepository(db *gorm.DB) *StopoverRepository {
	return &StopoverRepository{db: db}
}

const maxStopoverGap = 3 * time.Hour

const maxConcurrentTagQueries = 6

type StopoverResult struct {
	Points []migration.StopoverPoint `json:"points"`
	Count  int                       `json:"count"`
}

func (r *StopoverRepository) GetStopoverPoints(f FilterData) (StopoverResult, error) {
	tags, err := r.resolveTags(f)
	if err != nil {
		return StopoverResult{}, fmt.Errorf("resolve tags: %w", err)
	}
	if len(tags) == 0 {
		return StopoverResult{Points: []migration.StopoverPoint{}, Count: 0}, nil
	}

	type tagResult struct {
		points []migration.StopoverPoint
		err    error
	}

	resultsCh := make(chan tagResult, len(tags))
	sem := make(chan struct{}, maxConcurrentTagQueries)
	var wg sync.WaitGroup

	for _, tag := range tags {
		tag := tag
		wg.Add(1)
		sem <- struct{}{}
		go func() {
			defer wg.Done()

			defer func() { <-sem }()

			points, err := r.getStopoverPointsForTag(f, tag)
			resultsCh <- tagResult{points: points, err: err}
		}()
	}

	wg.Wait()
	close(resultsCh)

	// fmt.Print("points -> ", tagResult)

	var out []migration.StopoverPoint
	var firstErr error
	for res := range resultsCh {
		if res.err != nil {
			if firstErr == nil {
				firstErr = res.err
			}
			continue
		}
		out = append(out, res.points...)
	}
	if firstErr != nil {
		return StopoverResult{}, firstErr
	}

	sortStopoversByTagThenArrival(out)

	return StopoverResult{Points: out, Count: len(out)}, nil
}

func (r *StopoverRepository) resolveTags(f FilterData) ([]uint64, error) {
	if f.Tag != nil {
		return []uint64{*f.Tag}, nil
	}

	conditions := []string{
		`"location-lat" IS NOT NULL`,
		`"location-long" IS NOT NULL`,
		`("ground-speed" IS NULL OR "ground-speed" < ?)`,
	}
	args := []interface{}{f.MaxSpeed}

	if f.Start != nil {
		conditions = append(conditions, `"timestamp" >= ?`)
		args = append(args, f.Start.Time)
	}
	if f.End != nil {
		end := f.End.Time.Add(24*time.Hour - time.Second)
		conditions = append(conditions, `"timestamp" <= ?`)
		args = append(args, end)
	}

	if len(f.IndividualLocalIdentifiers) > 0 {
		placeholders := make([]string, len(f.IndividualLocalIdentifiers))
		for i, id := range f.IndividualLocalIdentifiers {
			placeholders[i] = "?"
			args = append(args, id)
		}
		conditions = append(conditions, fmt.Sprintf(`"individual-local-identifier" IN (%s)`, strings.Join(placeholders, ", ")))
	}

	query := fmt.Sprintf(
		`SELECT DISTINCT "tag-local-identifier" FROM bird_migration_history WHERE %s`,
		strings.Join(conditions, " AND "),
	)

	var tags []uint64
	if err := r.db.Raw(query, args...).Scan(&tags).Error; err != nil {
		return nil, err
	}
	return tags, nil
}

func (r *StopoverRepository) getStopoverPointsForTag(f FilterData, tag uint64) ([]migration.StopoverPoint, error) {

	conditions := []string{
		`"tag-local-identifier" = ?`,
		`"location-lat" IS NOT NULL`,
		`"location-long" IS NOT NULL`,
		`("ground-speed" IS NULL OR "ground-speed" < ?)`,
	}
	args := []interface{}{tag, f.MaxSpeed}

	if f.Start != nil {
		conditions = append(conditions, `"timestamp" >= ?`)
		args = append(args, f.Start.Time)
	}
	if f.End != nil {
		// Inclusive end: go to end of the given day
		end := f.End.Time.Add(24*time.Hour - time.Second)
		conditions = append(conditions, `"timestamp" <= ?`)
		args = append(args, end)
	}
	if len(f.IndividualLocalIdentifiers) > 0 {
		placeholders := make([]string, len(f.IndividualLocalIdentifiers))
		for i, id := range f.IndividualLocalIdentifiers {
			placeholders[i] = "?"
			args = append(args, id)
		}
		conditions = append(conditions, fmt.Sprintf(`"individual-local-identifier" IN (%s)`, strings.Join(placeholders, ", ")))
	}

	whereClause := strings.Join(conditions, " AND ")

	gapArg := fmt.Sprintf("%d minutes", int(maxStopoverGap.Minutes()))
	args = append(args, gapArg, f.MinDuration, f.Radius)

	clusterSQL := fmt.Sprintf(`
		WITH base AS (
			SELECT
				"tag-local-identifier"          AS tag_local_identifier,
				"individual-local-identifier"   AS individual_local_identifier,
				"timestamp"                      AS ts,
				"location-lat"                   AS lat,
				"location-long"                  AS lon,
				COALESCE("ground-speed", 0)      AS ground_speed,
				"height-above-ellipsoid"         AS height_m
			FROM bird_migration_history
			WHERE %s
		),
		flagged AS (
			SELECT
				tag_local_identifier,
				individual_local_identifier,
				ts,
				lat,
				lon,
				ground_speed,
				height_m,
				ts - LAG(ts) OVER (
					PARTITION BY individual_local_identifier
					ORDER BY ts
				) AS gap
			FROM base
		),
		grouped AS (
			SELECT
				tag_local_identifier,
				individual_local_identifier,
				lat,
				lon,
				ts,
				ground_speed,
				height_m,
				SUM(
					CASE WHEN gap IS NULL OR gap > ?::interval THEN 1 ELSE 0 END
				) OVER (
					PARTITION BY individual_local_identifier
					ORDER BY ts
				) AS run_id
			FROM flagged
		),
		clustered AS (
			SELECT
				tag_local_identifier,
				individual_local_identifier,
				run_id,
				AVG(lat)                          AS centroid_lat,
				AVG(lon)                          AS centroid_lon,
				MIN(ts)                            AS arrival_time,
				MAX(ts)                            AS departure_time,
				COUNT(*)                           AS fix_count,
				AVG(ground_speed)                  AS mean_speed,
				AVG(COALESCE(height_m, 0))         AS mean_height_m,
				MIN(lat)                           AS min_lat,
				MAX(lat)                           AS max_lat,
				MIN(lon)                           AS min_lon,
				MAX(lon)                           AS max_lon
			FROM grouped
			GROUP BY tag_local_identifier, individual_local_identifier, run_id
			HAVING COUNT(*) >= 3
			   AND EXTRACT(EPOCH FROM (MAX(ts) - MIN(ts))) / 3600.0 >= ?
		),
		-- Bounding-box spread in metres, same haversine formula as the Go helper,
		-- applied here so the radius filter happens in SQL instead of after the fact in Go.
		spread_calc AS (
			SELECT
				*,
				2 * 6371000.0 * ASIN(SQRT(
					POWER(SIN(RADIANS(max_lat - min_lat) / 2), 2) +
					COS(RADIANS(min_lat)) * COS(RADIANS(max_lat)) *
					POWER(SIN(RADIANS(max_lon - min_lon) / 2), 2)
				)) AS spread_m
			FROM clustered
		),
		within_radius AS (
			SELECT * FROM spread_calc WHERE spread_m <= ?
		)
		SELECT
			tag_local_identifier,
			individual_local_identifier,
			centroid_lat,
			centroid_lon,
			arrival_time,
			departure_time,
			fix_count,
			mean_speed,
			mean_height_m,
			min_lat, max_lat, min_lon, max_lon,
			spread_m,
			COUNT(*) OVER () AS total_count
		FROM within_radius
		ORDER BY arrival_time
	`, whereClause)

	type clusterRowFull struct {
		migration.RawClusterRow
		ArrivalTime   time.Time `gorm:"column:arrival_time"`
		DepartureTime time.Time `gorm:"column:departure_time"`
		MinLat        float64   `gorm:"column:min_lat"`
		MaxLat        float64   `gorm:"column:max_lat"`
		MinLon        float64   `gorm:"column:min_lon"`
		MaxLon        float64   `gorm:"column:max_lon"`
		SpreadM       float64   `gorm:"column:spread_m"`
		TotalCount    int       `gorm:"column:total_count"`
	}

	var rows []clusterRowFull
	if err := r.db.Raw(clusterSQL, args...).Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("stopover query for tag %d: %w", tag, err)
	}

	out := make([]migration.StopoverPoint, 0, len(rows))
	for _, row := range rows {
		out = append(out, migration.StopoverPoint{
			TagLocalIdentifier:        row.TagLocalIdentifier,
			IndividualLocalIdentifier: row.IndividualLocalIdentifier,
			CentroidLat:               row.CentroidLat,
			CentroidLon:               row.CentroidLon,
			ArrivalTime:               row.ArrivalTime,
			DepartureTime:             row.DepartureTime,
			DurationHours:             row.DepartureTime.Sub(row.ArrivalTime).Hours(),
			FixCount:                  row.FixCount,
			MeanSpeed:                 row.MeanSpeed,
			MaxDisplacementM:          row.SpreadM,
			MeanHeightM:               row.MeanHeightM,
		})
	}

	return out, nil
}

func sortStopoversByTagThenArrival(points []migration.StopoverPoint) {
	sort.Slice(points, func(i, j int) bool {
		if points[i].TagLocalIdentifier != points[j].TagLocalIdentifier {
			return points[i].TagLocalIdentifier < points[j].TagLocalIdentifier
		}
		return points[i].ArrivalTime.Before(points[j].ArrivalTime)
	})
}
