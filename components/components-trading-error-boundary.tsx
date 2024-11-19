"use client"

import { Component, ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, RefreshCcw, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  connectionStatus: "connected" | "disconnected" | "reconnecting"
  lastUpdated: Date | null
}

export class TradingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      connectionStatus: "connected",
      lastUpdated: null
    }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error("Trading platform error:", error)
  }

  simulateReconnection = async () => {
    this.setState({ connectionStatus: "reconnecting" })
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    this.setState({
      hasError: false,
      error: null,
      connectionStatus: "connected",
      lastUpdated: new Date()
    })
  }

  render() {
    const { hasError, error, connectionStatus, lastUpdated } = this.state

    if (hasError) {
      return (
        <Card className="w-full max-w-3xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Trading Platform Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                {error?.message || "An unexpected error occurred in the trading platform."}
              </AlertDescription>
            </Alert>
            <Button onClick={this.simulateReconnection} className="w-full">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <Badge 
            variant={connectionStatus === "connected" ? "default" : 
                    connectionStatus === "reconnecting" ? "outline" : "destructive"}
            className={`animate-pulse ${connectionStatus === "connected" ? "bg-green-500 hover:bg-green-600" : ""}`}
          >
            {connectionStatus === "connected" ? (
              <>
                <Wifi className="mr-2 h-4 w-4" />
                Connected
              </>
            ) : connectionStatus === "reconnecting" ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                Reconnecting...
              </>
            ) : (
              <>
                <WifiOff className="mr-2 h-4 w-4" />
                Disconnected
              </>
            )}
          </Badge>
          {lastUpdated && (
            <Badge variant="outline" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Updated {lastUpdated.toLocaleTimeString()}
            </Badge>
          )}
        </div>
        {this.props.children}
      </div>
    )
  }
}