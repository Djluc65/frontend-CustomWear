import React from 'react';
import { cn } from '../../lib/cn';

export function Button({ className, variant = 'default', size = 'default', asChild, children, ...props }) {
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50',
    ghost: 'bg-transparent text-gray-800 hover:bg-gray-100',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
  };
  const sizes = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 px-3',
    lg: 'h-10 px-5',
  };
  const cls = cn(
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50',
    variants[variant] || variants.default,
    sizes[size] || sizes.default,
    className
  );
  if (asChild) {
    return React.cloneElement(children, { className: cn(cls, children.props.className), ...props });
  }
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}