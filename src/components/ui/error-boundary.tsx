"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
 children: React.ReactNode
 fallback?: React.ReactNode
}

interface ErrorBoundaryState {
 hasError: boolean
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
 state: ErrorBoundaryState = { hasError: false }

 static getDerivedStateFromError(): ErrorBoundaryState {
 return { hasError: true }
 }

 componentDidCatch(error: Error, info: React.ErrorInfo) {
 console.error("Unhandled application error", error, info)
 }

 private handleRetry = () => {
 this.setState({ hasError: false });
 window.location.reload();
 }

 render() {
 if (this.state.hasError) {
 return this.props.fallback ?? (
 <div className="flex min-h-[240px] items-center justify-center p-6 text-center" role="alert">
 <div className="flex max-w-sm flex-col items-center gap-3">
 <h2 className="text-lg font-semibold tracking-tight">Something went wrong</h2>
 <p className="text-sm text-muted-foreground">Please refresh the page and try again.</p>
 <Button variant="outline" size="sm" onClick={this.handleRetry} className="min-h-10">
 Refresh page
 </Button>
 </div>
 </div>
 )
 }

 return this.props.children
 }
}
