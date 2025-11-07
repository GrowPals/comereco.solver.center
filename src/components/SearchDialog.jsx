
import React, { useState, useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Package, FileText, User, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { performGlobalSearch } from '@/services/searchService';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import OptimizedImage from '@/components/OptimizedImage';
import logger from '@/utils/logger';

const SearchDialog = memo(({ open, onOpenChange }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ productos: [], requisiciones: [], usuarios: [] });
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();

  const totalResults = useMemo(() => 
    results.productos.length + results.requisiciones.length + results.usuarios.length,
    [results]
  );

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ productos: [], requisiciones: [], usuarios: [] });
      setIsLoading(false);
      return;
    }

    const search = async () => {
      setIsLoading(true);
      try {
        // CORREGIDO: performGlobalSearch ahora obtiene company_id de la sesión internamente
        const searchResults = await performGlobalSearch(debouncedQuery);
        setResults(searchResults);
      } catch (error) {
        logger.error('Error en búsqueda:', error);
        setResults({ productos: [], requisiciones: [], usuarios: [] });
      } finally {
        setIsLoading(false);
      }
    };

    search();
  }, [debouncedQuery]);

  const handleSelect = (path) => {
    onOpenChange(false);
    setQuery('');
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (!isOpen) setQuery(''); }}>
      <DialogContent className="sm:max-w-[600px] p-0 shadow-soft-md border-border" role="dialog" aria-modal="true" aria-labelledby="search-dialog-title">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle id="search-dialog-title">Buscar en ComerECO</DialogTitle>
        </DialogHeader>
        
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Buscar productos, requisiciones, usuarios..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-11 text-base"
              autoFocus
              aria-label="Campo de búsqueda"
              aria-describedby="search-results-status"
            />
            {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" aria-label="Buscando" aria-hidden="true" />}
          </div>

          {debouncedQuery && (
            <div className="mt-4 max-h-[400px] overflow-y-auto" role="region" aria-live="polite" id="search-results-status">
              {isLoading ? (
                <div className="space-y-4 py-4" role="status" aria-label="Cargando resultados">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                   <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                </div>
              ) : totalResults === 0 ? (
                <div className="text-center py-12 text-muted-foreground" role="status">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                  <p>No se encontraron resultados para &quot;{debouncedQuery}&quot;</p>
                </div>
              ) : (
                <div className="space-y-6" role="list" aria-label={`${totalResults} resultados encontrados`}>
                  {results.productos.length > 0 && (
                    <ResultSection title="Productos" icon={Package} items={results.productos} onSelect={handleSelect} renderItem={(item) => (
                      <>
                        <OptimizedImage 
                          src={item.image_url} 
                          alt={`Imagen de ${item.name}`}
                          fallback="/placeholder.svg"
                          loading="lazy"
                          className="w-10 h-10 rounded-lg object-cover bg-muted"
                        />
                        <div>
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                        </div>
                      </>
                    )} pathResolver={(item) => `/catalog#product-${item.id}`} />
                  )}

                  {results.requisiciones.length > 0 && (
                    <ResultSection title="Requisiciones" icon={FileText} items={results.requisiciones} onSelect={handleSelect} renderItem={(item) => (
                      <>
                        <FileText className="h-6 w-6 text-primary shrink-0" aria-hidden="true" />
                        <div>
                          <p className="font-medium truncate">Folio: {item.internal_folio}</p>
                          <p className="text-xs text-muted-foreground">Por: {item.profiles?.full_name || 'N/A'}</p>
                        </div>
                      </>
                    )} pathResolver={(item) => `/requisitions/${item.id}`} />
                  )}

                  {results.usuarios.length > 0 && (
                    <ResultSection title="Usuarios" icon={User} items={results.usuarios} onSelect={handleSelect} renderItem={(item) => (
                      <>
                         <User className="h-6 w-6 text-indigo-500 shrink-0" aria-hidden="true" />
                        <div>
                          <p className="font-medium truncate">{item.full_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{item.role_v2 || 'user'}</p>
                        </div>
                      </>
                    )} pathResolver={(item) => `/users#user-${item.id}`} />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

SearchDialog.displayName = 'SearchDialog';

const ResultSection = ({ title, icon: Icon, items, renderItem, onSelect, pathResolver }) => (
  <div>
    <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
      <Icon className="h-4 w-4" aria-hidden="true" /> {title} ({items.length})
    </h3>
    <div className="space-y-1" role="list">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onSelect(pathResolver(item))}
          className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          role="listitem"
          aria-label={`${title}: ${item.name || item.internal_folio || item.full_name}`}
        >
          {renderItem(item)}
        </button>
      ))}
    </div>
  </div>
);

export default SearchDialog;
