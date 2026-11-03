import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ label = 'Loading' }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-20 text-ink-soft" role="status">
    <Loader2 className="h-8 w-8 animate-spin text-pine-600" aria-hidden="true" />
    <span className="text-sm">{label}...</span>
  </div>
);

export default LoadingSpinner;
