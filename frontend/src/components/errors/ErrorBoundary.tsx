import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex h-screen items-center justify-center bg-background">
            <p className="text-sm text-muted-foreground">
              Something went wrong. Reload the page.
            </p>
          </div>
        )
      )
    }
    return this.props.children
  }
}
