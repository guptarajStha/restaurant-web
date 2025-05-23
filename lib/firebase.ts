import { initializeApp } from "firebase/app"
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore"
import { getAnalytics,isSupported } from "firebase/analytics";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth"
import { updateTablesStatusInFirebase } from "./tables";
import { get, getDatabase, ref, set, update } from "firebase/database";

// Your Firebase configuration
// Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)
// const analytics = getAnalytics(app);
// ===== Authentication Functions =====

let analytics: ReturnType<typeof getAnalytics> | null = null

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app)
    }
  })
}

export async function registerUserWithFirebase(name: string, email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Store additional user data in Firestore
    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      role: "staff", // Default role
      createdAt: serverTimestamp(),
    })

    return {
      id: user.uid,
      name,
      email,
    }
  } catch (error) {
    console.error("Error registering user:", error)
    throw error
  }
}

export async function loginUserWithFirebase(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid))

    if (userDoc.exists()) {
      const userData = userDoc.data()
      return {
        id: user.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      }
    } else {
      throw new Error("User data not found")
    }
  } catch (error) {
    console.error("Error logging in:", error)
    throw error
  }
}

export async function logoutUserFromFirebase() {
  try {
    await signOut(auth)
  } catch (error) {
    console.error("Error logging out:", error)
    throw error
  }
}

// ===== Tables CRUD =====

export async function getTablesFromFirebase() {
  try {
    const tablesSnapshot = await getDocs(collection(db, "tables"))
    return tablesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error getting tables:", error)
    throw error
  }
}

export async function createTableInFirebase(tableData: any) {
  try {
    const tableRef = doc(collection(db, "tables"))
    await setDoc(tableRef, {
      ...tableData,
      createdAt: serverTimestamp(),
    })
    await writeData(tableRef.id,'tables',tableData)

    return {
      id: tableRef.id,
      ...tableData,
    }
  } catch (error) {
    console.error("Error creating table:", error)
    throw error
  }
}

export async function updateTableInFirebase(id: string, tableData: any) {
  try {
    await updateDoc(doc(db, "tables", id), tableData)
    await writeData(id,'tables',tableData)

    return {
      id,
      ...tableData,
    }
  } catch (error) {
    console.error("Error updating table:", error)
    throw error
  }
}

export async function deleteTableFromFirebase(id: string) {
  try {
    await deleteDoc(doc(db, "tables", id))
  } catch (error) {
    console.error("Error deleting table:", error)
    throw error
  }
}

// ===== Item Types CRUD =====

export async function getItemTypesFromFirebase() {
  try {
    const itemTypesSnapshot = await getDocs(collection(db, "itemTypes"))
    return itemTypesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error getting item types:", error)
    throw error
  }
}

export async function createItemTypeInFirebase(itemTypeData: any) {
  try {
    const itemTypeRef = doc(collection(db, "itemTypes"))
    await setDoc(itemTypeRef, {
      ...itemTypeData,
      createdAt: serverTimestamp(),
    })

    return {
      id: itemTypeRef.id,
      ...itemTypeData,
    }
  } catch (error) {
    console.error("Error creating item type:", error)
    throw error
  }
}

export async function updateItemTypeInFirebase(id: string, itemTypeData: any) {
  try {
    await updateDoc(doc(db, "itemTypes", id), itemTypeData)

    return {
      id,
      ...itemTypeData,
    }
  } catch (error) {
    console.error("Error updating item type:", error)
    throw error
  }
}

export async function deleteItemTypeFromFirebase(id: string) {
  try {
    await deleteDoc(doc(db, "itemTypes", id))
  } catch (error) {
    console.error("Error deleting item type:", error)
    throw error
  }
}

// ===== Items CRUD =====

export async function getItemsFromFirebase() {
  try {
    const itemsSnapshot = await getDocs(collection(db, "items"))
    const items = itemsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Get item types to add type names
    const itemTypes = await getItemTypesFromFirebase()
    const itemTypesMap = new Map(itemTypes.map((type) => [type.id, type.name]))

    return items.map((item) => ({
      ...item,
      typeName: itemTypesMap.get(item.typeId) || "Unknown",
    }))
  } catch (error) {
    console.error("Error getting items:", error)
    throw error
  }
}

export async function createItemInFirebase(itemData: any) {
  try {
    const itemRef = doc(collection(db, "items"))
    await setDoc(itemRef, {
      ...itemData,
      createdAt: serverTimestamp(),
    })

    // Get the type name
    const typeDoc = await getDoc(doc(db, "itemTypes", itemData.typeId))
    const typeName = typeDoc.exists() ? typeDoc.data().name : "Unknown"

    return {
      id: itemRef.id,
      ...itemData,
      typeName,
    }
  } catch (error) {
    console.error("Error creating item:", error)
    throw error
  }
}

export async function updateItemInFirebase(id: string, itemData: any) {
  try {
    await updateDoc(doc(db, "items", id), itemData)

    // Get the type name
    const typeDoc = await getDoc(doc(db, "itemTypes", itemData.typeId))
    const typeName = typeDoc.exists() ? typeDoc.data().name : "Unknown"

    return {
      id,
      ...itemData,
      typeName,
    }
  } catch (error) {
    console.error("Error updating item:", error)
    throw error
  }
}

