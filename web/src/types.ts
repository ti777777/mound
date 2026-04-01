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
  description: string
  note: string
  date: number
}

export interface ExpenseForm {
  amount: string
  description: string
  categoryId: number | null
  date: string
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
