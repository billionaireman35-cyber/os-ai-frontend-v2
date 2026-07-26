import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('OS AI crashed:', error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen w-full bg-void flex items-center justify-center px-4">
          <div className="ledger-card max-w-sm w-full p-6 text-center space-y-4">
            <AlertTriangle size={28} className="text-alert mx-auto" />
            <div>
              <p className="text-bone font-medium">Something went wrong.</p>
              <p className="text-[12px] text-muted font-mono mt-1">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="bg-brass hover:bg-brassLight text-void text-[13px] font-semibold rounded-md px-4 py-2 press-soft touch-target w-full"
            >
              Back to safety
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
