
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FileText, Package, User, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { performGlobalSearch } from '@/services/searchService';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

const GlobalSearch = ({ variant = 'desktop' }) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState({ productos: [], requisiciones: [], usuarios: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const popoverRef = useRef(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const isMobileVariant = variant === 'mobile';

  useEffect(() => {
    const abortController = new AbortController();

    if (debouncedSearchTerm.length >= 2) {
      setIsLoading(true);
      performGlobalSearch(debouncedSearchTerm, { signal: abortController.signal })
        .then(data => {
          if (!abortController.signal.aborted) {
            setResults(data);
            setIsLoading(false);
          }
        })
        .catch((error) => {
          if (error.name !== 'AbortError' && !abortController.signal.aborted) {
            setResults({ productos: [], requisiciones: [], usuarios: [] });
            setIsLoading(false);
          }
        });
    } else {
      setResults({ productos: [], requisiciones: [], usuarios: [] });
    }

    return () => {
      abortController.abort();
    };
  }, [debouncedSearchTerm]);

  const handleSelect = useCallback((type, id) => {
    setOpen(false);
    setSearchTerm('');
    setIsInteracting(false);
    if (type === 'product') {
      navigate(`/products/${id}`);
    } else if (type === 'requisition') {
      navigate(`/requisitions/${id}`);
    } else if (type === 'user') {
      navigate(`/users`);
    }
  }, [navigate]);

  const handleInputFocus = useCallback(() => {
    setIsInteracting(true);
    setOpen(true);
  }, []);

  const handleInputChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    if (!open) {
      setOpen(true);
    }
  }, [open]);

  const handleClearSearch = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    setSearchTerm('');
    setOpen(false);
    inputRef.current?.focus();
  }, []);

  const handleOpenChange = useCallback((newOpen) => {
    // Solo cerrar si no estamos interactuando con el input
    if (!newOpen && !isInteracting) {
      setOpen(false);
    } else if (newOpen) {
      setOpen(true);
    }
  }, [isInteracting]);

  const totalResults = results.productos.length + results.requisiciones.length + results.usuarios.length;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div className="relative flex-1">
          <Search className={cn(
            'pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/80 transition-colors',
            isMobileVariant && 'dark:text-primary-200/60',
            !isMobileVariant && 'dark:text-primary-200/75'
          )} />
          <input
            ref={inputRef}
            type="text"
            placeholder={isMobileVariant ? 'Buscar' : 'Buscar requisiciones, productos...'}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={() => {
              // Pequeño delay para permitir clics en los resultados
              setTimeout(() => setIsInteracting(false), 200);
            }}
            className={cn(
              'w-full border focus:outline-none transition-all duration-200',
              isMobileVariant
                ? 'h-12 rounded-2xl border-border/80 bg-[var(--surface-contrast)] pl-12 pr-4 text-base font-medium text-foreground shadow-sm focus:border-primary-500 focus:shadow-[var(--focus-glow)] dark:border-border dark:bg-[rgba(14,28,52,0.9)] dark:text-primary-50 dark:focus:border-[rgba(124,188,255,0.55)] dark:focus:shadow-[var(--focus-glow)]'
                : 'h-11 rounded-xl border-border/80 bg-[var(--surface-contrast)] pl-12 pr-4 text-foreground shadow-sm focus:border-primary-500 focus:shadow-[var(--focus-glow)] dark:border-[#183257] dark:bg-[#0b1a34] dark:text-primary-50 dark:placeholder:text-primary-200/40 dark:focus:border-[rgba(124,188,255,0.55)] dark:focus:shadow-[var(--focus-glow)] dark:hover:bg-[#122647]'
            )}
            aria-label="Buscar en la aplicación"
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              onMouseDown={(e) => e.preventDefault()} // Prevenir pérdida de foco
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground',
                isMobileVariant && 'text-muted-foreground hover:text-foreground'
              )}
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        ref={popoverRef}
        className={cn(
          'max-h-[500px] overflow-hidden p-0',
          isMobileVariant ? 'w-[min(420px,calc(100vw-2rem))]' : 'w-[400px]'
        )}
        align={isMobileVariant ? 'center' : 'start'}
        onInteractOutside={(e) => {
          // Prevenir cierre si el click es en el input principal
          if (inputRef.current && inputRef.current.contains(e.target)) {
            e.preventDefault();
          }
        }}
      >
        <div className="max-h-[420px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : searchTerm.length < 2 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">Escribe al menos 2 caracteres para buscar...</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">No se encontraron resultados para &quot;{searchTerm}&quot;</p>
            </div>
          ) : (
            <div className="p-2">
              {results.productos.length > 0 && (
                <div className="mb-4">
                  <h3 className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">Productos</h3>
                  {results.productos.map((product) => (
                    <button
                      key={product.id}
                      onMouseDown={(e) => e.preventDefault()} // Prevenir pérdida de foco
                      onClick={() => handleSelect('product', product.id)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/70 dark:hover:bg-[#13294a]"
                    >
                      <Package className="h-4 w-4 flex-shrink-0 text-primary-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.requisiciones.length > 0 && (
                <div className="mb-4">
                  <h3 className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">Requisiciones</h3>
                  {results.requisiciones.map((req) => (
                    <button
                      key={req.id}
                      onMouseDown={(e) => e.preventDefault()} // Prevenir pérdida de foco
                      onClick={() => handleSelect('requisition', req.id)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/70 dark:hover:bg-[#13294a]"
                    >
                      <FileText className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">Folio: {req.internal_folio}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{req.comments || 'Sin comentarios'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.usuarios.length > 0 && (
                <div>
                  <h3 className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">Usuarios</h3>
                  {results.usuarios.map((user) => (
                    <button
                      key={user.id}
                      onMouseDown={(e) => e.preventDefault()} // Prevenir pérdida de foco
                      onClick={() => handleSelect('user', user.id)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/70 dark:hover:bg-[#13294a]"
                    >
                      <User className="h-4 w-4 flex-shrink-0 text-purple-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user.role_v2}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default GlobalSearch;
