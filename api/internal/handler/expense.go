package handler

import (
	"bytes"
	"encoding/csv"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"mound/api/internal/middleware"
	"mound/api/internal/model"
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
	CategoryID  *uint    `json:"category_id"`
	Amount      float64  `json:"amount"      binding:"required,gt=0"`
	Currency    string   `json:"currency"`
	Description string   `json:"description" binding:"required,min=1,max=512"`
	Location    string   `json:"location"`
	Latitude    *float64 `json:"latitude"`
	Longitude   *float64 `json:"longitude"`
	Note        string   `json:"note"`
	Date        string   `json:"date"`
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
		Currency:    req.Currency,
		Description: req.Description,
		Location:    req.Location,
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
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
	if req.Currency != "" {
		exp.Currency = req.Currency
	}
	exp.Description = req.Description
	exp.Location = req.Location
	exp.Latitude = req.Latitude
	exp.Longitude = req.Longitude
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

func ExportExpensesCSV(c *gin.Context) {
	uid := middleware.CurrentUserID(c)
	var expenses []model.Expense
	model.DB.
		Where("user_id = ?", uid).
		Preload("Category").
		Order("date DESC").
		Find(&expenses)

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", `attachment; filename="mound-expenses.csv"`)

	// UTF-8 BOM for Excel compatibility
	c.Writer.Write([]byte{0xEF, 0xBB, 0xBF})

	w := csv.NewWriter(c.Writer)
	w.Write([]string{"Date", "Description", "Category", "Currency", "Amount", "Location", "Latitude", "Longitude", "Note"})
	for _, e := range expenses {
		catName := ""
		if e.Category != nil {
			catName = e.Category.Name
		}
		latStr := ""
		lngStr := ""
		if e.Latitude != nil {
			latStr = strconv.FormatFloat(*e.Latitude, 'f', 6, 64)
		}
		if e.Longitude != nil {
			lngStr = strconv.FormatFloat(*e.Longitude, 'f', 6, 64)
		}
		w.Write([]string{
			e.Date.Format("2006-01-02"),
			e.Description,
			catName,
			e.Currency,
			strconv.FormatFloat(e.Amount, 'f', -1, 64),
			e.Location,
			latStr,
			lngStr,
			e.Note,
		})
	}
	w.Flush()
}

func parseCSVExpenses(c *gin.Context, uid uint) ([]model.Expense, error) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		return nil, err
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return nil, err
	}

	// Strip UTF-8 BOM
	data = bytes.TrimPrefix(data, []byte{0xEF, 0xBB, 0xBF})

	r := csv.NewReader(bytes.NewReader(data))
	r.FieldsPerRecord = -1 // allow variable field counts
	r.LazyQuotes = true

	// Skip header row
	if _, err := r.Read(); err != nil {
		return nil, err
	}

	// Load existing categories for name matching
	var cats []model.Category
	model.DB.Where("user_id = ?", uid).Find(&cats)
	catByName := make(map[string]uint)
	for _, cat := range cats {
		catByName[strings.ToLower(cat.Name)] = cat.ID
	}

	var expenses []model.Expense
	for {
		row, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil || len(row) < 5 {
			continue
		}

		dateStr := strings.TrimSpace(row[0])
		var date time.Time
		for _, layout := range []string{"2006-01-02", "2006/01/02", "2006/1/2", "01/02/2006", "02/01/2006"} {
			if d, e := time.Parse(layout, dateStr); e == nil {
				date = d
				break
			}
		}
		if date.IsZero() {
			continue
		}
		amount, err := strconv.ParseFloat(strings.TrimSpace(row[4]), 64)
		if err != nil || amount <= 0 {
			continue
		}

		var catID *uint
		if catName := strings.TrimSpace(row[2]); catName != "" {
			if id, ok := catByName[strings.ToLower(catName)]; ok {
				id := id
				catID = &id
			} else {
				newCat := model.Category{UserID: uid, Name: catName, Color: "#94a3b8", Active: true}
				model.DB.Create(&newCat)
				catByName[strings.ToLower(catName)] = newCat.ID
				newID := newCat.ID
				catID = &newID
			}
		}

		location := ""
		note := ""
		var lat, lng *float64
		// Format support:
		// 6 cols: Date,Desc,Cat,Currency,Amount,Note (old)
		// 7 cols: Date,Desc,Cat,Currency,Amount,Location,Note (v2)
		// 9 cols: Date,Desc,Cat,Currency,Amount,Location,Latitude,Longitude,Note (v3)
		if len(row) == 6 {
			note = strings.TrimSpace(row[5])
		} else if len(row) == 7 || len(row) == 8 {
			location = strings.TrimSpace(row[5])
			note = strings.TrimSpace(row[len(row)-1])
		} else if len(row) >= 9 {
			location = strings.TrimSpace(row[5])
			if v, err := strconv.ParseFloat(strings.TrimSpace(row[6]), 64); err == nil {
				lat = &v
			}
			if v, err := strconv.ParseFloat(strings.TrimSpace(row[7]), 64); err == nil {
				lng = &v
			}
			note = strings.TrimSpace(row[8])
		}

		expenses = append(expenses, model.Expense{
			UserID:      uid,
			CategoryID:  catID,
			Amount:      amount,
			Currency:    strings.TrimSpace(row[3]),
			Description: strings.TrimSpace(row[1]),
			Location:    location,
			Latitude:    lat,
			Longitude:   lng,
			Note:        note,
			Date:        date,
		})
	}
	return expenses, nil
}

func ImportExpensesOverwrite(c *gin.Context) {
	uid := middleware.CurrentUserID(c)
	expenses, err := parseCSVExpenses(c, uid)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	model.DB.Where("user_id = ?", uid).Delete(&model.Expense{})
	if len(expenses) > 0 {
		model.DB.Create(&expenses)
	}
	c.JSON(http.StatusOK, gin.H{"imported": len(expenses)})
}

func ImportExpensesAppend(c *gin.Context) {
	uid := middleware.CurrentUserID(c)
	expenses, err := parseCSVExpenses(c, uid)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if len(expenses) > 0 {
		model.DB.Create(&expenses)
	}
	c.JSON(http.StatusOK, gin.H{"imported": len(expenses)})
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
