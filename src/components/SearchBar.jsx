import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SearchBar({ value, onChange, placeholder, className }) {
  return (
    <div className={cn('relative flex-1', className)}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <label htmlFor="search-input" className="sr-only">
        {placeholder || 'Buscar'}
      </label>
      <Input
        id="search-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-12 pr-10"
        aria-label={placeholder || 'Buscar'}
      />
      {value && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
          onClick={() => onChange('')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}