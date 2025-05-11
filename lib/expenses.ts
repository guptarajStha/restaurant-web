import {
  getExpensesFromFirebase,
  createExpenseInFirebase,
  updateExpenseInFirebase,
  deleteExpenseFromFirebase,
} from "./firebase"

interface Expense {
  id: string
  amount: number
  category: string
  description: string
  date: string
}

export async function getExpenses(): Promise<Expense[]> {
  try {
    return await getExpensesFromFirebase()
  } catch (error) {
    console.error("Error getting expenses:", error)
    throw error
  }
}

export async function getExpense(id: string): Promise<Expense | undefined> {
  try {
    const expenses = await getExpensesFromFirebase()
    return expenses.find((expense) => expense.id === id)
  } catch (error) {
    console.error("Error getting expense:", error)
    throw error
  }
}

export async function createExpense(expenseData: Omit<Expense, "id">): Promise<Expense> {
  try {
    return await createExpenseInFirebase(expenseData)
  } catch (error) {
    console.error("Error creating expense:", error)
    throw error
  }
}

export async function updateExpense(id: string, expenseData: Partial<Omit<Expense, "id">>): Promise<Expense> {
  try {
    return await updateExpenseInFirebase(id, expenseData)
  } catch (error) {
    console.error("Error updating expense:", error)
    throw error
  }
}

export async function deleteExpense(id: string): Promise<void> {
  try {
    await deleteExpenseFromFirebase(id)
  } catch (error) {
    console.error("Error deleting expense:", error)
    throw error
  }
}

export async function getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
  try {
    const expenses = await getExpensesFromFirebase()
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date)
      return expenseDate >= startDate && expenseDate <= endDate
    })
  } catch (error) {
    console.error("Error getting expenses by date range:", error)
    throw error
  }
}

export async function getTodayExpenses(): Promise<Expense[]> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return await getExpensesByDateRange(today, tomorrow)
  } catch (error) {
    console.error("Error getting today's expenses:", error)
    throw error
  }
}

export async function getMonthlyExpenses(): Promise<Expense[]> {
  try {
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    return await getExpensesByDateRange(firstDayOfMonth, today)
  } catch (error) {
    console.error("Error getting monthly expenses:", error)
    throw error
  }
}