export async function deleteItemFromFirebase(id: string) {
  try {
    await deleteDoc(doc(db, "items", id))
  } catch (error) {
    console.error("Error deleting item:", error)
    throw error
  }
}

// ===== Orders CRUD =====

export async function getOrdersFromFirebase() {
  try {
    const ordersSnapshot = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")))
    const orders = ordersSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      }
    })

    return orders
  } catch (error) {
    console.error("Error getting orders:", error)
    throw error
  }
}

export async function createOrderInFirebase(orderData: any) {
  try {
    // Get table info
    const tableDoc = await getDoc(doc(db, "tables", orderData.tableId))
    const tableName = tableDoc.exists() ? `Table ${tableDoc.data().number}` : "Unknown Table"

    // Process items
    const orderItems = await Promise.all(
      orderData.items.map(async (item: any) => {
        const itemDoc = await getDoc(doc(db, "items", item.itemId))
        if (itemDoc.exists()) {
          const itemData = itemDoc.data()
          return {
            id: doc(collection(db, "orderItems")).id,
            itemId: item.itemId,
            itemName: itemData.name,
            quantity: item.quantity,
            price: itemData.price,
          }
        }
        return null
      }),
    )

    // Filter out null items
    const validOrderItems = orderItems.filter((item) => item !== null)

    // Calculate total
    const total = validOrderItems.reduce((sum, item) => sum + (item ? item.price * item.quantity : 0), 0)

    const orderRef = doc(collection(db, "orders"))
    const newOrder = {
      tableId: orderData.tableId,
      tableName,
      status: "pending",
      items: validOrderItems,
      total,
      waiterName: orderData.waiterName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    await setDoc(orderRef, newOrder)

    await updateTablesStatusInFirebase(orderData.tableId, "occupied")
    await writeData(orderRef.id,'orders',newOrder)


    return {
      id: orderRef.id,
      ...newOrder,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error creating order:", error)
    throw error
  }
}


export async function updateOrderStatusInFirebase(id: string, status: string) {
  try {
    await updateDoc(doc(db, "orders", id), {
      status,
      updatedAt: serverTimestamp(),
    })

    const orderDoc = await getDoc(doc(db, "orders", id))
    const orderData = orderDoc.data()
    await writeData(id,'orders',orderData)

    return {
      id,
      ...orderData,
      status,
      createdAt: orderData?.createdAt.toDate().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error updating order status:", error)
    throw error
  }
}

export async function deleteOrderFromFirebase(id: string) {
  try {
    await deleteDoc(doc(db, "orders", id))
  } catch (error) {
    console.error("Error deleting order:", error)
    throw error
  }
}

// ===== Bills CRUD =====

export async function getBillsFromFirebase() {
  try {
    const billsSnapshot = await getDocs(query(collection(db, "bills"), orderBy("createdAt", "desc")))
    const bills = billsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
      }
    })

    return bills
  } catch (error) {
    console.error("Error getting bills:", error)
    throw error
  }
}

export async function createBillInFirebase(billData: any) {
  try {
    // Calculate subtotal from all orders
    const subtotal = billData.orders.reduce((sum: number, order: any) => sum + order.total, 0)

    // Calculate tax (9% for example)
    // const taxRate = 0.09
    // const tax = subtotal * taxRate
    const tax =0

    const billRef = doc(collection(db, "bills"))
    const newBill = {
      orders: billData.orders,
      customerName: billData.customerName,
      customerPhone: billData.customerPhone,
      subtotal,
      discountPercent: 0,
      discountAmount: 0,
      tax:0,
      total: subtotal + tax,
      paymentStatus: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    await setDoc(billRef, newBill)
    await writeData(billRef.id,'bills',newBill)
    for (const order of newBill.orders) {
      if (order.tableId) {
        // Update the table's status to "occupied"
        await updateTablesStatusInFirebase(order.tableId, "available");
      }
    }

    return {
      id: billRef.id,
      ...newBill,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error creating bill:", error)
    throw error
  }
}

export async function updateBillStatusInFirebase(id: string, status: string, paymentMethod?: string) {
  try {
    const updateData: any = {
      paymentStatus: status,
      updatedAt: serverTimestamp(),
    }

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod
    }

    await updateDoc(doc(db, "bills", id), updateData)

    const billDoc = await getDoc(doc(db, "bills", id))
    const billData = billDoc.data()

    await writeData(id,'bills',billData)


    return {
      id,
      ...billData,
      paymentStatus: status,
      paymentMethod: paymentMethod || billData?.paymentMethod,
      createdAt: billData?.createdAt.toDate().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error updating bill status:", error)
    throw error
  }
}

export async function applyDiscountToFirebaseBill(id: string, discountType: string, discountValue: number) {
  try {
    const billDocRef = doc(db, "bills", id)
    const billDoc = await getDoc(billDocRef)

    if (!billDoc.exists()) {
      throw new Error("Bill not found")
    }

    const billData = billDoc.data()

    let discountAmount = 0

    if (discountType === "percentage") {
      discountAmount = (billData.subtotal * discountValue) / 100
    } else if (discountType === "flat") {
      discountAmount = discountValue
    }

    const updatedTotal = billData.subtotal - discountAmount
    const updatedBillData = {
      discountType: discountType,
      discountPercent: discountType === "percentage" ? discountValue : 0,
      discountAmount: discountAmount,
      total: updatedTotal,
      updatedAt: serverTimestamp(),
    }

    await updateDoc(billDocRef, updatedBillData)

    const updatedBillDoc = await getDoc(billDocRef)
    return {
      id: updatedBillDoc.id,
      ...updatedBillDoc.data(),
      createdAt: updatedBillDoc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
      updatedAt: updatedBillDoc.data().updatedAt?.toDate().toISOString() || new Date().toISOString(),
    }
  } catch (error: any) {
    console.error("Error applying discount to bill:", error)
    throw error
  }
}

export async function deleteBillFromFirebase(id: string) {
  try {
    await deleteDoc(doc(db, "bills", id))
  } catch (error) {
    console.error("Error deleting bill:", error)
    throw error
  }
}

// ===== Expenses CRUD =====

export async function getExpensesFromFirebase() {
  try {
    const expensesSnapshot = await getDocs(query(collection(db, "expenses"), orderBy("date", "desc")))
    const expenses = expensesSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate().toISOString() || new Date().toISOString(),
      }
    })

    return expenses
  } catch (error) {
    console.error("Error getting expenses:", error)
    throw error
  }
}

