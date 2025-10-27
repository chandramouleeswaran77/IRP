import React from 'react';
import { cn } from '../../utils/cn';

const Avatar = ({ src, alt, fallback, size = 'default', className = '', ...props }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    default: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center rounded-full bg-muted',
            textSizeClasses[size]
          )}
        >
          {fallback}
        </div>
      )}
    </div>
  );
};

export default Avatar;


