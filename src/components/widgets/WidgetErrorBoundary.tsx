import { Component, type ErrorInfo, type ReactNode } from 'react'

interface WidgetErrorBoundaryProps {
  widgetId: string
  children: ReactNode
}

interface WidgetErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class WidgetErrorBoundary extends Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): WidgetErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { widgetId } = this.props
    console.error('[dashboard] widget render failure', {
      widgetId,
      error,
      stack: errorInfo.componentStack
    })
  }

  componentDidUpdate(prevProps: WidgetErrorBoundaryProps) {
    if (prevProps.widgetId !== this.props.widgetId && this.state.hasError) {
      this.setState({ hasError: false, error: undefined })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-destructive/60 bg-destructive/10 p-4 text-sm text-destructive">
          Nu am putut încărca widget-ul.
        </div>
      )
    }

    return this.props.children
  }
}
