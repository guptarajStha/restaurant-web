"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash } from "lucide-react"
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
import { createItemType, updateItemType, deleteItemType, getItemTypes } from "@/lib/item-types"

interface ItemType {
  id: string
  name: string
  description: string
}

export default function ItemTypesPage() {
  const [itemTypes, setItemTypes] = useState<ItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [currentItemType, setCurrentItemType] = useState<ItemType | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const fetchItemTypes = async () => {
      try {
        const data = await getItemTypes()
        setItemTypes(data)
      } catch (error) {
        console.error("Failed to fetch item types:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchItemTypes()
  }, [])

  const handleAddItemType = async () => {
    try {
      const newItemType = await createItemType({
        name,
        description,
      })

      setItemTypes([...itemTypes, newItemType])
      resetForm()
      setDialogOpen(false)
    } catch (error) {
      console.error("Failed to add item type:", error)
    }
  }

  const handleEditItemType = async () => {
    if (!currentItemType) return

    try {
      const updatedItemType = await updateItemType(currentItemType.id, {
        name,
        description,
      })

      setItemTypes(itemTypes.map((itemType) => (itemType.id === currentItemType.id ? updatedItemType : itemType)))

      resetForm()
      setDialogOpen(false)
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update item type:", error)
    }
  }

  const handleDeleteItemType = async (id: string) => {
    try {
      await deleteItemType(id)
      setItemTypes(itemTypes.filter((itemType) => itemType.id !== id))
    } catch (error) {
      console.error("Failed to delete item type:", error)
    }
  }

  const openEditDialog = (itemType: ItemType) => {
    setCurrentItemType(itemType)
    setName(itemType.name)
    setDescription(itemType.description)
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
    setCurrentItemType(null)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading item types...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Item Categories</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Category" : "Add New Category"}</DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update the category details below."
                  : "Fill in the details to add a new menu item category."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter category name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter category description"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={isEditing ? handleEditItemType : handleAddItemType}>
                {isEditing ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>Manage your menu item categories</CardDescription>
        </CardHeader>
        <CardContent>
          {itemTypes.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No categories found. Add your first category to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemTypes.map((itemType) => (
                  <TableRow key={itemType.id}>
                    <TableCell className="font-medium">{itemType.name}</TableCell>
                    <TableCell className="max-w-md truncate">{itemType.description}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(itemType)}>
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
                                This will permanently delete the "{itemType.name}" category. This action cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteItemType(itemType.id)}>
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
