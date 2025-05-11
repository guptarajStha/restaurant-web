import { loginUserWithFirebase, registerUserWithFirebase, logoutUserFromFirebase } from "./firebase"

interface User {
  id: string
  name: string
  email: string
}

// Current user storage
let currentUser: User | null = null

export async function registerUser(name: string, email: string, password: string): Promise<User> {
  try {
    const user = await registerUserWithFirebase(name, email, password)

    // Store user in memory
    currentUser = user

    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user))
    }

    return user
  } catch (error) {
    console.error("Registration error:", error)
    throw error
  }
}

export async function loginUser(email: string, password: string): Promise<User> {
  try {
    console.log(email)
    const user = await loginUserWithFirebase(email, password)

    // Store user in memory
    currentUser = user

    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user))
    }

    return user
  } catch (error) {
    console.error("Login error:", error)
    throw error
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await logoutUserFromFirebase()

    // Clear user from memory
    currentUser = null

    // Clear from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("user")
    }
  } catch (error) {
    console.error("Logout error:", error)
    throw error
  }
}

export async function checkAuth(): Promise<User | null> {
  // If we have a user in memory, return it
  if (currentUser) {
    return currentUser
  }

  // Check localStorage
  if (typeof window !== "undefined") {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      currentUser = JSON.parse(storedUser)
      return currentUser
    }
  }

  return null
}
