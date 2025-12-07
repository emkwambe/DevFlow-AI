// src/renderer/components/ErrorBoundary.tsx
// Purpose: Catch React errors and display fallback UI instead of crashing

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h1>Something went wrong</h1>
            <p>An unexpected error occurred in the application.</p>

            {this.state.error && (
              <div className="error-details">
                <h3>Error:</h3>
                <code>{this.state.error.message}</code>
              </div>
            )}

            {this.state.errorInfo && (
              <div className="error-stack">
                <h3>Component Stack:</h3>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </div>
            )}

            <div className="error-actions">
              <button
                className="btn btn-primary"
                onClick={this.handleReset}
              >
                Try Again
              </button>
              <button
                className="btn btn-secondary"
                onClick={this.handleReload}
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
