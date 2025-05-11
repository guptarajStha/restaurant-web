import {
  getTablesFromFirebase,
  createTableInFirebase,
  updateTableInFirebase,
  deleteTableFromFirebase,
} from "./firebase"
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { app } from "./firebase"; 

interface Table {
  id: string
  number: number
  capacity: number
  status: "available" | "occupied" | "reserved"
}

export async function getTables(): Promise<Table[]> {
  try {
    return await getTablesFromFirebase()
  } catch (error) {
    console.error("Error getting tables:", error)
    throw error
  }
}
export async function getTableCount(): Promise<number> {
  const db = getFirestore(app);
  const tablesCollection = collection(db, "tables");

  try {
    // Get all documents in the "tables" collection
    const querySnapshot = await getDocs(tablesCollection);
    
    // Return the number of documents in the collection
    return querySnapshot.size;  // `size` gives the count of documents in the query snapshot
  } catch (error) {
    console.error("Error getting tables:", error);
    throw error;
  }
}


export async function getTable(id: string): Promise<Table | undefined> {
  try {
    const tables = await getTablesFromFirebase()
    return tables.find((table) => table.id === id)
  } catch (error) {
    console.error("Error getting table:", error)
    throw error
  }
}

export async function createTable(tableData: Omit<Table, "id">): Promise<Table> {
  try {
    return await createTableInFirebase(tableData)
  } catch (error) {
    console.error("Error creating table:", error)
    throw error
  }
}

export async function updateTable(id: string, tableData: Partial<Omit<Table, "id">>): Promise<Table> {
  try {
    return await updateTableInFirebase(id, tableData)
  } catch (error) {
    console.error("Error updating table:", error)
    throw error
  }
}

export async function deleteTable(id: string): Promise<void> {
  try {
    await deleteTableFromFirebase(id)
  } catch (error) {
    console.error("Error deleting table:", error)
    throw error
  }
}
