import {
  getOrdersFromFirebase,
  createOrderInFirebase,
  updateOrderStatusInFirebase,
  deleteOrderFromFirebase,
} from "./firebase"

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

export async function getOrders(): Promise<Order[]> {
  try {
    return await getOrdersFromFirebase()
  } catch (error) {
    console.error("Error getting orders:", error)
    throw error
  }
}

export async function getOrder(id: string): Promise<Order | undefined> {
  try {
    const orders = await getOrdersFromFirebase()
    return orders.find((order) => order.id === id)
  } catch (error) {
    console.error("Error getting order:", error)
    throw error
  }
}

interface CreateOrderInput {
  tableId: string
  items: Array<{
    itemId: string
    quantity: number
  }>
}

export async function createOrder(orderData: CreateOrderInput): Promise<Order> {
  try {
    return await createOrderInFirebase(orderData)
  } catch (error) {
    console.error("Error creating order:", error)
    throw error
  }
}

export async function updateOrderStatus(
  id: string,
  status: "pending" | "preparing" | "ready" | "delivered" | "cancelled",
): Promise<Order> {
  try {
    return await updateOrderStatusInFirebase(id, status)
  } catch (error) {
    console.error("Error updating order status:", error)
    throw error
  }
}

export async function deleteOrder(id: string): Promise<void> {
  try {
    await deleteOrderFromFirebase(id)
  } catch (error) {
    console.error("Error deleting order:", error)
    throw error
  }
}
