import React from 'react';
import { cn } from '../../lib/cn';

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white shadow-sm', className)} {...props}>
      {children}
    </div>
  );
}
export function CardHeader({ className, children }) {
  return <div className={cn('border-b border-gray-200 p-4', className)}>{children}</div>;
}
export function CardTitle({ className, children }) {
  return <h3 className={cn('text-base font-semibold text-gray-900', className)}>{children}</h3>;
}
export function CardContent({ className, children }) {
  return <div className={cn('p-4', className)}>{children}</div>;
}