import React from 'react';
import { cn } from '../../lib/cn';

export function Alert({ className, variant = 'warning', children, ...props }) {
  const variants = {
    warning: 'bg-orange-50 border-orange-300 text-orange-800',
    info: 'bg-blue-50 border-blue-300 text-blue-800',
    success: 'bg-green-50 border-green-300 text-green-800',
    destructive: 'bg-red-50 border-red-300 text-red-800',
  };
  return (
    <div
      className={cn('rounded-md border p-3 text-sm flex items-center justify-between', variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}