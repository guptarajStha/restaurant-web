"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, FileText, Trash } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  getTablesFromFirebase,
  getItemsFromFirebase,
  createOrderInFirebase,
  updateOrderStatusInFirebase,
  deleteOrderFromFirebase,
  subscribeToRecentOrders,
} from "@/lib/firebase"

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
  status: "pending" | "preparing" | "ready" | "delivered" | "cancelled"
  items: OrderItem[]
  total: number
  createdAt: string
}

interface TableType {
  id: string
  number: number
}

interface Item {
  id: string
  name: string
  price: number
  typeId: string
  typeName: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [tables, setTables] = useState<TableType[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // New order form state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState("")
  const [orderItems, setOrderItems] = useState<{ itemId: string; quantity: number }[]>([])
  const [currentItemId, setCurrentItemId] = useState("")
  const [currentQuantity, setCurrentQuantity] = useState(1)

  // Order details dialog
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tablesData, itemsData] = await Promise.all([getTablesFromFirebase(), getItemsFromFirebase()])

        setTables(tablesData)
        setItems(itemsData)
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Subscribe to real-time updates for orders
    const unsubscribe = subscribeToRecentOrders((updatedOrders) => {
      setOrders(updatedOrders)
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
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

  const handleCreateOrder = async () => {
    if (!selectedTable || orderItems.length === 0) return

    try {
      await createOrderInFirebase({
        tableId: selectedTable,
        items: orderItems,
      })

      resetOrderForm()
      setDialogOpen(false)
    } catch (error) {
      console.error("Failed to create order:", error)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      await updateOrderStatusInFirebase(orderId, newStatus)

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus,
        })
      }
    } catch (error) {
      console.error("Failed to update order status:", error)
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrderFromFirebase(orderId)

      if (selectedOrder?.id === orderId) {
        setDetailsDialogOpen(false)
      }
    } catch (error) {
      console.error("Failed to delete order:", error)
    }
  }

  const resetOrderForm = () => {
    setSelectedTable("")
    setOrderItems([])
    setCurrentItemId("")
    setCurrentQuantity(1)
  }

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setDetailsDialogOpen(true)
  }

  const calculateOrderTotal = () => {
    return orderItems.reduce((total, orderItem) => {
      const item = items.find((i) => i.id === orderItem.itemId)
      return total + (item ? item.price * orderItem.quantity : 0)
    }, 0)
  }

  const getStatusBadgeClass = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "preparing":
        return "bg-blue-100 text-blue-800"
      case "ready":
        return "bg-green-100 text-green-800"
      case "delivered":
        return "bg-purple-100 text-purple-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredOrders = orders.filter((order) => {
    // Filter by search term
    const matchesSearch =
      order.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) => item.itemName.toLowerCase().includes(searchTerm.toLowerCase()))

    // Filter by tab
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && ["pending", "preparing", "ready"].includes(order.status)) ||
      (activeTab === "completed" && ["delivered", "cancelled"].includes(order.status))

    return matchesSearch && matchesTab
  })

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading orders...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orders</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
              <DialogDescription>Add items to the order and select a table.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="table">Table</Label>
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        Table {table.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="item">Item</Label>
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
                      onChange={(e) => setCurrentQuantity(Number.parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <Button type="button" onClick={addItemToOrder} className="mb-0.5">
                    Add
                  </Button>
                </div>

                {orderItems.length > 0 ? (
                  <Card>
                    <CardContent className="p-4">
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
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No items added to the order yet.</div>
                )}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreateOrder} disabled={!selectedTable || orderItems.length === 0}>
                Create Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs defaultValue="all" className="w-full sm:w-auto" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>Manage your restaurant's orders (real-time updates)</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              {orders.length === 0
                ? "No orders found. Create your first order to get started."
                : "No orders match your search criteria."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id.slice(0, 8)}</TableCell>
                    <TableCell>{order.tableName}</TableCell>
                    <TableCell>{order.items.length}</TableCell>
                    <TableCell>${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(order.status)}`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openOrderDetails(order)}>
                          <FileText className="h-4 w-4" />
                          <span className="sr-only">View</span>
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
                                This will permanently delete this order. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteOrder(order.id)}>Delete</AlertDialogAction>
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

      {/* Order Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Order Details: {selectedOrder.id.slice(0, 8)}</span>
                  <Badge className={getStatusBadgeClass(selectedOrder.status)}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedOrder.tableName} • {new Date(selectedOrder.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-4">
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
                        {selectedOrder.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.itemName}</TableCell>
                            <TableCell>${item.price.toFixed(2)}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${(item.price * item.quantity).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-medium">
                            Total:
                          </TableCell>
                          <TableCell className="font-bold">${selectedOrder.total.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {["pending", "preparing", "ready", "delivered", "cancelled"].map((status) => (
                      <Button
                        key={status}
                        variant={selectedOrder.status === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, status as Order["status"])}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Order</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this order. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteOrder(selectedOrder.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
