package handlers

import (
	"bird-migration-platform/internal/database"
	"bird-migration-platform/internal/migration"
	"bird-migration-platform/internal/spatial"
	"bird-migration-platform/internal/types"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
)

type MigrationHandler struct {
	spatial spatial.StopoverRepository
}

type FileFormData struct {
	UploadID uint   `gorm:"column:upload_id" json:"upload_id"`
	Filename string `gorm:"filename"`
}

type FilterData struct {
	FltSwitch   int       `json:"flt_switch"`
	Start       time.Time `json:"start"`
	End         time.Time `json:"end"`
	Tag         int64     `json:"tag"`
	MaxSpeed    float64   `json:"max_speed"`
	MinDuration float64   `json:"min_duration"`
	Radius      int       `json:"radius"`
}

func (h *MigrationHandler) GetMigrationCategories(c *gin.Context) {

	db, err := database.InitFunc()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var storks []types.StorkGroup

	err = db.Model(&migration.BirdMigrationHistory{}).
		Select(`
        "tag-local-identifier",
        "individual-local-identifier",
        COUNT(*) AS total_points
    `).
		Group(`"tag-local-identifier", "individual-local-identifier"`).
		Order(`"tag-local-identifier" ASC`).
		Find(&storks).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, storks)

}

func (h *MigrationHandler) Upload(c *gin.Context) {
	file, err := c.FormFile("file")

	if err != nil {
		fmt.Print("error: Unable to upload file")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// get ext

	ext := filepath.Ext(file.Filename)

	if ext != ".csv" {
		c.JSON(http.StatusUnsupportedMediaType, gin.H{
			"error": fmt.Sprintf("Invalid file type '%s'. Only .csv files are accepted.", ext),
		})
	}

	dst := filepath.Join("./migration_data/", filepath.Base(file.Filename))

	c.SaveUploadedFile(file, dst)

	db, err := database.InitFunc()

	var fileType migration.UploadList
	db.Model(&migration.UploadList{Filename: file.Filename}).Where("filename ? =", file.Filename).First(&fileType)

	if lo.IsEmpty(fileType.Filename) {
		db.Model(&migration.UploadList{}).Create(&migration.UploadList{Filename: file.Filename, Status: "pending"})
	}

	// print(file.Filename)
	// fmt.Print(file.Filename)
	c.JSON(http.StatusOK, "")
}

func (h *MigrationHandler) GetList(c *gin.Context) {
	// get database

	db, err := database.InitFunc()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to complete request, please try again"})
	}

	// data holding

	var list = []migration.UploadList{}

	resurt := db.Model(&migration.UploadList{}).Find(&list)

	fmt.Print(resurt)

	c.JSON(http.StatusOK, list)

}

func (h *MigrationHandler) DeleteFile(c *gin.Context) {
	db, err := database.InitFunc()

	// get and delete file

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to complete request"})
	}

	data := FileFormData{}

	c.ShouldBind(&data)

	res := db.Where("filename  LIKE ?", data.Filename).Delete(&migration.UploadList{})
	dst := filepath.Join("./migration_data/", filepath.Base(data.Filename))
	os.Remove(dst)

	fmt.Print(res)

	c.JSON(http.StatusOK, data.Filename)
}

func (h *MigrationHandler) SyncUpload(c *gin.Context) {

	data := FileFormData{}

	c.ShouldBind(&data)

	c.JSON(http.StatusOK, data.Filename)
}

func (h *MigrationHandler) FilterMap(c *gin.Context) {

	// set data to struct

	var data spatial.FilterData

	err := c.ShouldBindJSON(&data)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// if err != nil {
	// 	c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	// 	return
	// }

	db, err := database.InitFunc()

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	}
	spatialFunc := spatial.NewStopoverRepository(db)

	// get trajectory

	spatialFuncTrajectory := spatial.NewTrajectoryRepository(db)

	var trajectory_path []spatial.TrajectorySegment
	var points []migration.StopoverPoint

	// check if Switchfilter is present and contains desired keys

	if data.Switchfilter != nil && lo.Contains(*data.Switchfilter, "track-lines") {

		traj, trajErr := spatialFuncTrajectory.GetTrajectories(data)
		if trajErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": trajErr.Error()})
			return
		}
		trajectory_path = traj
	} else {
		trajectory_path = []spatial.TrajectorySegment{}
	}

	if data.Switchfilter != nil && lo.Contains(*data.Switchfilter, "stopover-points") {
		_points, err := spatialFunc.GetStopoverPoints(data)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		points = _points.Points
	} else {
		points = []migration.StopoverPoint{}
	}

	c.JSON(http.StatusOK, gin.H{"bird_migration_stopover": points, "event": trajectory_path})

	// c.JSON(http.StatusOK, gin.H{"status": birds_data})
}
