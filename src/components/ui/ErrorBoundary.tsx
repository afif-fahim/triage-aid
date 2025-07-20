/**
 * Error Boundary Component
 * Catches JavaScript errors in component tree and displays fallback UI
 */

import { Component, type ComponentChildren } from 'preact';
import { Button } from './Button';
import { Card } from './Card';
import { errorHandlingService } from '../../services';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

interface ErrorBoundaryProps {
  children: ComponentChildren;
  fallback?: ComponentChildren;
  onError?: (error: Error, errorInfo: string) => void;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    // Log the error
    const appError = errorHandlingService.createError(
      'system',
      'COMPONENT_ERROR',
      `Component error: ${error.message}`,
      {
        error: error.toString(),
        componentStack: errorInfo.componentStack,
      },
      false // Not recoverable
    );

    errorHandlingService.handleError(appError, {
      showToast: false, // Don't show toast for component errors
      logError: true,
    });

    this.setState({
      errorInfo: errorInfo.componentStack,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-medical-background flex items-center justify-center p-4">
          <Card
            variant="elevated"
            padding="lg"
            className="max-w-md w-full text-center"
          >
            <div className="mb-6">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <h2 className="text-xl font-semibold text-medical-text-primary mb-2">
                Something went wrong
              </h2>
              <p className="text-medical-text-secondary text-sm mb-4">
                The application encountered an unexpected error. This might be a
                temporary issue.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <details className="text-left bg-gray-50 p-3 rounded-md mb-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                    Error Details (Development)
                  </summary>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                    {this.state.error.toString()}
                    {this.state.errorInfo &&
                      `\n\nComponent Stack:${this.state.errorInfo}`}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="primary"
                size="md"
                onClick={this.handleRetry}
                className="flex-1 sm:flex-none"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={this.handleReload}
                className="flex-1 sm:flex-none"
              >
                Reload App
              </Button>
            </div>

            <p className="text-xs text-medical-text-secondary mt-4">
              If this problem persists, please restart the application.
            </p>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