export async function createExpenseInFirebase(expenseData: any) {
  try {
    const expenseRef = doc(collection(db, "expenses"))
    const newExpense = {
      ...expenseData,
      date: Timestamp.fromDate(new Date(expenseData.date)),
    }

    await setDoc(expenseRef, newExpense)

    return {
      id: expenseRef.id,
      ...expenseData,
    }
  } catch (error) {
    console.error("Error creating expense:", error)
    throw error
  }
}

export async function updateExpenseInFirebase(id: string, expenseData: any) {
  try {
    const updateData = {
      ...expenseData,
    }

    if (expenseData.date) {
      updateData.date = Timestamp.fromDate(new Date(expenseData.date))
    }

    await updateDoc(doc(db, "expenses", id), updateData)

    return {
      id,
      ...expenseData,
    }
  } catch (error) {
    console.error("Error updating expense:", error)
    throw error
  }
}

export async function deleteExpenseFromFirebase(id: string) {
  try {
    await deleteDoc(doc(db, "expenses", id))
  } catch (error) {
    console.error("Error deleting expense:", error)
    throw error
  }
}

// ===== Real-time listeners =====

export function subscribeToRecentOrders(callback: (orders: any[]) => void) {
  // Get the 10 most recent orders and listen for changes
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(10))

  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      }
    })

    callback(orders)
  })
}

export function subscribeToTodayOrders(callback: (orders: any[]) => void) {
  // Get today's orders
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const q = query(
    collection(db, "orders"),
    where("createdAt", ">=", Timestamp.fromDate(today)),
    where("createdAt", "<", Timestamp.fromDate(tomorrow)),
    orderBy("createdAt", "desc"),
  )

  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      }
    })

    callback(orders)
  })
}

export function subscribeToTableStatus(callback: (tables: any[]) => void) {
  // Listen for changes to table status
  const q = query(collection(db, "tables"))

  return onSnapshot(q, (snapshot) => {
    const tables = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    callback(tables)
  })
}

export async function writeData(id: string, path: string, data: any) {
  const db = getDatabase();
  
  // Store data under the user's ID with the provided path
  set(ref(db, path + '/' + id), {
    ...data,
    timestamp: Date.now(), // optional: you can add a timestamp to track when the data was written
  }).then(() => {
    // console.log(path+" data written successfully");
  }).catch((error) => {
    // console.error("Error writing user data: ", error);
  });
}

// function updateData(id: string, path: string, data: any) {
//   const db = getDatabase();
  
//   const dataRef = ref(db, path + '/' + id);
  
//   update(dataRef, {
//     ...data,  // Only update the fields in `data`
//   }).then(() => {
//     console.log(path + " data updated successfully");
//   }).catch((error) => {
//     console.error("Error updating user data: ", error);
//   });
// }
// Export the Firebase instances
export async function getTablesFromRealtime() {
  const db = getDatabase(); // Get the Firebase Realtime Database instance

  // Reference to the 'orders/' node
  let messagesRef = ref(db, 'orders/');

  try {
    // Get the data from the reference path
    const snapshot = await get(messagesRef);

    // Check if the data exists at the specified path
    if (snapshot.exists()) {
      // If data exists, log the result and return it
      // console.log("Data retrieved Live:", snapshot.val());
      return snapshot.val();  // Return the data as an object
    } else {
      // If no data exists at the path, log this
      console.log("No data available");
      return null;  // Return null if no data found
    }
  } catch (error) {
    // Catch and log any errors
    console.error("Error reading data: ", error);
    throw error;  // Rethrow the error for the calling function to handle
  }
}
export { db, auth, analytics  }
