"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableIcon, Tag, Menu, ShoppingCart, Wallet, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { getFinancialSummary, getMonthlyFinancialData } from "@/lib/financial"
import { subscribeToRecentOrders,getTablesFromRealtime } from "@/lib/firebase"
import { getTableCount } from "@/lib/tables"
import { getDocumentCount } from "@/lib/global"

interface FinancialSummary {
  todayIncome: number
  todayExpenses: number
  todayNetIncome: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyNetIncome: number
}

interface DailyFinancial {
  date: string
  income: number
  expenses: number
  netIncome: number
}

interface Order {
  id: string
  tableName: string
  items: any[]
  total: number
  status: string
  createdAt: string
}

export default function DashboardPage() {
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null)
  const [tableCount, setTableCount] = useState<number | null>(null);
  const [itemTypeCount, setItemTypeCount] = useState<number | null>(null);
  const [itemCount, setItemCount] = useState<number | null>(null);
  const [monthlyData, setMonthlyData] = useState<DailyFinancial[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("today")

  // useEffect(() => {
  //   // Fetch the table count when the component mounts
  //   const fetchTableCount = async () => {
  //     try {
  //       const count = await getTableCount(); // Call the async function to get table count
  //       setTableCount(count); // Set the state with the result
  //     } catch (error) {
  //       console.error("Error fetching table count:", error);
  //     } finally {
  //       setLoading(false); // Set loading to false when the async call finishes
  //     }
  //   };

  //   fetchTableCount();
  // }, []);

  useEffect(() => {
    const fetchTableCount = async () => {
      try {
        const count = await getDocumentCount("tables"); // Use dynamic collection name
        setTableCount(count);
      } catch (error) {
        console.error("Failed to fetch table count:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTableCount();
  }, []);

  useEffect(() => {
    const fetchItemTypeCount = async () => {
      try {
        await getTablesFromRealtime();
        const count = await getDocumentCount("itemTypes"); // Use dynamic collection name
        setItemTypeCount(count);
      } catch (error) {
        console.error("Failed to fetch itemType count:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItemTypeCount();
  }, []);

  useEffect(() => {
    const fetchItemCount = async () => {
      try {
        const count = await getDocumentCount("items"); // Use dynamic collection name
        setItemCount(count);
      } catch (error) {
        console.error("Failed to fetch item count:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItemCount();
  }, []);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const summary = await getFinancialSummary()
        const monthlyFinancialData = await getMonthlyFinancialData()

        setFinancialSummary(summary)
        setMonthlyData(monthlyFinancialData)
      } catch (error) {
        console.error("Failed to fetch financial data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Subscribe to real-time updates for recent orders
    const unsubscribe = subscribeToRecentOrders((orders) => {
      setRecentOrders(orders)
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  // In a real app, you would fetch this data from your database
  const stats = [
    {
      title: "Total Tables",
      value: tableCount,
      icon: <TableIcon className="h-5 w-5" />,
      href: "/dashboard/tables",
    },
    {
      title: "Item Categories",
      value: itemTypeCount,
      icon: <Tag className="h-5 w-5" />,
      href: "/dashboard/item-types",
    },
    {
      title: "Menu Items",
      value: itemCount,
      icon: <Menu className="h-5 w-5" />,
      href: "/dashboard/items",
    },
    {
      title: "Today's Orders",
      value: recentOrders.length.toString(),
      icon: <ShoppingCart className="h-5 w-5" />,
      href: "/dashboard/orders",
    },
  ]

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return "bg-green-100 text-green-800"
      case "in progress":
      case "preparing":
        return "bg-blue-100 text-blue-800"
      case "pending":
      case "ready":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading dashboard data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Link href={stat.href} key={index}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className="text-muted-foreground">{stat.icon}</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Financial Summary</h2>
          <Tabs defaultValue="today" className="w-auto" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {activeTab === "today" ? "Today's Income" : "Monthly Income"}
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                $
                {activeTab === "today"
                  ? financialSummary?.todayIncome.toFixed(2)
                  : financialSummary?.monthlyIncome.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From {activeTab === "today" ? "orders today" : "orders this month"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {activeTab === "today" ? "Today's Expenses" : "Monthly Expenses"}
              </CardTitle>
              <TrendingDown className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                $
                {activeTab === "today"
                  ? financialSummary?.todayExpenses.toFixed(2)
                  : financialSummary?.monthlyExpenses.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From {activeTab === "today" ? "expenses today" : "expenses this month"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {activeTab === "today" ? "Today's Net Income" : "Monthly Net Income"}
              </CardTitle>
              <Wallet className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${(activeTab === "today" ? financialSummary?.todayNetIncome : financialSummary?.monthlyNetIncome) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                  }`}
              >
                $
                {activeTab === "today"
                  ? Math.abs(financialSummary?.todayNetIncome || 0).toFixed(2)
                  : Math.abs(financialSummary?.monthlyNetIncome || 0).toFixed(2)}
                {(activeTab === "today" ? financialSummary?.todayNetIncome : financialSummary?.monthlyNetIncome) < 0 &&
                  " (Loss)"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Income minus expenses</p>
            </CardContent>
          </Card>
        </div>

        {/* {activeTab === "monthly" && (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Financial Breakdown</CardTitle>
              <CardDescription>Daily income and expenses for the current month</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Income</TableHead>
                    <TableHead>Expenses</TableHead>
                    <TableHead>Net Income</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell>{format(new Date(day.date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-green-600">${day.income.toFixed(2)}</TableCell>
                      <TableCell className="text-red-600">${day.expenses.toFixed(2)}</TableCell>
                      <TableCell className={day.netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                        ${Math.abs(day.netIncome).toFixed(2)}
                        {day.netIncome < 0 && " (Loss)"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )} */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Real-time updates of the latest orders in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No recent orders found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id.slice(0, 8)}</TableCell>
                    <TableCell>{order.tableName}</TableCell>
                    <TableCell>{order.items.length}</TableCell>
                    <TableCell>${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                          order.status,
                        )}`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleTimeString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/tables">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Manage Tables</CardTitle>
              <TableIcon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Add, edit, or remove tables in your restaurant</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/item-types">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Item Categories</CardTitle>
              <Tag className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Manage categories for your menu items</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/items">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Menu Items</CardTitle>
              <Menu className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Manage your restaurant's menu items</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
