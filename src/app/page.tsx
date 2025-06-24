"use client"

import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2 } from "lucide-react"
import DashboardContent from "./DashboardContent"

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-blue-600" />
          <CardTitle>Dashboard Top Automações</CardTitle>
          <CardDescription>
            Carregando dashboard...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DashboardContent />
    </Suspense>
  )
}
