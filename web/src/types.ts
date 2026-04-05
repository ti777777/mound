export interface Category {
  id: number
  name: string
  color: string
  active: boolean
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
  note: string
  date: number
}

export interface ExpenseForm {
  amount: string
  description: string
  categoryId: number | null
  currency: string
  date: string
  location: string
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
