package handler

import (
	"net/http"

	"mound/api/internal/middleware"
	"mound/api/internal/model"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type registerReq struct {
	Name     string `json:"name"     binding:"required,min=1,max=100"`
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

func setTokenCookie(c *gin.Context, token string) {
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie("mound_token", token, 0, "/", "", false, true)
}

func Register(c *gin.Context) {
	var req registerReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "hash failed"})
		return
	}

	var existing model.User
	if err := model.DB.Where("name = ?", req.Name).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "帳號已被使用"})
		return
	}
	if err := model.DB.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "此 Email 已被註冊"})
		return
	}

	user := model.User{Name: req.Name, Email: req.Email, Password: string(hash)}
	if err := model.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "註冊失敗，請稍後再試"})
		return
	}

	token, _ := middleware.GenerateToken(user.ID, user.Email)
	setTokenCookie(c, token)
	c.JSON(http.StatusCreated, gin.H{
		"user": gin.H{"id": user.ID, "name": user.Name, "email": user.Email},
	})
}

type loginReq struct {
	Identifier string `json:"identifier" binding:"required"`
	Password   string `json:"password"   binding:"required"`
}

func Login(c *gin.Context) {
	var req loginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user model.User
	if err := model.DB.Where("email = ? OR name = ?", req.Identifier, req.Identifier).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, _ := middleware.GenerateToken(user.ID, user.Email)
	setTokenCookie(c, token)
	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{"id": user.ID, "name": user.Name, "email": user.Email},
	})
}

func Logout(c *gin.Context) {
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie("mound_token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

func Me(c *gin.Context) {
	uid := middleware.CurrentUserID(c)
	var user model.User
	if err := model.DB.First(&user, uid).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"id": user.ID, "name": user.Name, "email": user.Email, "currency": user.Currency})
}

type updateSettingsReq struct {
	Currency string `json:"currency" binding:"required,min=1,max=10"`
}

func UpdateSettings(c *gin.Context) {
	var req updateSettingsReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	uid := middleware.CurrentUserID(c)
	if err := model.DB.Model(&model.User{}).Where("id = ?", uid).Update("currency", req.Currency).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"currency": req.Currency})
}
