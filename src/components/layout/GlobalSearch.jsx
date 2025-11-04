
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
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const isMobileVariant = variant === 'mobile';

  useEffect(() => {
    if (debouncedSearchTerm.length >= 2) {
      setIsLoading(true);
      performGlobalSearch(debouncedSearchTerm)
        .then(data => {
          setResults(data);
          setIsLoading(false);
        })
        .catch(() => {
          setResults({ productos: [], requisiciones: [], usuarios: [] });
          setIsLoading(false);
        });
    } else {
      setResults({ productos: [], requisiciones: [], usuarios: [] });
    }
  }, [debouncedSearchTerm]);

  const handleSelect = useCallback((type, id) => {
    setOpen(false);
    setSearchTerm('');
    if (type === 'product') {
      navigate('/catalog');
    } else if (type === 'requisition') {
      navigate(`/requisitions/${id}`);
    } else if (type === 'user') {
      navigate(`/users`);
    }
  }, [navigate]);

  const totalResults = results.productos.length + results.requisiciones.length + results.usuarios.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative flex-1">
          <Search className={cn(
            'pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400',
            isMobileVariant && 'text-slate-500'
          )} />
          <input
            ref={inputRef}
            type="text"
            placeholder={isMobileVariant ? 'Buscar' : 'Buscar requisiciones, productos...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setOpen(true)}
            className={cn(
              'w-full border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all',
              isMobileVariant
                ? 'h-12 rounded-2xl border-slate-200 bg-slate-100 pl-12 pr-4 text-base font-medium text-slate-900 focus:bg-white shadow-sm'
                : 'h-11 rounded-xl border-slate-200 bg-slate-50 pl-12 pr-4'
            )}
            aria-label="Buscar en la aplicación"
          />
          {searchTerm && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSearchTerm('');
                inputRef.current?.focus();
              }}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600',
                isMobileVariant && 'text-slate-500 hover:text-slate-700'
              )}
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'max-h-[500px] overflow-hidden p-0',
          isMobileVariant ? 'w-[min(420px,calc(100vw-2rem))]' : 'w-[400px]'
        )}
        align={isMobileVariant ? 'center' : 'start'}
      >
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm"
            />
          </div>
        </div>
        <div className="overflow-y-auto max-h-[420px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : searchTerm.length < 2 ? (
            <div className="p-8 text-center text-slate-500">
              <p className="text-sm">Escribe al menos 2 caracteres para buscar...</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p className="text-sm">No se encontraron resultados</p>
            </div>
          ) : (
            <div className="p-2">
              {results.productos.length > 0 && (
                <div className="mb-4">
                  <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Productos</h3>
                  {results.productos.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelect('product', product.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-left"
                    >
                      <Package className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{product.name}</p>
                        <p className="text-xs text-slate-500">SKU: {product.sku}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.requisiciones.length > 0 && (
                <div className="mb-4">
                  <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Requisiciones</h3>
                  {results.requisiciones.map((req) => (
                    <button
                      key={req.id}
                      onClick={() => handleSelect('requisition', req.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-left"
                    >
                      <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">Folio: {req.internal_folio}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{req.comments || 'Sin comentarios'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.usuarios.length > 0 && (
                <div>
                  <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Usuarios</h3>
                  {results.usuarios.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelect('user', user.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-left"
                    >
                      <User className="h-4 w-4 text-purple-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{user.full_name}</p>
                        <p className="text-xs text-slate-500 capitalize">{user.role_v2}</p>
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
