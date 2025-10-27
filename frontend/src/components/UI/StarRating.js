import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../utils/cn';

const StarRating = ({ 
  rating = 0, 
  onRatingChange, 
  maxRating = 5, 
  size = 'default',
  interactive = false,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6',
  };

  const handleStarClick = (starIndex) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  const handleStarHover = (starIndex) => {
    // Could add hover effects here if needed
  };

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {Array.from({ length: maxRating }, (_, index) => {
        const isFilled = index < rating;
        const isHalfFilled = index === Math.floor(rating) && rating % 1 !== 0;
        
        return (
          <button
            key={index}
            type="button"
            className={cn(
              'transition-colors duration-150',
              interactive && 'cursor-pointer hover:scale-110',
              !interactive && 'cursor-default'
            )}
            onClick={() => handleStarClick(index)}
            onMouseEnter={() => handleStarHover(index)}
            disabled={!interactive}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled || isHalfFilled
                  ? 'text-yellow-500 fill-current'
                  : 'text-gray-300',
                isHalfFilled && 'opacity-50'
              )}
            />
          </button>
        );
      })}
      {rating > 0 && (
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
