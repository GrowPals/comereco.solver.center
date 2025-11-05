/**
 * ErrorBoundary Component - Enhanced Version
 *
 * React Error Boundary para capturar errores en el árbol de componentes
 * y mostrar un fallback UI elegante sin romper toda la aplicación.
 *
 * @see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ErrorState from './ErrorState';
import logger from '@/utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Actualizar estado para mostrar fallback UI en el próximo render
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('ErrorBoundary caught an error:', { error, errorInfo });

    this.setState({
      errorInfo,
    });

    // TODO: Implementar logging a servicio externo en producción
    // if (import.meta.env.PROD) {
    //   Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Si hay callback de reset personalizado, usarlo
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      const { level = 'page', fallback } = this.props;

      // Si hay fallback personalizado, usarlo
      if (fallback) {
        return typeof fallback === 'function'
          ? fallback({
              error: this.state.error,
              errorInfo: this.state.errorInfo,
              reset: this.handleReset,
            })
          : fallback;
      }

      // Fallback según nivel de error
      if (level === 'component') {
        // Error a nivel de componente - UI más discreta
        return (
          <div className="rounded-lg border border-error bg-error/10 p-4 dark:border-error dark:bg-error/15">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="mb-1 font-semibold text-foreground">
                  Error en el componente
                </h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Este componente no se pudo cargar correctamente.
                </p>
                <Button
                  onClick={this.handleReset}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Reintentar
                </Button>
              </div>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer font-medium text-muted-foreground">
                  Detalles técnicos (solo en desarrollo)
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-card p-2 text-xs text-foreground">
                  {this.state.error.toString()}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        );
      }

      // Error a nivel de página - Usar ErrorState component
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <ErrorState 
            error={this.state.error}
            onRetry={this.handleReset}
            title="Error de la Aplicación"
            showDetails={process.env.NODE_ENV === 'development'}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * HOC para envolver componentes con ErrorBoundary fácilmente
 */
export function withErrorBoundary(Component, errorBoundaryProps = {}) {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || 'Component'
  })`;

  return WrappedComponent;
}

/**
 * Ejemplo de uso:
 *
 * // A nivel de página (default)
 * <ErrorBoundary>
 *   <MyPage />
 * </ErrorBoundary>
 *
 * // A nivel de componente
 * <ErrorBoundary level="component">
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * // Con fallback personalizado
 * <ErrorBoundary
 *   fallback={({ error, reset }) => (
 *     <CustomError error={error} onReset={reset} />
 *   )}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * // Usando HOC
 * export default withErrorBoundary(MyComponent, { level: 'component' });
 */
