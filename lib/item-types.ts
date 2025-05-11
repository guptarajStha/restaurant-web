import {
  getItemTypesFromFirebase,
  createItemTypeInFirebase,
  updateItemTypeInFirebase,
  deleteItemTypeFromFirebase,
} from "./firebase"

interface ItemType {
  id: string
  name: string
  description: string
}

export async function getItemTypes(): Promise<ItemType[]> {
  try {
    return await getItemTypesFromFirebase()
  } catch (error) {
    console.error("Error getting item types:", error)
    throw error
  }
}

export async function getItemType(id: string): Promise<ItemType | undefined> {
  try {
    const itemTypes = await getItemTypesFromFirebase()
    return itemTypes.find((itemType) => itemType.id === id)
  } catch (error) {
    console.error("Error getting item type:", error)
    throw error
  }
}

export async function createItemType(itemTypeData: Omit<ItemType, "id">): Promise<ItemType> {
  try {
    return await createItemTypeInFirebase(itemTypeData)
  } catch (error) {
    console.error("Error creating item type:", error)
    throw error
  }
}

export async function updateItemType(id: string, itemTypeData: Partial<Omit<ItemType, "id">>): Promise<ItemType> {
  try {
    return await updateItemTypeInFirebase(id, itemTypeData)
  } catch (error) {
    console.error("Error updating item type:", error)
    throw error
  }
}

export async function deleteItemType(id: string): Promise<void> {
  try {
    await deleteItemTypeFromFirebase(id)
  } catch (error) {
    console.error("Error deleting item type:", error)
    throw error
  }
}
