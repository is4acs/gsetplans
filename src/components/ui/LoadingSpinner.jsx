import { memo } from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = memo(function LoadingSpinner({ size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <Loader2 className={`${sizes[size]} animate-spin text-emerald-500`} />
  );
});

export default LoadingSpinner;
