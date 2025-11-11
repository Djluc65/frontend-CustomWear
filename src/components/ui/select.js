import React from 'react';
import { cn } from '../../lib/cn';

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn('h-9 rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500', className)}
      {...props}
    >
      {children}
    </select>
  );
}