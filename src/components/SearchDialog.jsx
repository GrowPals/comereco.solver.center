
import React, { useState, useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Package, FileText, User, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { performGlobalSearch } from '@/services/searchService';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

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
    if (!debouncedQuery.trim() || !user?.company_id) {
      setResults({ productos: [], requisiciones: [], usuarios: [] });
      setIsLoading(false);
      return;
    }

    const search = async () => {
      setIsLoading(true);
      try {
        const searchResults = await performGlobalSearch(debouncedQuery, user.company_id);
        setResults(searchResults);
      } catch (error) {
        console.error('Error en búsqueda:', error);
        setResults({ productos: [], requisiciones: [], usuarios: [] });
      } finally {
        setIsLoading(false);
      }
    };

    search();
  }, [debouncedQuery, user?.company_id]);

  const handleSelect = (path) => {
    onOpenChange(false);
    setQuery('');
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (!isOpen) setQuery(''); }}>
      <DialogContent className="sm:max-w-[600px] p-0 shadow-lg border-border">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Buscar en ComerECO</DialogTitle>
        </DialogHeader>
        
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar productos, requisiciones, usuarios..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-11 text-base"
              autoFocus
            />
            {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />}
          </div>

          {debouncedQuery && (
            <div className="mt-4 max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="space-y-4 py-4">
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
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No se encontraron resultados para "{debouncedQuery}"</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {results.productos.length > 0 && (
                    <ResultSection title="Productos" icon={Package} items={results.productos} onSelect={handleSelect} renderItem={(item) => (
                      <>
                        <img src={item.image_url || "/placeholder.png"} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-muted" onError={(e) => { e.currentTarget.src = '/placeholder.png'; }} />
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
                        <FileText className="h-6 w-6 text-primary shrink-0" />
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
                         <User className="h-6 w-6 text-indigo-500 shrink-0" />
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
      <Icon className="h-4 w-4" /> {title} ({items.length})
    </h3>
    <div className="space-y-1">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onSelect(pathResolver(item))}
          className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-3"
        >
          {renderItem(item)}
        </button>
      ))}
    </div>
  </div>
);

export default SearchDialog;
