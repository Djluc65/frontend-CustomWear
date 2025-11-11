import React from 'react';
import { cn } from '../../lib/cn';

export function Label({ className, children, ...props }) {
  return (
    <label className={cn('text-sm font-medium text-gray-700', className)} {...props}>
      {children}
    </label>
  );
}