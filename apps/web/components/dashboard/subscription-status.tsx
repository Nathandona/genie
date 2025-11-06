"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { apiClient } from "@/lib/api-client"
import Link from "next/link"
import { CreditCard, ExternalLink, AlertCircle, X } from "lucide-react"

interface Subscription {
  id: string
  status: string
  productId: string
  priceId: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd: boolean
}

export function SubscriptionStatus() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null)

  useEffect(() => {
    loadSubscriptions()
  }, [])

  const loadSubscriptions = async () => {
    try {
      const subs = await apiClient.getPolarSubscriptions()
      setSubscriptions(subs)
    } catch (error) {
      console.error("Failed to load subscriptions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (subscriptionId: string) => {
    setShowCancelConfirm(null)
    setCanceling(subscriptionId)
    setError(null)
    
    try {
      await apiClient.cancelPolarSubscription(subscriptionId)
      await loadSubscriptions()
    } catch (error) {
      console.error("Failed to cancel subscription:", error)
      setError("Failed to cancel subscription. Please try again.")
    } finally {
      setCanceling(null)
    }
  }

  const handleManage = async () => {
    try {
      const url = await apiClient.getPolarPortalUrl()
      window.open(url, "_blank")
    } catch (error) {
      console.error("Failed to open portal:", error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const activeSubscription = subscriptions.find(sub => sub.status === "active")

  if (!activeSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>You're currently on the free plan</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/pricing">
            <Button>Upgrade Plan</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription
            </CardTitle>
            <CardDescription className="mt-2">
              Manage your subscription and billing
            </CardDescription>
          </div>
          <Badge variant={activeSubscription.status === "active" ? "default" : "secondary"}>
            {activeSubscription.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="relative">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-6 w-6 p-0"
              onClick={() => setError(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        )}

        {/* Cancel Confirmation Alert */}
        {showCancelConfirm && (
          <Alert className="relative">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Cancel Subscription?</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                Are you sure you want to cancel your subscription? You'll continue to have access
                until the end of your billing period.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleCancel(showCancelConfirm)}
                  disabled={canceling === showCancelConfirm}
                >
                  {canceling === showCancelConfirm ? "Canceling..." : "Yes, Cancel"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCancelConfirm(null)}
                  disabled={canceling === showCancelConfirm}
                >
                  Keep Subscription
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {activeSubscription.cancelAtPeriodEnd && (
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-800 dark:text-yellow-200">
            Your subscription will be canceled at the end of the current billing period
            {activeSubscription.currentPeriodEnd && (
              <> on {new Date(activeSubscription.currentPeriodEnd).toLocaleDateString()}</>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleManage}>
            Manage Billing
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
          
          {!activeSubscription.cancelAtPeriodEnd && (
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(activeSubscription.id)}
              disabled={canceling === activeSubscription.id}
            >
              {canceling === activeSubscription.id ? "Canceling..." : "Cancel Subscription"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
