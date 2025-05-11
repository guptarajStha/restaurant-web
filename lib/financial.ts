import { getTodayExpenses, getMonthlyExpenses, getExpensesByDateRange } from "./expenses"
import { startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"

interface FinancialSummary {
  todayIncome: number
  todayExpenses: number
  todayNetIncome: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyNetIncome: number
}

interface DailyFinancial {
  date: string
  income: number
  expenses: number
  netIncome: number
}

// Mock implementation of income functions
async function getTodayIncome(): Promise<number> {
  // In a real app, this would query your database for today's income
  await new Promise((resolve) => setTimeout(resolve, 300))
  return 1250.75
}

async function getMonthlyIncome(): Promise<number> {
  // In a real app, this would query your database for this month's income
  await new Promise((resolve) => setTimeout(resolve, 300))
  return 28750.5
}

async function getIncomeByDateRange(startDate: Date, endDate: Date): Promise<{ date: string; amount: number }[]> {
  // In a real app, this would query your database for income within a date range
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Generate some mock data for each day in the range
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  return days.map((day) => ({
    date: day.toISOString(),
    amount: Math.random() * 1500 + 500, // Random amount between 500 and 2000
  }))
}

export async function getFinancialSummary(): Promise<FinancialSummary> {
  // Get today's financial data
  const [todayIncome, todayExpenses] = await Promise.all([
    getTodayIncome(),
    getTodayExpenses().then((expenses) => expenses.reduce((sum, exp) => sum + exp.amount, 0)),
  ])

  // Get monthly financial data
  const [monthlyIncome, monthlyExpenses] = await Promise.all([
    getMonthlyIncome(),
    getMonthlyExpenses().then((expenses) => expenses.reduce((sum, exp) => sum + exp.amount, 0)),
  ])

  return {
    todayIncome,
    todayExpenses,
    todayNetIncome: todayIncome - todayExpenses,
    monthlyIncome,
    monthlyExpenses,
    monthlyNetIncome: monthlyIncome - monthlyExpenses,
  }
}

export async function getMonthlyFinancialData(): Promise<DailyFinancial[]> {
  const today = new Date()
  const firstDay = startOfMonth(today)
  const lastDay = endOfMonth(today)

  // Get income and expenses for the month
  const [incomeData, expensesData] = await Promise.all([
    getIncomeByDateRange(firstDay, lastDay),
    getExpensesByDateRange(firstDay, lastDay),
  ])

  // Create a map of dates to financial data
  const financialMap = new Map<string, DailyFinancial>()

  // Initialize with all days of the month
  const daysInMonth = eachDayOfInterval({ start: firstDay, end: lastDay })
  daysInMonth.forEach((day) => {
    const dateStr = day.toISOString()
    financialMap.set(dateStr, {
      date: dateStr,
      income: 0,
      expenses: 0,
      netIncome: 0,
    })
  })

  // Add income data
  incomeData.forEach((income) => {
    const day = new Date(income.date)
    day.setHours(0, 0, 0, 0)
    const dateStr = day.toISOString()

    const existing = financialMap.get(dateStr) || {
      date: dateStr,
      income: 0,
      expenses: 0,
      netIncome: 0,
    }

    existing.income += income.amount
    existing.netIncome = existing.income - existing.expenses
    financialMap.set(dateStr, existing)
  })

  // Add expense data
  expensesData.forEach((expense) => {
    const day = new Date(expense.date)
    day.setHours(0, 0, 0, 0)
    const dateStr = day.toISOString()

    const existing = financialMap.get(dateStr) || {
      date: dateStr,
      income: 0,
      expenses: 0,
      netIncome: 0,
    }

    existing.expenses += expense.amount
    existing.netIncome = existing.income - existing.expenses
    financialMap.set(dateStr, existing)
  })

  // Convert map to array and sort by date
  return Array.from(financialMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}
