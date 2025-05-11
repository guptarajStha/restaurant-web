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
import { createTable, updateTable, deleteTable, getTables } from "@/lib/tables"

interface TableType {
  id: string
  number: number
  capacity: number
  status: "available" | "occupied" | "reserved"
}

export default function TablesPage() {
  const [tables, setTables] = useState<TableType[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTable, setCurrentTable] = useState<TableType | null>(null)
  const [tableNumber, setTableNumber] = useState("")
  const [capacity, setCapacity] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const data = await getTables()
        setTables(data)
      } catch (error) {
        console.error("Failed to fetch tables:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTables()
  }, [])

  const handleAddTable = async () => {
    try {
      const newTable = await createTable({
        number: Number.parseInt(tableNumber),
        capacity: Number.parseInt(capacity),
        status: "available",
      })

      setTables([...tables, newTable])
      resetForm()
      setDialogOpen(false)
    } catch (error) {
      console.error("Failed to add table:", error)
    }
  }

  const handleEditTable = async () => {
    if (!currentTable) return

    try {
      const updatedTable = await updateTable(currentTable.id, {
        number: Number.parseInt(tableNumber),
        capacity: Number.parseInt(capacity),
        status: currentTable.status,
      })

      setTables(tables.map((table) => (table.id === currentTable.id ? updatedTable : table)))

      resetForm()
      setDialogOpen(false)
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update table:", error)
    }
  }

  const handleDeleteTable = async (id: string) => {
    try {
      await deleteTable(id)
      setTables(tables.filter((table) => table.id !== id))
    } catch (error) {
      console.error("Failed to delete table:", error)
    }
  }

  const openEditDialog = (table: TableType) => {
    setCurrentTable(table)
    setTableNumber(table.number.toString())
    setCapacity(table.capacity.toString())
    setIsEditing(true)
    setDialogOpen(true)
  }

  const openAddDialog = () => {
    resetForm()
    setIsEditing(false)
    setDialogOpen(true)
  }

  const resetForm = () => {
    setTableNumber("")
    setCapacity("")
    setCurrentTable(null)
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "occupied":
        return "bg-red-100 text-red-800"
      case "reserved":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading tables...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tables</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Table" : "Add New Table"}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Update the table details below." : "Fill in the details to add a new table."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tableNumber">Table Number</Label>
                <Input
                  id="tableNumber"
                  type="number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Enter table number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Enter seating capacity"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={isEditing ? handleEditTable : handleAddTable}>{isEditing ? "Update" : "Add"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tables</CardTitle>
          <CardDescription>Manage your restaurant's tables</CardDescription>
        </CardHeader>
        <CardContent>
          {tables.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No tables found. Add your first table to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table Number</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell className="font-medium">Table {table.number}</TableCell>
                    <TableCell>{table.capacity} seats</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(table.status)}`}
                      >
                        {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(table)}>
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
                                This will permanently delete Table {table.number}. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTable(table.id)}>Delete</AlertDialogAction>
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
