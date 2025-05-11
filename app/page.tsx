"use client"; 
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useEffect } from "react";

export default function Home() {
   useEffect(() => {
      // Print the Firebase API Key to the console
      console.log("Firebase API Key: ", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
    }, []);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Restaurant Management System</CardTitle>
          <CardDescription>Login or register to access the admin panel</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link href="/login" className="w-full">
            <Button className="w-full">Login</Button>
          </Link>
          <Link href="/register" className="w-full">
            <Button variant="outline" className="w-full">
              Register
            </Button>
          </Link>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Manage tables, menu items, and orders efficiently
        </CardFooter>
      </Card>
    </div>
  )
}
