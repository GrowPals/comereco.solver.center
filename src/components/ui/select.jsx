import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Select Component - Modern Pastel Design System
 *
 * Selects limpios sin sombras pesadas
 * Usa gradientes pastel para estados activos
 */

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      // Base styles
      "flex h-12 w-full items-center justify-between",
      "rounded-xl px-4 py-3",
      "text-base font-medium",
      "bg-muted/30 backdrop-blur-sm",
      "border-2 border-border",
      "text-foreground placeholder:text-muted-foreground",
      // Transitions
      "transition-all duration-200",
      // Hover state
      "hover:border-slate-300 dark:hover:border-slate-600",
      "hover:bg-muted/40",
      // Focus state - sin sombras, solo color
      "focus:outline-none",
      "focus:border-blue-400 dark:focus:border-blue-500",
      "focus:bg-card/50",
      // Open state
      "data-[state=open]:border-blue-400 dark:data-[state=open]:border-blue-500",
      "data-[state=open]:bg-card/50",
      // Disabled state
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    <span className="truncate flex-1 text-left">{children}</span>
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="ml-2 h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 min-w-[8rem]',
        'overflow-hidden rounded-xl',
        'border-2 border-border',
        'bg-card/95 backdrop-blur-xl',
        'text-foreground',
        // Animations - sin sombras
        'data-[state=open]:animate-scale-in',
        'data-[state=closed]:animate-fade-out',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn('p-1', position === 'popper' && 'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]')}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('py-2 pl-8 pr-2 text-sm font-semibold text-muted-foreground', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      // Base styles
      'relative flex w-full cursor-pointer select-none items-center',
      'rounded-lg py-2.5 pl-8 pr-2',
      'text-sm text-foreground/90',
      'outline-none transition-all duration-200',
      // Hover/focus state
      'hover:bg-muted/70 hover:text-foreground',
      'focus:bg-muted/70 focus:text-foreground',
      // Selected state - con gradiente pastel sutil
      'data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-100 data-[state=checked]:to-blue-50',
      'data-[state=checked]:text-blue-900 data-[state=checked]:font-semibold',
      'dark:data-[state=checked]:from-blue-500/20 dark:data-[state=checked]:to-blue-400/10',
      'dark:data-[state=checked]:text-blue-200',
      // Disabled state
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 stroke-[2.5]" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText className="truncate">{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('my-1 h-px bg-border', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
