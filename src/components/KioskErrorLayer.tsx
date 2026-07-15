import React from 'react';
import { useNavigate } from 'react-router-dom';
import { KioskErrorOverlay } from './KioskErrorOverlay';

type BoundaryState = {
  hasError: boolean;
  error: Error | null;
};

class KioskErrorBoundary extends React.Component<
  React.PropsWithChildren<{ onReset: () => void }>,
  BoundaryState
> {
  state: BoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Kiosk render error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <KioskErrorOverlay
          message={this.state.error.message || 'Something went wrong while rendering the kiosk.'}
          details={this.state.error.stack || undefined}
          onRetry={this.handleReset}
          onHome={this.props.onReset}
        />
      );
    }

    return this.props.children;
  }
}

export const KioskErrorLayer: React.FC<React.PropsWithChildren> = ({ children }) => {
  const navigate = useNavigate();
  const [runtimeError, setRuntimeError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = event.error instanceof Error ? event.error : new Error(event.message || 'Unknown kiosk error');
      console.error('Kiosk runtime error:', error);
      setRuntimeError(error);
      event.preventDefault();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const error = reason instanceof Error ? reason : new Error(typeof reason === 'string' ? reason : 'Unhandled promise rejection');
      console.error('Kiosk unhandled rejection:', error);
      setRuntimeError(error);
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const resetToHome = React.useCallback(() => {
    setRuntimeError(null);
    navigate('/', { replace: true });
  }, [navigate]);

  if (runtimeError) {
    return (
      <KioskErrorOverlay
        title="Runtime Error"
        message={runtimeError.message || 'The kiosk encountered a browser error.'}
        details={runtimeError.stack || undefined}
        onRetry={resetToHome}
        onHome={resetToHome}
      />
    );
  }

  return <KioskErrorBoundary onReset={resetToHome}>{children}</KioskErrorBoundary>;
};
