import {
  getBillsFromFirebase,
  createBillInFirebase,
  updateBillStatusInFirebase,
  applyDiscountToFirebaseBill,
  deleteBillFromFirebase,
} from "./firebase"

interface OrderItem {
  id: string
  itemId: string
  itemName: string
  quantity: number
  price: number
}

interface Order {
  id: string
  tableId: string
  tableName: string
  status: string
  items: OrderItem[]
  total: number
  createdAt: string
  customerName?: string
  customerPhone?: string
}

interface Bill {
  id: string
  orders: Order[]
  customerName: string
  customerPhone: string
  subtotal: number
  discountPercent: number
  discountAmount: number
  // tax: number
  total: number
  paymentStatus: "paid" | "pending"
  paymentMethod?: "cash" | "card" | "online"
  createdAt: string
  updatedAt: string
}

export async function getBills(): Promise<Bill[]> {
  try {
    return await getBillsFromFirebase()
  } catch (error) {
    console.error("Error getting bills:", error)
    throw error
  }
}

export async function getTotalIncome(): Promise<Bill[]> {
  try {
    return await getBillsFromFirebase()
  } catch (error) {
    console.error("Error getting bills:", error)
    throw error
  }
}

export async function getBill(id: string): Promise<Bill | undefined> {
  try {
    const bills = await getBillsFromFirebase()
    return bills.find((bill) => bill.id === id)
  } catch (error) {
    console.error("Error getting bill:", error)
    throw error
  }
}

interface CreateBillInput {
  orders: Order[]
  customerName: string
  customerPhone: string
}

export async function createBill(billData: CreateBillInput): Promise<Bill> {
  try {
    return await createBillInFirebase(billData)
  } catch (error) {
    console.error("Error creating bill:", error)
    throw error
  }
}

export async function updateBillStatus(
  id: string,
  status: "paid" | "pending",
  paymentMethod?: "cash" | "card" | "online",
): Promise<Bill> {
  try {
    return await updateBillStatusInFirebase(id, status, paymentMethod)
  } catch (error) {
    console.error("Error updating bill status:", error)
    throw error
  }
}

export async function applyDiscount(id: string, discountPercent: number): Promise<Bill> {
  try {
    return await applyDiscountToFirebaseBill(id, discountPercent)
  } catch (error) {
    console.error("Error applying discount to bill:", error)
    throw error
  }
}

export async function mergeBills(billsToMerge: Bill[]): Promise<Bill> {
  try {
    // This would need to be implemented in Firebase
    // For now, we'll just create a new bill with all the orders
    const allOrders = billsToMerge.flatMap((bill) => bill.orders)
    const { customerName, customerPhone } = billsToMerge[0]

    const newBill = await createBill({
      orders: allOrders,
      customerName,
      customerPhone,
    })

    // Delete the original bills
    await Promise.all(billsToMerge.map((bill) => deleteBill(bill.id)))

    return newBill
  } catch (error) {
    console.error("Error merging bills:", error)
    throw error
  }
}

export async function deleteBill(id: string): Promise<void> {
  try {
    await deleteBillFromFirebase(id)
  } catch (error) {
    console.error("Error deleting bill:", error)
    throw error
  }
}
export async function getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Bill[]> {
  try {
    const bills = await getBillsFromFirebase()
    return bills.filter((bill) => {
      const billDate = new Date(bill.createdAt)
      return billDate >= startDate && billDate <= endDate
    })
  } catch (error) {
    console.error("Error getting expenses by date range:", error)
    throw error
  }
}

export async function getTodayIncomes(): Promise<Bill[]> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return await getIncomesByDateRange(today, tomorrow)
  } catch (error) {
    console.error("Error getting today's Incomes:", error)
    throw error
  }
}

export async function getMonthlyIncomes(): Promise<Expense[]> {
  try {
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    return await getIncomesByDateRange(firstDayOfMonth, today)
  } catch (error) {
    console.error("Error getting monthly Incomes:", error)
    throw error
  }
}