"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash, Search } from "lucide-react"
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
import { createItem, updateItem, deleteItem, getItems } from "@/lib/items"
import { getItemTypes } from "@/lib/item-types"

interface Item {
  id: string
  name: string
  description: string
  price: number
  typeId: string
  typeName: string
  available: boolean
}

interface ItemType {
  id: string
  name: string
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [itemTypes, setItemTypes] = useState<ItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [currentItem, setCurrentItem] = useState<Item | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [typeId, setTypeId] = useState("")
  const [available, setAvailable] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsData, itemTypesData] = await Promise.all([getItems(), getItemTypes()])
        setItems(itemsData)
        setItemTypes(itemTypesData)
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddItem = async () => {
    try {
      const newItem = await createItem({
        name,
        description,
        price: Number.parseFloat(price),
        typeId,
        available,
      })

      // Find the type name for display
      const typeName = itemTypes.find((type) => type.id === typeId)?.name || ""

      setItems([...items, { ...newItem, typeName }])
      resetForm()
      setDialogOpen(false)
    } catch (error) {
      console.error("Failed to add item:", error)
    }
  }

  const handleEditItem = async () => {
    if (!currentItem) return

    try {
      const updatedItem = await updateItem(currentItem.id, {
        name,
        description,
        price: Number.parseFloat(price),
        typeId,
        available,
      })

      // Find the type name for display
      const typeName = itemTypes.find((type) => type.id === typeId)?.name || ""

      setItems(items.map((item) => (item.id === currentItem.id ? { ...updatedItem, typeName } : item)))

      resetForm()
      setDialogOpen(false)
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update item:", error)
    }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteItem(id)
      setItems(items.filter((item) => item.id !== id))
    } catch (error) {
      console.error("Failed to delete item:", error)
    }
  }

  const openEditDialog = (item: Item) => {
    setCurrentItem(item)
    setName(item.name)
    setDescription(item.description)
    setPrice(item.price.toString())
    setTypeId(item.typeId)
    setAvailable(item.available)
    setIsEditing(true)
    setDialogOpen(true)
  }

  const openAddDialog = () => {
    resetForm()
    setIsEditing(false)
    setDialogOpen(true)
  }

  const resetForm = () => {
    setName("")
    setDescription("")
    setPrice("")
    setTypeId("")
    setAvailable(true)
    setCurrentItem(null)
  }

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.typeName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading menu items...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Menu Items</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Update the menu item details below." : "Fill in the details to add a new menu item."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Item Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter item name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter item description"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter price"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Category</Label>
                <Select value={typeId} onValueChange={setTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="available">Available</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={isEditing ? handleEditItem : handleAddItem}>{isEditing ? "Update" : "Add"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search menu items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Menu Items</CardTitle>
          <CardDescription>Manage your restaurant's menu items</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              {items.length === 0
                ? "No menu items found. Add your first item to get started."
                : "No items match your search criteria."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                    <TableCell>${item.price.toFixed(2)}</TableCell>
                    <TableCell>{item.typeName}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.available ? "Available" : "Unavailable"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
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
                                This will permanently delete "{item.name}" from your menu. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>Delete</AlertDialogAction>
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
