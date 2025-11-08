import React from 'react';
import { cn } from "@/lib/utils";

/**
 * Variantes de iconos según contexto
 */
const iconVariants = {
  // Icono simple - SIN fondo, solo el icono en color
  simple: {
    wrapper: "",
    icon: "text-blue-600 dark:text-blue-400"
  },

  // Icono con fondo sutil - Para elementos que necesitan un poco más de presencia
  subtle: {
    wrapper: "bg-slate-100 dark:bg-slate-700/50 rounded-full p-2",
    icon: "text-blue-600 dark:text-blue-400"
  },

  // Icono destacado - Para elementos MUY importantes (usar con moderación)
  prominent: {
    wrapper: "bg-blue-600 dark:bg-blue-500 rounded-full p-2",
    icon: "text-white"
  },

  // Icono en badge neutral - Para información secundaria
  neutral: {
    wrapper: "bg-slate-100 dark:bg-slate-700/50 rounded-full p-2",
    icon: "text-slate-600 dark:text-slate-400"
  }
};

/**
 * Wrapper genérico para iconos
 */
export function IconWrapper({
  icon: Icon,
  variant = "simple",
  size = "md",
  className
}) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8"
  };

  const wrapperSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const config = iconVariants[variant];

  // Si es "simple", no usar wrapper
  if (variant === "simple") {
    return <Icon className={cn(sizes[size], config.icon, className)} />;
  }

  return (
    <div className={cn(wrapperSizes[size], config.wrapper, "flex items-center justify-center shrink-0", className)}>
      <Icon className={cn(sizes[size], config.icon)} />
    </div>
  );
}

/**
 * Icono para estadísticas (dashboard)
 */
export function StatIcon({ icon: Icon, className }) {
  return (
    <div className={cn(
      "w-12 h-12 rounded-lg",
      "bg-blue-50 dark:bg-blue-900/20",
      "flex items-center justify-center",
      "shrink-0",
      className
    )}>
      <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
    </div>
  );
}

/**
 * Icono para headers de sección
 */
export function SectionIcon({ icon: Icon, className }) {
  return (
    <Icon className={cn(
      "w-5 h-5 text-blue-600 dark:text-blue-400",
      className
    )} />
  );
}
