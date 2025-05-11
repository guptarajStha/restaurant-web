import { collection, getDocs, getFirestore } from "firebase/firestore";
import { app } from "./firebase"; // Assuming Firebase is initialized here

// Global function to get the count of documents in a dynamic collection
export async function getDocumentCount(collectionName: string): Promise<number> {
  const db = getFirestore(app);  // Get Firestore database instance

  // Get the collection reference dynamically based on the collection name passed
  const dynamicCollection = collection(db, collectionName);

  try {
    // Get all documents in the dynamically provided collection
    const querySnapshot = await getDocs(dynamicCollection);
    
    // Return the number of documents in the collection
    return querySnapshot.size;  // `size` gives the count of documents in the query snapshot
  } catch (error) {
    console.error(`Error getting documents from collection ${collectionName}:`, error);
    throw error;
  }
}
