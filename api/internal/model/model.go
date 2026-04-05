package model

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"size:100;uniqueIndex;not null" json:"name"`
	Email     string         `gorm:"size:255;uniqueIndex;not null" json:"email"`
	Password  string         `gorm:"size:255;not null" json:"-"`
	Currency  string         `gorm:"size:10;default:USE" json:"currency"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Categories []Category `gorm:"foreignKey:UserID" json:"categories,omitempty"`
}

type Category struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	UserID    uint           `gorm:"not null;index" json:"user_id"`
	Name      string         `gorm:"size:255;not null" json:"name"`
	Color     string         `gorm:"size:32" json:"color"`
	Active    bool           `gorm:"default:true" json:"active"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Expenses []Expense `gorm:"foreignKey:CategoryID" json:"expenses,omitempty"`
}

type Expense struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	UserID      uint           `gorm:"not null;index" json:"user_id"`
	CategoryID  *uint          `gorm:"index" json:"category_id"`
	Amount      float64        `gorm:"not null" json:"amount"`
	Currency    string         `gorm:"size:10;default:USD" json:"currency"`
	Description string         `gorm:"size:512" json:"description"`
	Note        string         `gorm:"type:text" json:"note"`
	Date        time.Time      `json:"date"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Category *Category `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
}
