"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { loginUser } from "@/lib/auth"
import { PinVerificationDialog } from "@/components/pin-verification-dialog"
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
   const [showPinDialog, setShowPinDialog] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // setLoading(true)
    setError("")
    
    // Show PIN verification dialog
    setShowPinDialog(true)
  }

  const verifyPin = async (pin: string): Promise<boolean> => {
    // Check if PIN matches the environment variable
    if (pin === process.env.NEXT_PUBLIC_LOGIN_PIN) {
      // PIN is correct, proceed with login
      await loginUserWithPin()
      return true
    }
    return false
  }

  const loginUserWithPin = async () => {
    setLoading(true)


    try {
      await loginUser(email, password)
      router.push("/dashboard")
    } catch (err:any) {
      setError("Invalid email or password")
    } finally {
      setLoading(false)
       setShowPinDialog(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your credentials to access the admin panel</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <div className="text-sm font-medium text-destructive">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="underline">
                Register
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
         <PinVerificationDialog
        isOpen={showPinDialog}
        onClose={() => setShowPinDialog(false)}
        onVerify={verifyPin}
        title="PIN Verification"
        description="Please enter the login PIN to access the system."
      />
    </div>
  )
}
