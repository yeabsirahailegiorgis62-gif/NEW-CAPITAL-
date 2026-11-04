// COMPONENT: Class error boundary. Catches render crashes so the SPA can show a recovery screen.
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                Application Rendering Notice
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                An unexpected view state occurred while rendering this view. You can reload the dashboard or return to the main fleet overview.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 text-xs text-slate-700 dark:text-slate-300 font-mono">
                <div className="font-semibold text-rose-600 dark:text-rose-400 mb-1 flex items-center justify-between">
                  <span>{this.state.error.name}: {this.state.error.message}</span>
                  <button
                    type="button"
                    onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                    className="text-[11px] underline text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 ml-2 shrink-0"
                  >
                    {this.state.showDetails ? (
                      <>Hide Stack <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>View Stack <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                </div>
                {this.state.showDetails && this.state.error.stack && (
                  <pre className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap max-h-40 p-2 bg-slate-100 dark:bg-slate-900 rounded">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm bg-brand-600 hover:bg-brand-700 text-white shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition-all"
              >
                <Home className="w-4 h-4" />
                Return to Overview
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
