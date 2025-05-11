import { getItemsFromFirebase, createItemInFirebase, updateItemInFirebase, deleteItemFromFirebase } from "./firebase"

interface Item {
  id: string
  name: string
  description: string
  price: number
  typeId: string
  available: boolean
  typeName?: string
}

export async function getItems(): Promise<Array<Item & { typeName: string }>> {
  try {
    return await getItemsFromFirebase()
  } catch (error) {
    console.error("Error getting items:", error)
    throw error
  }
}

export async function getItem(id: string): Promise<(Item & { typeName: string }) | undefined> {
  try {
    const items = await getItemsFromFirebase()
    return items.find((item) => item.id === id)
  } catch (error) {
    console.error("Error getting item:", error)
    throw error
  }
}

export async function createItem(itemData: Omit<Item, "id">): Promise<Item> {
  try {
    return await createItemInFirebase(itemData)
  } catch (error) {
    console.error("Error creating item:", error)
    throw error
  }
}

export async function updateItem(id: string, itemData: Partial<Omit<Item, "id">>): Promise<Item> {
  try {
    return await updateItemInFirebase(id, itemData)
  } catch (error) {
    console.error("Error updating item:", error)
    throw error
  }
}

export async function deleteItem(id: string): Promise<void> {
  try {
    await deleteItemFromFirebase(id)
  } catch (error) {
    console.error("Error deleting item:", error)
    throw error
  }
}
