export interface Category {
  id: number
  name: string
  color: string
  active: boolean
  createdAt: number
}

export interface ExpenseImage {
  id: number
  expenseId: number
  filename: string
  mimeType: string
  size: number
  createdAt: number
}

export interface Expense {
  id: number
  categoryId: number | null
  categoryName: string
  categoryColor: string
  amount: number
  currency: string
  description: string
  location: string
  latitude: number | null
  longitude: number | null
  note: string
  date: number
  createdAt: number
  images: ExpenseImage[]
}

export interface ExpenseForm {
  amount: string
  description: string
  categoryId: number | null
  currency: string
  date: string
  location: string
  latitude: number | null
  longitude: number | null
  note: string
}

export interface CategoryForm {
  name: string
  color: string
  active: boolean
}

export interface ChartDatum {
  name: string
  color: string
  total: number
}
