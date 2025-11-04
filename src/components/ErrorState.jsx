/**
 * ErrorState Component
 * Componente reutilizable para mostrar estados de error con contexto
 */
import React from 'react';
import { AlertTriangle, RefreshCw, LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorContext } from '@/utils/errorHandler';
import { cn } from '@/lib/utils';

const ErrorState = ({ 
  error, 
  onRetry, 
  onBack,
  title = null,
  className = '',
  showDetails = false 
}) => {
  const errorContext = error ? getErrorContext(error) : null;

  if (!errorContext) {
    return null;
  }

  const handleAction = () => {
    if (errorContext.action) {
      if (errorContext.action.path) {
        window.location.href = errorContext.action.path;
      } else if (errorContext.action.fn === 'retry' && onRetry) {
        onRetry();
      }
    }
  };

  const getIcon = () => {
    switch (errorContext.type) {
      case 'auth':
        return <LogIn className="h-12 w-12 text-warning" />;
      case 'network':
        return <RefreshCw className="h-12 w-12 text-info" />;
      default:
        return <AlertTriangle className="h-12 w-12 text-error" />;
    }
  };

  return (
    <Card className={cn("border-2", className)}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>
        <CardTitle className="text-xl">
          {title || getErrorTitle(errorContext.type)}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">
          {errorContext.message}
        </p>
        
        {showDetails && error?.message && (
          <details className="text-left mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Detalles técnicos
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {error.message}
            </pre>
          </details>
        )}

        <div className="flex gap-2 justify-center flex-wrap">
          {errorContext.retryable && onRetry && (
            <Button
              onClick={onRetry}
              variant="default"
              className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Reintentar operación"
            >
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Reintentar
            </Button>
          )}
          
          {errorContext.action && (
            <Button
              onClick={handleAction}
              variant={errorContext.type === 'auth' ? 'default' : 'outline'}
              className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label={errorContext.action.label}
            >
              {errorContext.action.label}
            </Button>
          )}

          {onBack && (
            <Button
              onClick={onBack}
              variant="ghost"
              className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Volver"
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Volver
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const getErrorTitle = (type) => {
  const titles = {
    auth: 'Sesión Expirada',
    network: 'Error de Conexión',
    permission: 'Sin Permisos',
    validation: 'Error de Validación',
    server: 'Error del Servidor',
    unknown: 'Error Inesperado'
  };
  return titles[type] || titles.unknown;
};

export default ErrorState;

