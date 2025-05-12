"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash, ShoppingCart } from "lucide-react"
import { getTablesFromFirebase, getItemsFromFirebase, createOrderInFirebase } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { PinVerificationDialog } from "@/components/pin-verification-dialog"

interface TableType {
  id: string
  number: number
  capacity: number
  status: string
}

interface Item {
  id: string
  name: string
  price: number
  typeName: string
}

interface OrderItem {
  itemId: string
  quantity: number
}

export default function OrderFormPage() {
  const router = useRouter()
  const [tables, setTables] = useState<TableType[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Form state
  const [waiterName, setWaiterName] = useState("")
  const [selectedTable, setSelectedTable] = useState("")
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [currentItemId, setCurrentItemId] = useState("")
  const [currentQuantity, setCurrentQuantity] = useState(1)
  const [showPinDialog, setShowPinDialog] = useState(false)


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tablesData, itemsData] = await Promise.all([getTablesFromFirebase(), getItemsFromFirebase()])

        // Filter only available tables
        // const availableTables = tablesData.filter((table) => table.status === "available")
        const availableTables = tablesData

        setTables(availableTables)
        setItems(itemsData)
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const addItemToOrder = () => {
    if (!currentItemId || currentQuantity <= 0) return

    // Check if item already exists in order
    const existingItemIndex = orderItems.findIndex((item) => item.itemId === currentItemId)

    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      const updatedItems = [...orderItems]
      updatedItems[existingItemIndex].quantity += currentQuantity
      setOrderItems(updatedItems)
    } else {
      // Add new item
      setOrderItems([
        ...orderItems,
        {
          itemId: currentItemId,
          quantity: currentQuantity,
        },
      ])
    }

    // Reset form
    setCurrentItemId("")
    setCurrentQuantity(1)
  }

  const removeItemFromOrder = (index: number) => {
    const updatedItems = [...orderItems]
    updatedItems.splice(index, 1)
    setOrderItems(updatedItems)
  }

  const calculateOrderTotal = () => {
    return orderItems.reduce((total, orderItem) => {
      const item = items.find((i) => i.id === orderItem.itemId)
      return total + (item ? item.price * orderItem.quantity : 0)
    }, 0)
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTable || orderItems.length === 0) {
      return
    }
    // Show PIN verification dialog
    setShowPinDialog(true)
  }

  const verifyPin = async (pin: string): Promise<boolean> => {
    // Check if PIN matches the environment variable
    if (pin === process.env.NEXT_PUBLIC_ORDER_PIN) {
      // PIN is correct, proceed with order submission
      await submitOrder()
      return true
    }
    return false
  }

  const submitOrder = async () => {
    setSubmitting(true)

    try {
      // Create the order in Firebase
      await createOrderInFirebase({
        tableId: selectedTable,
        items: orderItems,
        waiterName,
      })

      // Show success message
      setSuccess(true)

      // Reset form
      setWaiterName("")
      setSelectedTable("")
      setOrderItems([])

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/")
      }, 3000)
    } catch (error) {
      console.error("Failed to submit order:", error)
    } finally {
      setSubmitting(false)
      setShowPinDialog(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Loading...</CardTitle>
            <CardDescription>Please wait while we load the order form.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">Order Submitted Successfully!</CardTitle>
            <CardDescription>Thank you for your order. We'll prepare it right away.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You will be redirected to the home page in a few seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Place Your Order</CardTitle>
          <CardDescription>Fill in the details below to place your order</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmitOrder}>
         
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="table">Select Table</Label>
              <Select value={selectedTable} onValueChange={setSelectedTable} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No tables available
                    </SelectItem>
                  ) : (
                    tables.map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        Table {table.number} (Seats {table.capacity})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Add Items to Your Order</h3>
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="item">Select Item</Label>
                  <Select value={currentItemId} onValueChange={setCurrentItemId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - ${item.price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(Number.parseInt(e.target.value) || 1)}
                  />
                </div>
                <Button type="button" onClick={addItemToOrder} className="mb-0.5">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>

              {orderItems.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((orderItem, index) => {
                        const item = items.find((i) => i.id === orderItem.itemId)
                        return (
                          <TableRow key={index}>
                            <TableCell>{item?.name || "Unknown item"}</TableCell>
                            <TableCell>${item?.price.toFixed(2) || "0.00"}</TableCell>
                            <TableCell>{orderItem.quantity}</TableCell>
                            <TableCell>${((item?.price || 0) * orderItem.quantity).toFixed(2)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => removeItemFromOrder(index)}>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">
                          Total:
                        </TableCell>
                        <TableCell className="font-bold">${calculateOrderTotal().toFixed(2)}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground border rounded-md">
                  No items added to your order yet.
                </div>
              )}
            </div>
             <div className="space-y-2">
            <Label htmlFor="orderBy">Waiter Name</Label>
            <Input
              id="orderBy"
              value={waiterName}
              onChange={(e) => setWaiterName(e.target.value)}
              placeholder="Enter waiter name"
              required
            />
          </div>

          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={submitting || orderItems.length === 0 || !selectedTable}>
              {submitting ? (
                "Submitting..."
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" /> Place Order (${calculateOrderTotal().toFixed(2)})
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              By placing your order, you agree to our terms of service and privacy policy.
            </p>
          </CardFooter>
        </form>
      </Card>

      <PinVerificationDialog
        isOpen={showPinDialog}
        onClose={() => setShowPinDialog(false)}
        onVerify={verifyPin}
        title="PIN Verification"
        description="Please enter the 6-digit PIN to place your order."
      />
    </div>
  )
}
