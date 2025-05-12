"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PinVerificationDialogProps {
  isOpen: boolean
  onClose: () => void
  onVerify: (pin: string) => Promise<boolean>
  title: string
  description: string
}

export function PinVerificationDialog({ isOpen, onClose, onVerify, title, description }: PinVerificationDialogProps) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  const handleVerify = async () => {
    if (!pin || pin.length < 6) {
      setError("Please enter a valid 6-digit PIN")
      return
    }

    setIsVerifying(true)
    setError("")

    try {
      const isValid = await onVerify(pin)

      if (!isValid) {
        setError("Invalid PIN. Please try again.")
      }
    } catch (err) {
      setError("An error occurred during verification. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleVerify()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="pin">Enter 6-digit PIN</Label>
            <Input
              id="pin"
              type="password"
              maxLength={6}
              pattern="[0-9]*"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={handleKeyDown}
              autoFocus
              className="text-center text-xl tracking-widest"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleVerify} disabled={isVerifying}>
            {isVerifying ? "Verifying..." : "Verify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
