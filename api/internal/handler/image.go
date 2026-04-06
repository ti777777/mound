package handler

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"mound/api/internal/middleware"
	"mound/api/internal/model"
)

// UploadDir is set by main.go at startup
var UploadDir = "./uploads"

func UploadExpenseImage(c *gin.Context) {
	uid := middleware.CurrentUserID(c)
	expID := c.Param("id")

	var exp model.Expense
	if err := model.DB.Where("id = ? AND user_id = ?", expID, uid).First(&exp).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "expense not found"})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file provided"})
		return
	}
	defer file.Close()

	// Limit to 15 MB
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 15<<20)

	// Read first 512 bytes to detect MIME type
	buf := make([]byte, 512)
	n, _ := file.Read(buf)
	contentType := http.DetectContentType(buf[:n])
	if !strings.HasPrefix(contentType, "image/") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file must be an image"})
		return
	}

	// Reset reader
	if _, err = file.Seek(0, io.SeekStart); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process file"})
		return
	}

	// Generate unique filename
	b := make([]byte, 16)
	rand.Read(b)
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == "" || ext == "." {
		ext = ".jpg"
	}
	filename := fmt.Sprintf("%d_%s%s", uid, hex.EncodeToString(b), ext)

	// Save to disk
	if err = os.MkdirAll(UploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create upload directory"})
		return
	}
	dst := filepath.Join(UploadDir, filename)
	out, err := os.Create(dst)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
		return
	}
	defer out.Close()
	size, _ := io.Copy(out, file)

	// Save record
	img := model.ExpenseImage{
		ExpenseID: exp.ID,
		UserID:    uid,
		Filename:  filename,
		MimeType:  contentType,
		Size:      size,
	}
	if err = model.DB.Create(&img).Error; err != nil {
		os.Remove(dst)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save image record"})
		return
	}

	c.JSON(http.StatusCreated, img)
}

func DeleteExpenseImage(c *gin.Context) {
	uid := middleware.CurrentUserID(c)
	imgID := c.Param("imgId")

	var img model.ExpenseImage
	if err := model.DB.Where("id = ? AND user_id = ?", imgID, uid).First(&img).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "image not found"})
		return
	}

	os.Remove(filepath.Join(UploadDir, img.Filename))
	model.DB.Delete(&img)

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
