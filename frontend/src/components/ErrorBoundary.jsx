import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#06080d',
          color: '#e6edf3',
          fontFamily: 'Outfit, sans-serif',
          padding: '2rem',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '1rem',
            }}
          >
            Algo salio mal
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#8b949e',
              marginBottom: '1.5rem',
            }}
          >
            Ha ocurrido un error inesperado. Por favor, recarga la pagina para
            intentar de nuevo.
          </p>
          {this.state.error && (
            <pre
              style={{
                fontSize: '0.75rem',
                color: '#f87171',
                backgroundColor: '#161b22',
                padding: '1rem',
                borderRadius: '0.5rem',
                textAlign: 'left',
                overflow: 'auto',
                maxHeight: '200px',
                marginBottom: '1.5rem',
              }}
            >
              {this.state.error.message || String(this.state.error)}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#2dd4a8',
              color: '#06080d',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.625rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Recargar pagina
          </button>
        </div>
      </div>
    );
  }
}
