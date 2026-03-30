package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"rssflow/api/internal/middleware"
	"rssflow/api/internal/model"
)

// ── Categories ─────────────────────────────────────────

type categoryReq struct {
	Name   string `json:"name"   binding:"required,min=1,max=255"`
	Color  string `json:"color"`
	Active *bool  `json:"active"`
}

func ListCategories(c *gin.Context) {
	uid := middleware.CurrentUserID(c)
	var cats []model.Category
	model.DB.Where("user_id = ?", uid).Find(&cats)
	c.JSON(http.StatusOK, cats)
}

func CreateCategory(c *gin.Context) {
	uid := middleware.CurrentUserID(c)
	var req categoryReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	active := true
	if req.Active != nil {
		active = *req.Active
	}
	color := req.Color
	if color == "" {
		color = "#0ea5e9"
	}
	cat := model.Category{UserID: uid, Name: req.Name, Color: color, Active: active}
	if err := model.DB.Create(&cat).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, cat)
}

func UpdateCategory(c *gin.Context) {
	uid := middleware.CurrentUserID(c)
	id := c.Param("id")
	var cat model.Category
	if err := model.DB.Where("id = ? AND user_id = ?", id, uid).First(&cat).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "category not found"})
		return
	}
	var req categoryReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	cat.Name = req.Name
	if req.Color != "" {
		cat.Color = req.Color
	}
	if req.Active != nil {
		cat.Active = *req.Active
	}
	model.DB.Save(&cat)
	c.JSON(http.StatusOK, cat)
}

func DeleteCategory(c *gin.Context) {
	uid := middleware.CurrentUserID(c)
	id := c.Param("id")
	if err := model.DB.Where("id = ? AND user_id = ?", id, uid).Delete(&model.Category{}).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "category not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// ── Expenses ───────────────────────────────────────────

type expenseReq struct {
	CategoryID  *uint   `json:"category_id"`
	Amount      float64 `json:"amount"      binding:"required,gt=0"`
	Description string  `json:"description" binding:"required,min=1,max=512"`
	Note        string  `json:"note"`
	Date        string  `json:"date"`
}

func ListExpenses(c *gin.Context) {
	uid := middleware.CurrentUserID(c)
	size, _ := strconv.Atoi(c.DefaultQuery("size", "200"))
	if size < 1 || size > 500 {
		size = 200
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * size

	var expenses []model.Expense
	model.DB.
		Where("user_id = ?", uid).
		Preload("Category").
		Order("date DESC").
		Limit(size).Offset(offset).
		Find(&expenses)
	c.JSON(http.StatusOK, expenses)
}

func CreateExpense(c *gin.Context) {
	uid := middleware.CurrentUserID(c)
	var req expenseReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	date := time.Now()
	if req.Date != "" {
		if d, err := time.Parse("2006-01-02", req.Date); err == nil {
			date = d
		}
	}
	exp := model.Expense{
		UserID:      uid,
		CategoryID:  req.CategoryID,
		Amount:      req.Amount,
		Description: req.Description,
		Note:        req.Note,
		Date:        date,
	}
	if err := model.DB.Create(&exp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	model.DB.Preload("Category").First(&exp, exp.ID)
	c.JSON(http.StatusCreated, exp)
}

func UpdateExpense(c *gin.Context) {
	uid := middleware.CurrentUserID(c)
	id := c.Param("id")
	var exp model.Expense
	if err := model.DB.Where("id = ? AND user_id = ?", id, uid).First(&exp).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "expense not found"})
		return
	}
	var req expenseReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	exp.CategoryID = req.CategoryID
	exp.Amount = req.Amount
	exp.Description = req.Description
	exp.Note = req.Note
	if req.Date != "" {
		if d, err := time.Parse("2006-01-02", req.Date); err == nil {
			exp.Date = d
		}
	}
	model.DB.Save(&exp)
	model.DB.Preload("Category").First(&exp, exp.ID)
	c.JSON(http.StatusOK, exp)
}

func DeleteExpense(c *gin.Context) {
	uid := middleware.CurrentUserID(c)
	id := c.Param("id")
	if err := model.DB.Where("id = ? AND user_id = ?", id, uid).Delete(&model.Expense{}).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "expense not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
