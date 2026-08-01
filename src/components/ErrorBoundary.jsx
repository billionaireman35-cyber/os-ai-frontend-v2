import { Component } from 'react';

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
        <div style={{ padding: '2rem', background: '#0A1114', color: '#E9E4D8', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: '2rem', color: '#ef4444' }}>Something went wrong</h1>
          <p style={{ marginTop: '1rem' }}>{this.state.error?.message || 'Unknown error'}</p>
          <pre style={{ background: '#1a1a1a', padding: '1rem', borderRadius: '0.5rem', maxWidth: '80%', overflow: 'auto', color: '#f0f0f0', fontSize: '0.8rem' }}>
            {this.state.error?.stack || ''}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#c98a3e', border: 'none', borderRadius: '0.5rem', color: '#0A1114', fontWeight: 'bold' }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
