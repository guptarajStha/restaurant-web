"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Table,
  Tag,
  Menu,
  ShoppingCart,
  LogOut,
  ChevronDown,
  User,
  Receipt,
  DollarSign,
} from "lucide-react"
import { checkAuth, logoutUser } from "@/lib/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [userName, setUserName] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const user = await checkAuth()
        if (!user) {
          router.push("/login")
          return
        }
        setUserName(user.name)
      } catch (error) {
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    verifyAuth()
  }, [router])

  const handleLogout = async () => {
    await logoutUser()
    router.push("/login")
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/dashboard/tables", label: "Tables", icon: <Table className="h-5 w-5" /> },
    { href: "/dashboard/item-types", label: "Item Types", icon: <Tag className="h-5 w-5" /> },
    { href: "/dashboard/items", label: "Menu Items", icon: <Menu className="h-5 w-5" /> },
    { href: "/dashboard/orders", label: "Orders", icon: <ShoppingCart className="h-5 w-5" /> },
    { href: "/dashboard/billing", label: "Billing", icon: <Receipt className="h-5 w-5" /> },
    { href: "/dashboard/expenses", label: "Expenses", icon: <DollarSign className="h-5 w-5" /> },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-16 items-center px-4 md:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <LayoutDashboard className="h-6 w-6" />
            <span className="hidden md:inline-block">Restaurant Admin</span>
          </Link>
          <nav className="hidden md:ml-8 md:flex md:items-center md:gap-5 lg:gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium ${
                  pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span className="hidden md:inline-block">{userName}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <nav className="flex overflow-x-auto md:hidden">
          <div className="flex px-4 pb-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-[5rem] flex-col items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                  pathname === item.href ? "bg-muted text-primary" : "text-muted-foreground hover:text-primary"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  )
}
