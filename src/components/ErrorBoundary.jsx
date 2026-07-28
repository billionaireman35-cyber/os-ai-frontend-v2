import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[var(--color-bg)] flex items-center justify-center px-4">
          <div className="ledger-card max-w-md w-full p-6 text-center space-y-4">
            <AlertTriangle size={48} className="text-[var(--color-danger)] mx-auto" />
            <h2 className="text-xl font-display text-[var(--color-text-primary)]">Something went wrong</h2>
            <p className="text-[var(--color-text-muted)] text-sm">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-brass hover:bg-brassLight text-void font-semibold rounded-md px-4 py-2"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
