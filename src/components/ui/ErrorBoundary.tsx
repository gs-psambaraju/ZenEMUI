import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Card } from './Card';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <Card className="text-center">
              <div className="py-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Something went wrong
                </h3>
                <p className="text-gray-600 mb-6">
                  We encountered an unexpected error. Please try refreshing the page.
                </p>
                {this.state.error && (
                  <details className="text-left bg-gray-50 p-3 rounded mb-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700">
                      Error Details
                    </summary>
                    <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
                <div className="space-y-2">
                  <Button onClick={this.handleRetry} className="w-full">
                    Try Again
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={this.handleReload}
                    className="w-full"
                  >
                    Reload Page
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}