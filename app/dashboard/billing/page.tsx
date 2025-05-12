"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, FileText, Printer, CreditCard, DollarSign, Percent, Check } from "lucide-react"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { getBills, createBill, updateBillStatus, applyDiscount, mergeBills } from "@/lib/bills"
import { getOrders } from "@/lib/orders"

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
  discountType: "percentage" | "flat"
  discountPercent: number
  discountAmount: number
  tax: number
  total: number
  paymentStatus: "paid" | "pending"
  paymentMethod?: "cash" | "card" | "online"
  createdAt: string
  updatedAt: string
}

export default function BillingPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Bill details dialog
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)

  // New bill dialog
  const [newBillDialogOpen, setNewBillDialogOpen] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")

  // Merge bills dialog
  const [mergeBillsDialogOpen, setMergeBillsDialogOpen] = useState(false)
  const [billsToMerge, setBillsToMerge] = useState<string[]>([])

  // Discount dialog
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false)
  const [discountType, setDiscountType] = useState<"percentage" | "flat">("percentage")
  const [discountValue, setDiscountValue] = useState(0)
  const [discountBillId, setDiscountBillId] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [billsData, ordersData] = await Promise.all([getBills(), getOrders()])
        setBills(billsData)

        // Filter out orders that are already in bills
        const billOrderIds = billsData.flatMap((bill) => bill.orders.map((order) => order.id))
        const availableOrders = ordersData.filter(
          (order) => !billOrderIds.includes(order.id) && ["delivered", "ready"].includes(order.status),
        )
        setOrders(availableOrders)
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleCreateBill = async () => {
    if (selectedOrders.length === 0) return

    try {
      const selectedOrdersData = orders.filter((order) => selectedOrders.includes(order.id))

      const newBill = await createBill({
        orders: selectedOrdersData,
        customerName,
        customerPhone,
      })

      setBills([newBill, ...bills])

      // Remove the orders that are now in a bill
      setOrders(orders.filter((order) => !selectedOrders.includes(order.id)))

      resetNewBillForm()
      setNewBillDialogOpen(false)
    } catch (error) {
      console.error("Failed to create bill:", error)
    }
  }

  const handleMergeBills = async () => {
    if (billsToMerge.length < 2) return

    try {
      const selectedBillsData = bills.filter((bill) => billsToMerge.includes(bill.id))

      const mergedBill = await mergeBills(selectedBillsData)

      // Remove the original bills and add the merged one
      setBills([mergedBill, ...bills.filter((bill) => !billsToMerge.includes(bill.id))])

      resetMergeBillsForm()
      setMergeBillsDialogOpen(false)
    } catch (error) {
      console.error("Failed to merge bills:", error)
    }
  }

  const handleUpdatePaymentStatus = async (
    billId: string,
    status: "paid" | "pending",
    method?: "cash" | "card" | "online",
  ) => {
    try {
      const updatedBill = await updateBillStatus(billId, status, method)

      setBills(bills.map((bill) => (bill.id === billId ? updatedBill : bill)))

      if (selectedBill?.id === billId) {
        setSelectedBill(updatedBill)
      }
    } catch (error) {
      console.error("Failed to update bill status:", error)
    }
  }

  const handleApplyDiscount = async () => {
    if (!discountBillId || discountValue <= 0) return

    try {
      const updatedBill = await applyDiscount(discountBillId, discountType, discountValue)

      setBills(bills.map((bill) => (bill.id === discountBillId ? updatedBill : bill)))

      if (selectedBill?.id === discountBillId) {
        setSelectedBill(updatedBill)
      }

      setDiscountDialogOpen(false)
      setDiscountValue(0)
      setDiscountBillId("")
    } catch (error) {
      console.error("Failed to apply discount:", error)
    }
  }

  const openBillDetails = (bill: Bill) => {
    setSelectedBill(bill)
    setDetailsDialogOpen(true)
  }

  const openDiscountDialog = (billId: string) => {
    setDiscountBillId(billId)
    setDiscountType("percentage")
    setDiscountValue(0)
    setDiscountDialogOpen(true)
  }

  const resetNewBillForm = () => {
    setSelectedOrders([])
    setCustomerName("")
    setCustomerPhone("")
  }

  const resetMergeBillsForm = () => {
    setBillsToMerge([])
  }

  const handleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]))
  }

  const handleBillSelection = (billId: string) => {
    setBillsToMerge((prev) => (prev.includes(billId) ? prev.filter((id) => id !== billId) : [...prev, billId]))
  }

  const printBill = (bill: Bill) => {
    // Create a new window for printing
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    // Generate HTML content for the bill
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill #${bill.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .bill { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 20px; }
          .customer-info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          .summary { margin-top: 30px; text-align: right; }
          .footer { margin-top: 50px; text-align: center; font-size: 14px; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="bill">
          <div class="header">
            <h1>Restaurant Bill</h1>
            <p>Bill #: ${bill.id}</p>
            <p>Date: ${new Date(bill.createdAt).toLocaleString()}</p>
          </div>
          
          <div class="customer-info">
            <h3>Customer Information</h3>
            <p>Name: ${bill.customerName || "N/A"}</p>
            <p>Phone: ${bill.customerPhone || "N/A"}</p>
          </div>
          
          <h3>Order Details</h3>
          ${bill.orders
            .map(
              (order, orderIndex) => `
            <div style="margin-bottom: 20px;">
              <p><strong>Order #${orderIndex + 1}</strong> - Table: ${order.tableName}</p>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items
                    .map(
                      (item) => `
                    <tr>
                      <td>${item.itemName}</td>
                      <td>${item.quantity}</td>
                      <td>$${item.price.toFixed(2)}</td>
                      <td>$${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `,
            )
            .join("")}
          
          <div class="summary">
            <p><strong>Subtotal:</strong> $${bill.subtotal.toFixed(2)}</p>
            ${
              bill.discountAmount > 0
                ? `
              <p><strong>Discount ${
                bill.discountType === "percentage"
                  ? `(${bill.discountPercent}%)`
                  : `(Flat $${bill.discountAmount.toFixed(2)})`
              }:</strong> -$${bill.discountAmount.toFixed(2)}</p>
            `
                : ""
            }
            <p><strong>Tax:</strong> $${bill.tax.toFixed(2)}</p>
            <p style="font-size: 1.2em;"><strong>Total:</strong> $${bill.total.toFixed(2)}</p>
            <p><strong>Payment Status:</strong> ${bill.paymentStatus.toUpperCase()}</p>
            ${bill.paymentMethod ? `<p><strong>Payment Method:</strong> ${bill.paymentMethod.toUpperCase()}</p>` : ""}
          </div>
          
          <div class="footer">
            <p>Thank you for dining with us!</p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()">Print Bill</button>
        </div>
      </body>
      </html>
    `

    // Write the content to the new window and print
    printWindow.document.open()
    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.focus()
  }

  const filteredBills = bills.filter((bill) => {
    // Filter by search term
    const matchesSearch =
      bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.orders.some((order) => order.tableName.toLowerCase().includes(searchTerm.toLowerCase()))

    // Filter by tab
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "paid" && bill.paymentStatus === "paid") ||
      (activeTab === "pending" && bill.paymentStatus === "pending")

    return matchesSearch && matchesTab
  })

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading billing data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Billing</h1>
        <div className="flex gap-2">
          <Dialog open={newBillDialogOpen} onOpenChange={setNewBillDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={orders.length === 0}>Create Bill</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Bill</DialogTitle>
                <DialogDescription>
                  Select orders to include in this bill and enter customer information.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customerPhone">Customer Phone</Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter customer phone"
                  />
                </div>

                <div className="space-y-4">
                  <Label>Select Orders</Label>
                  {orders.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No available orders to bill. Orders must be in "ready" or "delivered" status.
                    </div>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Table</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedOrders.includes(order.id)}
                                  onCheckedChange={() => handleOrderSelection(order.id)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{order.id.slice(0, 8)}</TableCell>
                              <TableCell>{order.tableName}</TableCell>
                              <TableCell>{order.items.length}</TableCell>
                              <TableCell>${order.total.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleCreateBill} disabled={selectedOrders.length === 0}>
                  Create Bill
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={mergeBillsDialogOpen} onOpenChange={setMergeBillsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={bills.filter((b) => b.paymentStatus === "pending").length < 2}>
                Merge Bills
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Merge Bills</DialogTitle>
                <DialogDescription>
                  Select pending bills to merge. This is useful when the same customer has multiple orders.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Label>Select Bills to Merge</Label>
                {bills.filter((b) => b.paymentStatus === "pending").length < 2 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    You need at least two pending bills to merge.
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Bill ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Orders</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bills
                          .filter((bill) => bill.paymentStatus === "pending")
                          .map((bill) => (
                            <TableRow key={bill.id}>
                              <TableCell>
                                <Checkbox
                                  checked={billsToMerge.includes(bill.id)}
                                  onCheckedChange={() => handleBillSelection(bill.id)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{bill.id.slice(0, 8)}</TableCell>
                              <TableCell>{bill.customerName || "N/A"}</TableCell>
                              <TableCell>{bill.orders.length}</TableCell>
                              <TableCell>${bill.total.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleMergeBills} disabled={billsToMerge.length < 2}>
                  Merge Selected Bills
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search bills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs defaultValue="all" className="w-full sm:w-auto" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Bills</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bills</CardTitle>
          <CardDescription>Manage customer bills and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBills.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              {bills.length === 0
                ? "No bills found. Create your first bill to get started."
                : "No bills match your search criteria."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.id.slice(0, 8)}</TableCell>
                    <TableCell>{bill.customerName || "N/A"}</TableCell>
                    <TableCell>{bill.orders.length}</TableCell>
                    <TableCell>${bill.subtotal.toFixed(2)}</TableCell>
                    <TableCell>
                      {bill.discountAmount > 0 ? (
                        <span className="text-green-600">
                          {bill.discountType === "percentage"
                            ? `${bill.discountPercent}%`
                            : `$${bill.discountAmount.toFixed(2)}`}{" "}
                          (${bill.discountAmount.toFixed(2)})
                        </span>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">${bill.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          bill.paymentStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {bill.paymentStatus.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(bill.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openBillDetails(bill)}>
                          <FileText className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => printBill(bill)}>
                          <Printer className="h-4 w-4" />
                          <span className="sr-only">Print</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bill Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl overflow-y-scroll h-[90vh] ">
          {selectedBill && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Bill Details: {selectedBill.id.slice(0, 8)}</span>
                  <Badge
                    className={
                      selectedBill.paymentStatus === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {selectedBill.paymentStatus.toUpperCase()}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedBill.customerName ? `Customer: ${selectedBill.customerName}` : "No customer information"} •
                  Created: {new Date(selectedBill.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {selectedBill.orders.map((order, index) => (
                  <Card key={order.id}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium">
                        Order #{index + 1} - {order.tableName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item, itemIndex) => (
                            <TableRow key={itemIndex}>
                              <TableCell>{item.itemName}</TableCell>
                              <TableCell>${item.price.toFixed(2)}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>${(item.price * item.quantity).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}

                <div className="bg-muted p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${selectedBill.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        Discount{" "}
                        {selectedBill.discountAmount > 0
                          ? selectedBill.discountType === "percentage"
                            ? `(${selectedBill.discountPercent}%)`
                            : "(Flat)"
                          : ""}
                        :
                      </span>
                      <span>-${selectedBill.discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${selectedBill.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${selectedBill.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {selectedBill.paymentStatus === "pending" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Apply Discount</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => openDiscountDialog(selectedBill.id)}
                        >
                          <Percent className="h-4 w-4" />
                          Apply Discount
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Mark as Paid</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleUpdatePaymentStatus(selectedBill.id, "paid", "cash")}
                        >
                          <DollarSign className="h-4 w-4" />
                          Cash
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleUpdatePaymentStatus(selectedBill.id, "paid", "card")}
                        >
                          <CreditCard className="h-4 w-4" />
                          Card
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleUpdatePaymentStatus(selectedBill.id, "paid", "online")}
                        >
                          <Check className="h-4 w-4" />
                          Online
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBill.paymentStatus === "paid" && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Payment Information</h3>
                    <div className="bg-green-50 text-green-800 p-3 rounded-md flex items-center gap-2">
                      <Check className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Paid via {selectedBill.paymentMethod || "Unknown"}</p>
                        <p className="text-sm">Updated: {new Date(selectedBill.updatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => printBill(selectedBill)}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Bill
                </Button>
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
            <DialogDescription>Select discount type and enter the value.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Discount Type</Label>
              <RadioGroup
                value={discountType}
                onValueChange={(value) => setDiscountType(value as "percentage" | "flat")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="percentage" />
                  <Label htmlFor="percentage">Percentage (%)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="flat" id="flat" />
                  <Label htmlFor="flat">Flat Amount ($)</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="discountValue">
                {discountType === "percentage" ? "Discount Percentage (%)" : "Discount Amount ($)"}
              </Label>
              <Input
                id="discountValue"
                type="number"
                min="0"
                max={discountType === "percentage" ? "100" : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleApplyDiscount}
              disabled={discountValue <= 0 || (discountType === "percentage" && discountValue > 100)}
            >
              Apply Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
