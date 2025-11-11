import React from 'react';
import { cn } from '../../lib/cn';

export function Checkbox({ className, label, ...props }) {
  return (
    <label className={cn('inline-flex items-center gap-2 text-sm text-gray-700', className)}>
      <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" {...props} />
      {label && <span>{label}</span>}
    </label>
  );
}