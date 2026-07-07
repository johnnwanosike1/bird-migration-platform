package types

type StorkGroup struct {
	TagLocalIdentifier        int64  `gorm:"column:tag-local-identifier" json:"tag-local-identifier"`
	IndividualLocalIdentifier string `gorm:"column:individual-local-identifier" json:"individual-local-identifier"`
	TotalPoints               int64  `json:"total_points"`
}
