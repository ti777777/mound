import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { authFetch, clearAuth } from './api'
import type { Category, Expense, ExpenseForm, CategoryForm, ChartDatum } from './types'
import { apiCategoryToCategory, apiExpenseToExpense, emptyExpenseForm, emptyCategoryForm, toDateStr, formatAmount } from './utils'
import Navbar from './components/Navbar'
import LeftSidebar from './components/LeftSidebar'
import ExpenseList from './components/ExpenseList'
import RightSidebar from './components/RightSidebar'
import ExpenseModal from './components/ExpenseModal'
import CategoryModal from './components/CategoryModal'
import DeleteModal from './components/DeleteModal'
import { useFilter } from './contexts/FilterContext'

export default function App() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const auth = JSON.parse(localStorage.getItem('mound_auth') ?? '{}') as { email?: string; name?: string; token?: string }
  const { dateRange, filterCategories, toggleFilterCategory, clearFilterCategories, keyword, setKeyword } = useFilter()

  async function handleLogout() {
    try { await authFetch('/api/auth/logout', { method: 'POST' }) } catch { /* noop */ }
    clearAuth()
    navigate('/login')
  }

  const [categories, setCategories] = useState<Category[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [sort, setSort] = useState<'date' | 'amount'>('date')

  // Expense modals
  const [addExpOpen, setAddExpOpen] = useState(false)
  const [addExpForm, setAddExpForm] = useState<ExpenseForm>(emptyExpenseForm())
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [editExpForm, setEditExpForm] = useState<ExpenseForm>(emptyExpenseForm())
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null)

  // Category modals
  const [addCatOpen, setAddCatOpen] = useState(false)
  const [addCatForm, setAddCatForm] = useState<CategoryForm>(emptyCategoryForm())
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [editCatForm, setEditCatForm] = useState<CategoryForm>(emptyCategoryForm())
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)

  // CSV Export
  const handleExportCSV = async () => {
    const res = await authFetch('/api/expenses/export')
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mound-expenses-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Keywords
  const [keywords, setKeywords] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('mound_keywords') ?? '[]') } catch { return [] }
  })
  const [newKeyword, setNewKeyword] = useState('')

  const saveKeywords = (kws: string[]) => {
    setKeywords(kws)
    localStorage.setItem('mound_keywords', JSON.stringify(kws))
  }
  const handleAddKeyword = () => {
    const kw = newKeyword.trim()
    if (!kw || keywords.includes(kw)) { setNewKeyword(''); return }
    saveKeywords([...keywords, kw])
    setNewKeyword('')
  }
  const handleDeleteKeyword = (kw: string) => saveKeywords(keywords.filter(k => k !== kw))

  useEffect(() => {
    async function loadData() {
      setLoading(true); setApiError(null)
      try {
        const [catsRes, expsRes] = await Promise.all([
          authFetch('/api/categories'),
          authFetch('/api/expenses?size=500'),
        ])
        if (catsRes.status === 401 || expsRes.status === 401) { clearAuth(); navigate('/login'); return }
        if (!catsRes.ok || !expsRes.ok) throw new Error(t('app.loadFailed'))
        const catsData = await catsRes.json()
        const expsData = await expsRes.json()
        const parsedCats: Category[] = (catsData ?? []).map(apiCategoryToCategory)
        const catsById = new Map(parsedCats.map(c => [c.id, c]))
        setCategories(parsedCats)
        setExpenses((expsData ?? []).map((e: unknown) => apiExpenseToExpense(e, catsById)))
      } catch (e) {
        setApiError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Stats
  const activeCategories = categories.filter(c => c.active)

  const rangeExpenses = useMemo(() =>
    expenses.filter(e => {
      if (!dateRange.start) return true
      const d = toDateStr(e.date)
      const end = dateRange.end ?? dateRange.start
      return d >= dateRange.start && d <= end
    }),
    [expenses, dateRange]
  )

  const categoryFilteredExpenses = useMemo(() =>
    filterCategories.length === 0
      ? rangeExpenses
      : rangeExpenses.filter(e => filterCategories.includes(e.categoryName)),
    [rangeExpenses, filterCategories]
  )

  const rangeTotal = categoryFilteredExpenses.reduce((s, e) => s + e.amount, 0)

  const categoryTotals = useMemo<ChartDatum[]>(() => {
    const map = new Map<string, { color: string; total: number }>()
    categoryFilteredExpenses.forEach(e => {
      const key = e.categoryName
      const cur = map.get(key)
      if (cur) cur.total += e.amount
      else map.set(key, { color: e.categoryColor, total: e.amount })
    })
    return Array.from(map.entries())
      .map(([name, { color, total }]) => ({ name, color, total }))
      .sort((a, b) => b.total - a.total)
  }, [categoryFilteredExpenses])

  // Filtered list
  const visibleExpenses = categoryFilteredExpenses
    .filter(e => {
      if (keyword) {
        const q = keyword.toLowerCase()
        if (!e.description.toLowerCase().includes(q) && !e.categoryName.toLowerCase().includes(q)) return false
      }
      return true
    })
    .sort((a, b) => sort === 'amount' ? b.amount - a.amount : b.date - a.date)

  // ── Add Expense ──────────────────────────────────────
  const handleAddExpOpen = () => { setAddExpForm(emptyExpenseForm()); setFormError(null); setAddExpOpen(true) }
  const handleAddExpSubmit = async () => {
    setSubmitting(true); setFormError(null)
    try {
      const res = await authFetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(addExpForm.amount),
          description: addExpForm.description,
          category_id: addExpForm.categoryId || undefined,
          date: addExpForm.date,
          note: addExpForm.note,
        }),
      })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as {error?: string}).error ?? t('expense.addFailed')) }
      const catsById = new Map(categories.map(c => [c.id, c]))
      const newExp = apiExpenseToExpense(await res.json(), catsById)
      setExpenses(prev => [newExp, ...prev])
      setAddExpOpen(false)
    } catch (e) { setFormError((e as Error).message) }
    finally { setSubmitting(false) }
  }

  // ── Edit Expense ─────────────────────────────────────
  const handleEditExpOpen = (exp: Expense) => {
    setEditExpense(exp)
    setEditExpForm({ amount: String(exp.amount), description: exp.description, categoryId: exp.categoryId, date: toDateStr(exp.date), note: exp.note })
    setFormError(null)
  }
  const handleEditExpSubmit = async () => {
    if (!editExpense) return
    setSubmitting(true); setFormError(null)
    try {
      const res = await authFetch(`/api/expenses/${editExpense.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          amount: parseFloat(editExpForm.amount),
          description: editExpForm.description,
          category_id: editExpForm.categoryId || undefined,
          date: editExpForm.date,
          note: editExpForm.note,
        }),
      })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as {error?: string}).error ?? t('expense.saveFailed')) }
      const catsById = new Map(categories.map(c => [c.id, c]))
      const updated = apiExpenseToExpense(await res.json(), catsById)
      setExpenses(prev => prev.map(e => e.id === editExpense.id ? updated : e))
      setEditExpense(null)
    } catch (e) { setFormError((e as Error).message) }
    finally { setSubmitting(false) }
  }

  // ── Delete Expense ───────────────────────────────────
  const handleDeleteExpConfirm = async () => {
    if (!deleteExpense) return
    setSubmitting(true)
    try {
      await authFetch(`/api/expenses/${deleteExpense.id}`, { method: 'DELETE' })
      setExpenses(prev => prev.filter(e => e.id !== deleteExpense.id))
    } catch { /* ignore */ }
    finally { setSubmitting(false); setDeleteExpense(null) }
  }

  // ── Add Category ─────────────────────────────────────
  const handleAddCatOpen = () => { setAddCatForm(emptyCategoryForm()); setFormError(null); setAddCatOpen(true) }
  const handleAddCatSubmit = async () => {
    setSubmitting(true); setFormError(null)
    try {
      const res = await authFetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: addCatForm.name, color: addCatForm.color, active: addCatForm.active }),
      })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as {error?: string}).error ?? t('category.addFailed')) }
      const newCat = await res.json()
      setCategories(prev => [...prev, apiCategoryToCategory(newCat)])
      setAddCatOpen(false)
    } catch (e) { setFormError((e as Error).message) }
    finally { setSubmitting(false) }
  }

  // ── Edit Category ────────────────────────────────────
  const handleEditCatOpen = (cat: Category) => {
    setEditCategory(cat)
    setEditCatForm({ name: cat.name, color: cat.color, active: cat.active })
    setFormError(null)
  }
  const handleEditCatSubmit = async () => {
    if (!editCategory) return
    setSubmitting(true); setFormError(null)
    try {
      const res = await authFetch(`/api/categories/${editCategory.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editCatForm.name, color: editCatForm.color, active: editCatForm.active }),
      })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as {error?: string}).error ?? t('category.saveFailed')) }
      const updated = apiCategoryToCategory(await res.json())
      setCategories(prev => prev.map(c => c.id === editCategory.id ? updated : c))
      setExpenses(prev => prev.map(e => e.categoryId === updated.id
        ? { ...e, categoryName: updated.name, categoryColor: updated.color } : e))
      setEditCategory(null)
    } catch (e) { setFormError((e as Error).message) }
    finally { setSubmitting(false) }
  }

  // ── Delete Category ──────────────────────────────────
  const handleDeleteCatConfirm = async () => {
    if (!deleteCategory) return
    setSubmitting(true)
    try {
      await authFetch(`/api/categories/${deleteCategory.id}`, { method: 'DELETE' })
      setCategories(prev => prev.filter(c => c.id !== deleteCategory.id))
      setExpenses(prev => prev.map(e => e.categoryId === deleteCategory.id
        ? { ...e, categoryId: null, categoryName: t('common.uncategorized'), categoryColor: '#94a3b8' } : e))
    } catch { /* ignore */ }
    finally { setSubmitting(false); setDeleteCategory(null) }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar auth={auth} onAddExpense={handleAddExpOpen} onLogout={handleLogout} onExportCSV={handleExportCSV}/>

      {apiError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-600 text-center">
          {apiError}
          <button className="ml-3 underline" onClick={() => window.location.reload()}>{t('common.reload')}</button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-6 xl:gap-8">
          <LeftSidebar
            open={leftOpen}
            onClose={() => setLeftOpen(false)}
            rangeTotal={rangeTotal}
            rangeCount={rangeExpenses.length}
            categoriesCount={categories.length}
            activeCategories={activeCategories}
            categoryTotals={categoryTotals}
          />

          <ExpenseList
            loading={loading}
            expenses={expenses}
            visibleExpenses={visibleExpenses}
            sort={sort}
            onSort={setSort}
            onAddExpense={handleAddExpOpen}
            onEdit={handleEditExpOpen}
            onDelete={setDeleteExpense}
          />

          <RightSidebar
            open={rightOpen}
            onClose={() => setRightOpen(false)}
            expenses={expenses}
            loading={loading}
            categories={categories}
            onAddCategory={handleAddCatOpen}
            onEditCategory={handleEditCatOpen}
            onDeleteCategory={setDeleteCategory}
            keywords={keywords}
            newKeyword={newKeyword}
            onNewKeywordChange={setNewKeyword}
            onAddKeyword={handleAddKeyword}
            onDeleteKeyword={handleDeleteKeyword}
          />
        </div>
      </div>

      {/* Sidebar toggle buttons */}
      <button
        onClick={() => setLeftOpen(true)}
        className="lg:hidden fixed left-0 top-1/2 -translate-y-1/2 z-30 bg-white border border-[#e2e8f0] border-l-0 rounded-r-xl px-1.5 py-3 shadow-md text-[#94a3b8] hover:text-[#0ea5e9] hover:border-[#bae6fd] transition-colors"
        title={t('app.showLeftPanel')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
      </button>
      <button
        onClick={() => setRightOpen(true)}
        className="xl:hidden fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-white border border-[#e2e8f0] border-r-0 rounded-l-xl px-1.5 py-3 shadow-md text-[#94a3b8] hover:text-[#0ea5e9] hover:border-[#bae6fd] transition-colors"
        title={t('app.showRightPanel')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
      </button>

      {/* Modals */}
      <ExpenseModal open={addExpOpen} title={t('expense.addTitle')} isEdit={false}
        form={addExpForm} categories={categories} keywords={keywords}
        onFormChange={setAddExpForm} onSubmit={handleAddExpSubmit}
        onClose={() => setAddExpOpen(false)} submitting={submitting} apiError={formError}/>

      <ExpenseModal open={editExpense !== null} title={t('expense.editTitle')} isEdit={true}
        form={editExpForm} categories={categories} keywords={keywords}
        onFormChange={setEditExpForm} onSubmit={handleEditExpSubmit}
        onClose={() => setEditExpense(null)} submitting={submitting} apiError={formError}/>

      <CategoryModal open={addCatOpen} title={t('category.addTitle')} isEdit={false}
        form={addCatForm} onFormChange={setAddCatForm}
        onSubmit={handleAddCatSubmit} onClose={() => setAddCatOpen(false)}
        submitting={submitting} apiError={formError}/>

      <CategoryModal open={editCategory !== null} title={t('category.editTitle')} isEdit={true}
        form={editCatForm} onFormChange={setEditCatForm}
        onSubmit={handleEditCatSubmit} onClose={() => setEditCategory(null)}
        submitting={submitting} apiError={formError}/>

      <DeleteModal
        message={deleteExpense ? t('deleteModal.expenseMessage', { description: deleteExpense.description, amount: formatAmount(deleteExpense.amount) }) : null}
        onConfirm={handleDeleteExpConfirm} onClose={() => setDeleteExpense(null)} submitting={submitting}/>

      <DeleteModal
        message={deleteCategory ? t('deleteModal.categoryMessage', { name: deleteCategory.name }) : null}
        onConfirm={handleDeleteCatConfirm} onClose={() => setDeleteCategory(null)} submitting={submitting}/>
    </div>
  )
}
