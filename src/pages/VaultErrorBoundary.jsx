import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export class VaultErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Vault error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <AlertTriangle size={28} className="text-alert mx-auto" />
          <p className="text-[var(--color-text-primary)] mt-2">Something went wrong in the Vault.</p>
          <p className="text-[11px] text-[var(--color-text-muted)] font-mono">{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
