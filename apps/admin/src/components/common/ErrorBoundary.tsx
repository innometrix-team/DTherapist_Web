import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  name?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Modern React Error Boundary for Admin portal.
 * Catches JavaScript errors anywhere in child component trees,
 * logs them, and displays a resilient fallback UI instead of crashing the admin portal.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (loggingError) {
        console.error("Error in ErrorBoundary onError callback:", loggingError);
      }
    }
    if (import.meta.env.DEV) {
      console.error(
        `[Admin:ErrorBoundary${this.props.name ? `:${this.props.name}` : ""}] Uncaught runtime error:`,
        error,
        errorInfo
      );
    }
  }

  public reset = (): void => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback(
          this.state.error || new Error("Unknown error"),
          this.reset
        );
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isWidget = Boolean(this.props.name);

      return (
        <div
          role="alert"
          className={`flex flex-col items-center justify-center text-center p-6 bg-white border border-divider rounded-2xl shadow-sm ${
            isWidget ? "my-4 w-full" : "min-h-[50vh] m-6"
          }`}
        >
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>

          <h2 className="text-lg font-semibold text-darkerb mb-2">
            {this.props.name
              ? `Unable to load ${this.props.name}`
              : "Something went wrong"}
          </h2>

          <p className="text-sm text-neutral max-w-md mb-6">
            An unexpected error occurred while rendering this section. You can try
            reloading or return to the main administration panel.
          </p>

          {import.meta.env.DEV && this.state.error && (
            <pre className="text-xs text-left bg-gray-50 border border-divider p-3 rounded-lg max-w-md overflow-x-auto text-red-600 mb-6 font-mono">
              {this.state.error.message}
            </pre>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.reset}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>

            {!isWidget && (
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-darkerb bg-offwhite hover:bg-gray-200 border border-divider rounded-xl transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Return to Admin Panel
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

