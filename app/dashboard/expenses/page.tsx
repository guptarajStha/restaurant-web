"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash, Calendar } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { createExpense, updateExpense, deleteExpense, getExpenses } from "@/lib/expenses"

interface Expense {
  id: string
  amount: number
  category: string
  description: string
  date: string
}

const expenseCategories = [
  "Ingredients",
  "Utilities",
  "Rent",
  "Salaries",
  "Equipment",
  "Maintenance",
  "Marketing",
  "Miscellaneous",
]

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null)

  // Form state
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState<Date>(new Date())

  // Filter state
  const [filterDate, setFilterDate] = useState<Date | undefined>(new Date())
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  // Summary calculations
  const todayTotal = expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.date)
      const today = filterDate || new Date()
      return (
        expenseDate.getDate() === today.getDate() &&
        expenseDate.getMonth() === today.getMonth() &&
        expenseDate.getFullYear() === today.getFullYear()
      )
    })
    .reduce((sum, expense) => sum + expense.amount, 0)

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const data = await getExpenses()
        setExpenses(data)
      } catch (error) {
        console.error("Failed to fetch expenses:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()
  }, [])

  const handleAddExpense = async () => {
    try {
      const newExpense = await createExpense({
        amount: Number.parseFloat(amount),
        category,
        description,
        date: date.toISOString(),
      })

      setExpenses([newExpense, ...expenses])
      resetForm()
      setDialogOpen(false)
    } catch (error) {
      console.error("Failed to add expense:", error)
    }
  }

  const handleEditExpense = async () => {
    if (!currentExpense) return

    try {
      const updatedExpense = await updateExpense(currentExpense.id, {
        amount: Number.parseFloat(amount),
        category,
        description,
        date: date.toISOString(),
      })

      setExpenses(expenses.map((expense) => (expense.id === currentExpense.id ? updatedExpense : expense)))
      resetForm()
      setDialogOpen(false)
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update expense:", error)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpense(id)
      setExpenses(expenses.filter((expense) => expense.id !== id))
    } catch (error) {
      console.error("Failed to delete expense:", error)
    }
  }

  const openEditDialog = (expense: Expense) => {
    setCurrentExpense(expense)
    setAmount(expense.amount.toString())
    setCategory(expense.category)
    setDescription(expense.description)
    setDate(new Date(expense.date))
    setIsEditing(true)
    setDialogOpen(true)
  }

  const openAddDialog = () => {
    resetForm()
    setIsEditing(false)
    setDialogOpen(true)
  }

  const resetForm = () => {
    setAmount("")
    setCategory("")
    setDescription("")
    setDate(new Date())
    setCurrentExpense(null)
  }

  const handleFilterDateChange = (date: Date | undefined) => {
    setFilterDate(date)
    setDatePickerOpen(false)
  }

  const filteredExpenses = expenses.filter((expense) => {
    if (!filterDate) return true

    const expenseDate = new Date(expense.date)
    return (
      expenseDate.getDate() === filterDate.getDate() &&
      expenseDate.getMonth() === filterDate.getMonth() &&
      expenseDate.getFullYear() === filterDate.getFullYear()
    )
  })

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading expenses...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Expense" : "Add New Expense"}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Update the expense details below." : "Fill in the details to add a new expense."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent mode="single" selected={date} onSelect={(date) => date && setDate(date)} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={isEditing ? handleEditExpense : handleAddExpense}>{isEditing ? "Update" : "Add"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Card className="w-full sm:w-64">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${todayTotal.toFixed(2)}</div>
          </CardContent>
        </Card>

        <div className="flex-1 flex justify-end">
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <Calendar className="mr-2 h-4 w-4" />
                {filterDate ? format(filterDate, "PPP") : "Filter by date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent mode="single" selected={filterDate} onSelect={handleFilterDateChange} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{filterDate ? `Expenses for ${format(filterDate, "MMMM d, yyyy")}` : "All Expenses"}</CardTitle>
          <CardDescription>Manage your restaurant's expenses</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              {expenses.length === 0
                ? "No expenses found. Add your first expense to get started."
                : "No expenses found for the selected date."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                    <TableCell className="font-medium">${expense.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(expense)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this expense. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteExpense(expense.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
