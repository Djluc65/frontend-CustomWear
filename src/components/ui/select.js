import React from 'react';
import { cn } from '../../lib/cn';
import { FiChevronDown } from 'react-icons/fi';

export const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      className={cn(
        'relative flex h-9 w-full items-center overflow-hidden rounded-md border border-gray-300 bg-white text-sm shadow-sm ring-offset-background focus-within:ring-2 focus-within:ring-blue-500',
        className
      )}
    >
      <select
        ref={ref}
        className="h-full w-full appearance-none bg-transparent px-3 py-2 pr-8 font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      >
        {children}
      </select>
      <FiChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 opacity-50 pointer-events-none" />
    </div>
  );
});
Select.displayName = 'Select';
